from fastapi import APIRouter, HTTPException, Query, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from ..schemas.transaction import Transaction
from ..core.explainer import get_explanations
from ..core.risk_engine import risk_engine
from ..core.graph_engine import graph_engine
from ..core.drift_monitor import drift_monitor
from ..core.federated_simulator import federated_simulator
from ..core.behavioral_engine import behavioral_engine
from ..core import data_loader
from ..core.security import (
    get_current_user_optional, require_role, check_rate_limit,
    get_client_ip, record_audit_event
)
from ..core.logger import get_logger
import math

logger = get_logger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic validation model for /analyze endpoint
# ---------------------------------------------------------------------------
class AnalyzePayload(BaseModel):
    """
    Flexible transaction payload supporting all 4 fraud detection domains:
    - paysim: step, type, amount, nameOrig, nameDest, balance fields
    - creditcard: V1-V28 PCA components + Amount
    - spatial: lat, long, merch_lat, merch_long + standard fields
    - banksim: age, gender, category + amount
    """
    # PaYSim / Generic fields
    step: Optional[int] = Field(None, ge=0)
    type: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    amt: Optional[float] = Field(None, ge=0)            # banksim alias
    nameOrig: Optional[str] = None
    oldbalanceOrg: Optional[float] = None
    newbalanceOrig: Optional[float] = None
    nameDest: Optional[str] = None
    oldbalanceDest: Optional[float] = None
    newbalanceDest: Optional[float] = None

    # Spatial domain
    lat: Optional[float] = None
    long: Optional[float] = None
    merch_lat: Optional[float] = None
    merch_long: Optional[float] = None

    # BankSim domain
    age: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None

    # Device / network context (enrichment fields)
    device_id: Optional[str] = None
    ip_address: Optional[str] = None

    class Config:
        extra = "allow"  # Allow V1-V28 PCA fields and any domain-specific extras


@router.post("/analyze")
async def analyze_transaction(
    request: Request,
    payload: AnalyzePayload,
    domain: Optional[str] = "paysim",
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    import app.core.model_engine as engine

    client_ip = get_client_ip(request)
    # Anti-abuse rate limiter: 120 req/minute per IP
    check_rate_limit(f"analyze_{client_ip}", max_requests=120, window_seconds=60)

    # Convert validated Pydantic model to dict (includes V1-V28 extras)
    payload_dict = payload.model_dump(exclude_none=True)

    selected_domain = (domain or "paysim").lower()

    # Auto-detect domain from payload keys
    if "V1" in payload_dict or "v1" in payload_dict:
        selected_domain = "creditcard"
    elif "lat" in payload_dict and "merch_lat" in payload_dict:
        selected_domain = "spatial"

    if selected_domain not in engine.domain_models:
        selected_domain = "paysim"

    model = engine.domain_models.get(selected_domain, engine.model)
    meta = engine.domain_metadata.get(selected_domain, engine.feature_metadata)

    if model is None:
        raise HTTPException(status_code=500, detail=f"Model for domain '{selected_domain}' not loaded.")

    # 1. Preprocess transaction features
    raw_df, scaled_data = engine.preprocess_transaction(payload_dict, domain=selected_domain)

    # 2. Get raw ML Stacking Ensemble prediction probability
    try:
        raw_prob = float(model.predict_proba(scaled_data)[0][1])
    except Exception:
        raw_prob = 0.50

    sender = str(payload_dict.get("nameOrig", "C_ANON_SRC"))
    receiver = str(payload_dict.get("nameDest", "M_ANON_DST"))
    device = str(payload_dict.get("device_id") or payload_dict.get("device") or f"DEV_{abs(hash(sender)) % 1000}")
    ip = str(payload_dict.get("ip_address") or payload_dict.get("ip") or f"192.168.1.{abs(hash(sender)) % 254}")

    # 3. Execute Adaptive Multi-Signal Risk Engine
    risk_output = risk_engine.compute_composite_risk(
        ml_prob=raw_prob,
        txn_dict=payload_dict,
        sender=sender,
        receiver=receiver,
        device=device,
        ip=ip
    )

    # 4. Log into Concept Drift Monitor window
    drift_monitor.log_incoming_transaction(payload_dict)

    # 5. TreeSHAP & Reason Code Generation
    feat_names = meta["features"] if meta and "features" in meta else list(payload_dict.keys())
    xai_output = get_explanations(
        scaled_data=scaled_data,
        feature_names=feat_names,
        raw_payload=payload_dict,
        risk_score=risk_output["composite_risk_score"]
    )

    # Audit high-risk transactions
    if risk_output["decision"] == "Block":
        record_audit_event(
            actor=user["email"] if user else "external_client",
            role=user["role"] if user else "automated_system",
            ip=client_ip,
            action="TRANSACTION_BLOCKED",
            status="BLOCKED",
            details=(
                f"High risk score ({risk_output['composite_risk_score']}) on domain {selected_domain}. "
                f"Reason: {xai_output['human_readable_reason_codes'][0]['title'] if xai_output['human_readable_reason_codes'] else 'Risk Threshold Breached'}"
            )
        )
        logger.info("transaction_blocked", domain=selected_domain, risk_score=risk_output["composite_risk_score"], ip=client_ip)

    return {
        "domain": selected_domain,
        "raw_prob": round(raw_prob, 4),
        "risk_score": risk_output["composite_risk_score"],
        "decision": risk_output["decision"],
        "status": risk_output["status"],
        "action_code": risk_output["action_code"],
        "action_description": risk_output["action_description"],
        "step_up_challenge": risk_output["step_up_challenge"],
        "is_fraud": risk_output["decision"] == "Block",
        "signal_breakdown": risk_output["signal_breakdown"],
        "explanations": xai_output["feature_attributions"],
        "reason_codes": xai_output["human_readable_reason_codes"],
        "compliance_card": xai_output["fcra_compliance_card"]
    }


# --- Graph Intelligence Endpoints ---
@router.get("/graph/network")
def get_graph_network():
    return graph_engine.get_full_network_data()

@router.get("/graph/rings")
def get_detected_fraud_rings():
    return {"fraud_rings": graph_engine.detect_all_fraud_rings()}


# --- Concept Drift & MLOps Endpoints ---
@router.get("/drift/status")
def get_drift_status():
    return drift_monitor.get_drift_status()

@router.post("/drift/simulate-spike")
def simulate_drift_spike(
    request: Request,
    drift_type: Optional[str] = "HIGH_AMOUNT_BURST",
    user: Dict[str, Any] = Depends(require_role(["admin"]))
):
    d_type = drift_type if isinstance(drift_type, str) else "HIGH_AMOUNT_BURST"
    drift_monitor.trigger_synthetic_drift(d_type)
    record_audit_event(
        actor=user["email"],
        role=user["role"],
        ip=get_client_ip(request),
        action="DRIFT_SPIKE_SIMULATED",
        status="SUCCESS",
        details=f"Admin triggered synthetic concept drift spike of type: {d_type}"
    )
    return drift_monitor.get_drift_status()


# --- Federated Learning Simulator Endpoints ---
@router.get("/federated/state")
def get_federated_state():
    return federated_simulator.get_simulation_state()

@router.post("/federated/simulate-round")
def run_federated_round(
    request: Request,
    user: Dict[str, Any] = Depends(require_role(["admin"]))
):
    result = federated_simulator.run_federated_round()
    record_audit_event(
        actor=user["email"],
        role=user["role"],
        ip=get_client_ip(request),
        action="FEDERATED_ROUND_EXECUTED",
        status="SUCCESS",
        details=f"Admin triggered FedAvg aggregation round {result.get('round', 'N/A')}"
    )
    return result


# --- Behavioral Baseline Profile Endpoint ---
@router.get("/behavioral/profile/{customer_id}")
def get_customer_profile(customer_id: str):
    return behavioral_engine.get_or_create_profile(customer_id)


# --- Standard Health & Seed Endpoints ---
@router.get("/health")
def health_check():
    import app.core.model_engine as engine
    return {
        "status": "online",
        "model_loaded": len(engine.domain_models) > 0,
        "domains_loaded": list(engine.domain_models.keys()),
        "graph_nodes_loaded": graph_engine.graph.number_of_nodes(),
        "graph_edges_loaded": graph_engine.graph.number_of_edges(),
        "drift_monitor_samples": len(drift_monitor.current_window)
    }

@router.get("/transaction/random")
def get_random_transaction_endpoint():
    txn = data_loader.get_random_transaction()
    if txn is None:
        raise HTTPException(status_code=500, detail="Data not loaded.")

    return {
        "step": int(txn["step"]),
        "type": str(txn["type"]),
        "amount": float(txn["amount"]),
        "nameOrig": str(txn["nameOrig"]),
        "oldbalanceOrg": float(txn["oldbalanceOrg"]),
        "newbalanceOrig": float(txn["newbalanceOrig"]),
        "nameDest": str(txn["nameDest"]),
        "oldbalanceDest": float(txn["oldbalanceDest"]),
        "newbalanceDest": float(txn["newbalanceDest"]),
        "isFraud": int(txn["isFraud"])
    }
