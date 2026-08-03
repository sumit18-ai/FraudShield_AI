from fastapi import APIRouter, HTTPException
from ..schemas.transaction import Transaction
from ..core.explainer import get_explanations
from ..core import data_loader
import math

router = APIRouter()

@router.post("/analyze")
async def analyze_transaction(transaction: Transaction):
    import app.core.model_engine as engine
    
    if engine.model is None:
        raise HTTPException(status_code=500, detail="Model not loaded.")

    # A. Preprocess
    raw_df, scaled_data = engine.preprocess_transaction(transaction.dict())

    # B. Get Prediction Probability and apply tuned decision threshold
    threshold = engine.feature_metadata.get('optimal_threshold', 0.5) if engine.feature_metadata else 0.5
    risk_score = float(engine.model.predict_proba(scaled_data)[0][1])
    decision = "Block" if risk_score >= threshold else "Allow"

    # C. SHAP Explanation
    explanations = get_explanations(scaled_data, engine.feature_metadata['features'])

    # D. Return Response
    return {
        "risk_score": round(risk_score, 4),
        "decision": decision,
        "is_fraud": decision == "Block",
        "explanations": explanations
    }

@router.get("/health")
def health_check():
    import app.core.model_engine as engine
    return {"status": "online", "model_loaded": engine.model is not None}

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
