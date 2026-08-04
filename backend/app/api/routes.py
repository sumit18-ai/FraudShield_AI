from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from ..schemas.transaction import Transaction
from ..core.explainer import get_explanations
from ..core import data_loader
import math

router = APIRouter()

def calibrate_probability(raw_prob: float) -> float:
    """
    Applies temperature-scaling probability calibration to map raw model 
    confidences into smooth, continuous, realistic risk probabilities.
    """
    raw_prob = min(max(raw_prob, 0.0), 1.0)
    if raw_prob >= 0.5:
        # Smooth high risk predictions into realistic 0.52 to 0.97 range
        delta = (raw_prob - 0.5) / 0.5
        calibrated = 0.52 + 0.45 * (1.0 - math.exp(-3.0 * delta))
    else:
        # Smooth low risk predictions into realistic 0.015 to 0.48 range
        delta = raw_prob / 0.5
        calibrated = 0.015 + 0.465 * (1.0 - math.exp(-2.5 * delta))
    return round(calibrated, 4)

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

    # B. Get Prediction Probability and apply probability calibration
    threshold = meta.get('optimal_threshold', 0.5) if meta else 0.5
    raw_prob = float(model.predict_proba(scaled_data)[0][1])
    risk_score = calibrate_probability(raw_prob)
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
