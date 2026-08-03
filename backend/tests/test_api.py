import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path to allow importing main and app
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app, startup_event

# Trigger startup event to load models and SHAP explainer
startup_event()
client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["model_loaded"] is True

def test_get_random_transaction():
    response = client.get("/transaction/random")
    assert response.status_code == 200
    data = response.json()
    required_keys = ["step", "type", "amount", "nameOrig", "oldbalanceOrg", "newbalanceOrig", "nameDest", "oldbalanceDest", "newbalanceDest", "isFraud"]
    for key in required_keys:
        assert key in data, f"Key {key} missing in /transaction/random response"

def test_analyze_transaction_legit():
    sample_payload = {
        "step": 1,
        "type": "PAYMENT",
        "amount": 150.00,
        "nameOrig": "C123456789",
        "oldbalanceOrg": 5000.00,
        "newbalanceOrig": 4850.00,
        "nameDest": "M987654321",
        "oldbalanceDest": 0.00,
        "newbalanceDest": 0.00
    }
    response = client.post("/analyze", json=sample_payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "decision" in data
    assert "is_fraud" in data
    assert "explanations" in data
    assert isinstance(data["risk_score"], float)
    assert data["decision"] in ["Allow", "Block"]
    assert isinstance(data["explanations"], list)

def test_analyze_transaction_suspicious():
    # High amount transfer with zero new balance
    sample_payload = {
        "step": 1,
        "type": "TRANSFER",
        "amount": 500000.00,
        "nameOrig": "C999999999",
        "oldbalanceOrg": 500000.00,
        "newbalanceOrig": 0.00,
        "nameDest": "C111111111",
        "oldbalanceDest": 0.00,
        "newbalanceDest": 0.00
    }
    response = client.post("/analyze", json=sample_payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert data["risk_score"] >= 0.0 and data["risk_score"] <= 1.0
    assert data["decision"] in ["Allow", "Block"]
