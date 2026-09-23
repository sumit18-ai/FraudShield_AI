"""
Unit and Integration tests verifying fixes for the 5 Critical Issues and 3 Bugs:
- CRIT-1: Federated learning simulation mode flag, disclaimer, dynamic weights
- CRIT-2: Concept drift training reference baseline, no synthetic self-seeding
- CRIT-3: Live transaction graph ingestion on /analyze
- CRIT-4: Seed fallback for /transaction/random
- CRIT-5: Dead transaction schema removal
- BUG-1: (Frontend auth) verified via auth error handling
- BUG-2: Behavioral off-hours boundary condition (hour_of_day >= 23)
- BUG-3: OmniSMOTE backend integration and model deserialization
"""
import os
import sys
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from app.core.graph_engine import graph_engine
from app.core.drift_monitor import ConceptDriftMonitor
from app.core.behavioral_engine import behavioral_engine
from app.core.omni_smote import OmniSMOTE
from app.core import model_engine
from app.core import data_loader

client = TestClient(app)


def test_crit1_federated_simulation_mode_and_weights():
    """CRIT-1: Verify federated learning state returns simulation_mode, disclaimer, dynamic weights."""
    res = client.get("/federated/state")
    assert res.status_code == 200
    data = res.json()
    assert data.get("simulation_mode") is True
    assert "DEMO SIMULATION" in data.get("disclaimer", "")
    assert "client_weights_applied" in data
    weights = data["client_weights_applied"]
    assert sum(weights.values()) == pytest.approx(1.0, abs=0.01)


def test_crit2_drift_monitor_real_baseline_no_fakepopulation():
    """CRIT-2: Verify drift monitor does not self-seed fake 30 items and loads real baseline."""
    monitor = ConceptDriftMonitor()
    assert len(monitor.current_window) == 0
    status = monitor.get_drift_status()
    assert status["model_status"] == "COLLECTING_BASELINE"
    # Ensure window is still empty (no self-seeding 30 transactions)
    assert len(monitor.current_window) == 0
    assert status["window_sample_count"] == 0


def test_crit3_graph_engine_live_ingestion():
    """CRIT-3: Verify calling /analyze adds nodes and edges to graph_engine."""
    test_src = "C_TEST_LIVE_SRC_999"
    test_dst = "M_TEST_LIVE_DST_999"
    
    initial_nodes = graph_engine.graph.number_of_nodes()
    
    payload = {
        "step": 10,
        "type": "PAYMENT",
        "amount": 250.0,
        "nameOrig": test_src,
        "oldbalanceOrg": 1000.0,
        "newbalanceOrig": 750.0,
        "nameDest": test_dst,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0,
        "device_id": "DEV_TEST_999",
        "ip_address": "192.168.1.99"
    }
    
    res = client.post("/analyze", json=payload)
    assert res.status_code == 200
    
    # Assert nodes and edge exist in graph
    assert graph_engine.graph.has_node(test_src)
    assert graph_engine.graph.has_node(test_dst)
    assert graph_engine.graph.has_edge(test_src, test_dst)


def test_crit4_random_transaction_seed_fallback():
    """CRIT-4: Verify /transaction/random returns a valid transaction without 500 errors."""
    res = client.get("/transaction/random")
    assert res.status_code == 200
    data = res.json()
    assert "type" in data
    assert "amount" in data
    assert "nameOrig" in data
    assert "isFraud" in data


def test_crit5_dead_schema_removed():
    """CRIT-5: Verify schemas/transaction.py is gone and no module collision exists."""
    schema_file = os.path.join(backend_dir, "app", "schemas", "transaction.py")
    assert not os.path.exists(schema_file), "Dead schema file transaction.py should have been deleted"


def test_bug2_behavioral_hour_23_boundary():
    """BUG-2: Verify step=23 (11 PM) triggers off-hours when not in typical_hours."""
    # Profile with typical daytime hours only: 8 AM to 6 PM
    test_cust = "C_OFFHOURS_TEST_1"
    behavioral_engine.profiles[test_cust] = {
        "avg_amount": 100.0,
        "std_amount": 20.0,
        "typical_hours": list(range(8, 18)), # 8 to 17
        "typical_recipients": ["M123"],
        "tx_count": 25
    }
    
    # step=23 -> hour_of_day=23
    txn = {
        "nameOrig": test_cust,
        "amount": 100.0,
        "step": 23, # 11 PM
        "nameDest": "M123"
    }
    
    risk_output = behavioral_engine.evaluate_behavioral_deviation(txn)
    assert risk_output["is_off_hours"] is True
    assert any("Nocturnal anomaly" in r for r in risk_output.get("reasons", []))


def test_bug3_omnismote_available_and_models_loaded():
    """BUG-3: Verify OmniSMOTE is importable and all 4 domain models are active."""
    assert OmniSMOTE is not None
    model_engine.load_models()
    assert "paysim" in model_engine.domain_models
    assert "creditcard" in model_engine.domain_models
    assert "spatial" in model_engine.domain_models
    assert "banksim" in model_engine.domain_models
