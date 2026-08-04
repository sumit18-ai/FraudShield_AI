from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
from ..schemas.transaction import Transaction
from ..core.explainer import get_explanations
from ..core import data_loader

router = APIRouter()

# Fixed fraud threshold as specified: >= 45.0% risk is marked as Fraud / Block
FRAUD_THRESHOLD = 0.45

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

    # B. Calculate EXACT Machine Learning model prediction probability (No random values/noise)
    raw_prob = float(model.predict_proba(scaled_data)[0][1])
    risk_score = round(raw_prob, 4)

    # C. Decision logic: > 45% risk probability marked as Fraud / Block
    decision = "Block" if risk_score >= FRAUD_THRESHOLD else "Allow"

    # D. TreeSHAP Explanation calculation
    explanations = get_explanations(scaled_data, meta['features']) if meta and 'features' in meta else []

    # E. Return Response
    return {
        "domain": selected_domain,
        "risk_score": risk_score,
        "decision": decision,
        "is_fraud": decision == "Block",
        "optimal_threshold": FRAUD_THRESHOLD,
        "explanations": explanations
    }

@router.get("/health")
def health_check():
    import app.core.model_engine as engine
    return {
        "status": "online", 
        "model_loaded": len(engine.domain_models) > 0,
        "domains_loaded": list(engine.domain_models.keys()),
        "fraud_threshold": FRAUD_THRESHOLD
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
