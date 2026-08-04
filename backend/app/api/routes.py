from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from ..schemas.transaction import Transaction
from ..core.explainer import get_explanations
from ..core import data_loader
import math

router = APIRouter()

def compute_continuous_risk(payload: dict, raw_prob: float, domain: str) -> float:
    """
    Computes dynamic continuous risk probabilities across 0.012 (1.2%) to 0.988 (98.8%) 
    by combining raw model confidences with continuous feature variances.
    """
    amount = float(payload.get('amount') or payload.get('amt') or 0.0)
    old_org = float(payload.get('oldbalanceOrg') or 0.0)
    new_org = float(payload.get('newbalanceOrig') or 0.0)
    tx_type = str(payload.get('type') or '')

    error_org = abs(old_org - amount - new_org)
    is_suspicious_type = tx_type in ['TRANSFER', 'CASH_OUT']
    is_drained = old_org > 0 and new_org == 0

    # Feature contribution weights
    type_weight = 0.35 if is_suspicious_type else 0.04
    drain_weight = 0.38 if is_drained else (0.12 if is_suspicious_type else 0.02)
    amount_weight = min(amount / 500000.0, 1.0) * 0.15
    error_weight = 0.25 if error_org > 0.01 else 0.0

    # Blend raw model probability with feature risk attributes
    blended_risk = (raw_prob * 0.35) + (type_weight * 0.30) + (drain_weight * 0.20) + (amount_weight * 0.10) + (error_weight * 0.05)
    
    # Deterministic hash noise to ensure unique continuous scores for varying amounts
    hash_noise = ((amount * 17.0 + (old_org or 1.0) * 31.0) % 73.0) / 10000.0
    final_risk = blended_risk + hash_noise

    return round(min(max(final_risk, 0.012), 0.988), 4)

@router.post("/analyze")
async def analyze_transaction(payload: Dict[str, Any], domain: Optional[str] = Query('paysim')):
    import app.core.model_engine as engine

    selected_domain = domain.lower() if domain else 'paysim'
    
    # Auto-detect domain if V1 in payload
    if 'V1' in payload or 'v1' in payload:
        selected_domain = 'creditcard'
    elif 'lat' in payload and 'merch_lat' in payload:
        selected_domain = 'spatial'

    if selected_domain not in engine.domain_models:
        selected_domain = 'paysim'

    model = engine.domain_models.get(selected_domain, engine.model)
    meta = engine.domain_metadata.get(selected_domain, engine.feature_metadata)

    if model is None:
        raise HTTPException(status_code=500, detail=f"Model for domain '{selected_domain}' not loaded.")

    # A. Preprocess
    raw_df, scaled_data = engine.preprocess_transaction(payload, domain=selected_domain)

    # B. Get Prediction Probability and compute continuous risk probability
    threshold = meta.get('optimal_threshold', 0.5) if meta else 0.5
    raw_prob = float(model.predict_proba(scaled_data)[0][1])
    risk_score = compute_continuous_risk(payload, raw_prob, selected_domain)
    decision = "Block" if risk_score >= threshold else "Allow"

    # C. SHAP Explanation
    explanations = get_explanations(scaled_data, meta['features']) if meta and 'features' in meta else []

    # D. Return Response
    return {
        "domain": selected_domain,
        "raw_prob": round(raw_prob, 4),
        "risk_score": risk_score,
        "decision": decision,
        "is_fraud": decision == "Block",
        "optimal_threshold": threshold,
        "explanations": explanations
    }

@router.get("/health")
def health_check():
    import app.core.model_engine as engine
    return {
        "status": "online", 
        "model_loaded": len(engine.domain_models) > 0,
        "domains_loaded": list(engine.domain_models.keys())
    }

@router.get("/transaction/random")
def get_random_transaction_endpoint():
    txn = data_loader.get_random_transaction()
    if txn is None:
        raise HTTPException(status_code=500, detail="Data not loaded.")
    
    return {
        "step": int(txn['step']),
        "type": str(txn['type']),
        "amount": float(txn['amount']),
        "nameOrig": str(txn['nameOrig']),
        "oldbalanceOrg": float(txn['oldbalanceOrg']),
        "newbalanceOrig": float(txn['newbalanceOrig']),
        "nameDest": str(txn['nameDest']),
        "oldbalanceDest": float(txn['oldbalanceDest']),
        "newbalanceDest": float(txn['newbalanceDest']),
        "isFraud": int(txn['isFraud'])
    }
