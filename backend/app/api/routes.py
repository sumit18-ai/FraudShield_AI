from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from ..schemas.transaction import Transaction
from ..core.explainer import get_explanations
from ..core import data_loader
import math

router = APIRouter()

def calculate_calibrated_risk(p: float, transaction_dict: dict) -> float:
    amount = float(transaction_dict.get("amount") or transaction_dict.get("amt") or 0.0)
    old_bal = float(transaction_dict.get("oldbalanceOrg", 0.0))
    new_bal = float(transaction_dict.get("newbalanceOrig", 0.0))
    tx_type = str(transaction_dict.get("type", "")).upper()
    error_orig = old_bal - amount - new_bal
    
    amount_log = math.log10(amount + 1)
    amount_factor = min(1.0, amount_log / 6.0) # maxes out at 1,000,000
    
    decision = "Block" if p > 0.5 else "Allow"
    
    if decision == "Block":
        base = 0.75
        conf_factor = 0.08 * ((p - 0.5) / 0.5)
        amt_contribution = 0.08 * amount_factor
        bal_contribution = 0.08 if (old_bal > 0 and new_bal == 0) else 0.0
        score = base + conf_factor + amt_contribution + bal_contribution
        return max(0.75, min(0.99, score))
    else:
        if tx_type not in ["TRANSFER", "CASH_OUT"]:
            score = 0.15 * amount_factor
            return max(0.01, min(0.44, score))
        else:
            base = 0.15
            amt_contribution = 0.25 * amount_factor
            bal_contribution = 0.20 if (old_bal > 0 and new_bal == 0) else 0.0
            disc_contribution = 0.10 if abs(error_orig) > 0.01 else 0.0
            model_contribution = 0.05 * (p / 0.5)
            score = base + amt_contribution + bal_contribution + disc_contribution + model_contribution
            return max(0.15, min(0.74, score))

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

    # A. Preprocess transaction features
    raw_df, scaled_data = engine.preprocess_transaction(payload, domain=selected_domain)

    # B. Get raw prediction probability from ML model
    raw_prob = float(model.predict_proba(scaled_data)[0][1])

    # C. Calculate Calibrated Continuous Risk Score
    calibrated_score = calculate_calibrated_risk(raw_prob, payload)
    risk_score = round(calibrated_score, 4)

    # D. 3-Tier Classification Decision: Safe (<45%), Needs Review (45%-75%), Fraud (>=75%)
    if risk_score >= 0.75:
        decision = "Fraud"
        status = "FRAUD"
    elif risk_score >= 0.45:
        decision = "Needs Review"
        status = "NEEDS_REVIEW"
    else:
        decision = "Safe"
        status = "SAFE"

    # E. TreeSHAP Explanation calculation
    explanations = get_explanations(scaled_data, meta['features']) if meta and 'features' in meta else []

    # F. Return Response
    return {
        "domain": selected_domain,
        "raw_prob": round(raw_prob, 4),
        "risk_score": risk_score,
        "decision": decision,
        "status": status,
        "is_fraud": decision == "Fraud",
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
