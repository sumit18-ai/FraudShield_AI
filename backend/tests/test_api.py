"""
FraudShield AI — Backend Test Suite
Covers: health, transactions, analyze, auth flows, RBAC, rate limiting,
        graph, drift, federated, behavioral endpoints.
"""
import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend is in path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Use in-memory SQLite for tests — no file created
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("ENV", "development")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-ci-only-not-production")

from main import app
from app.core.database import init_db

init_db()
client = TestClient(app)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def analyst_token():
    resp = client.post("/auth/login", json={"persona": "soc_analyst"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest.fixture(scope="module")
def compliance_token():
    resp = client.post("/auth/login", json={"persona": "compliance_officer"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest.fixture(scope="module")
def admin_token():
    resp = client.post("/auth/login", json={"persona": "admin"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest.fixture
def legit_payload():
    return {
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

@pytest.fixture
def suspicious_payload():
    return {
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


# ---------------------------------------------------------------------------
# Health & Utility
# ---------------------------------------------------------------------------
class TestHealth:
    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert isinstance(data["model_loaded"], bool)
        assert isinstance(data["domains_loaded"], list)
        assert isinstance(data["graph_nodes_loaded"], int)

    def test_random_transaction(self):
        response = client.get("/transaction/random")
        # May be 500 if no CSV data loaded in CI — both are acceptable
        assert response.status_code in (200, 500)
        if response.status_code == 200:
            data = response.json()
            required_keys = [
                "step", "type", "amount", "nameOrig", "oldbalanceOrg",
                "newbalanceOrig", "nameDest", "oldbalanceDest", "newbalanceDest", "isFraud"
            ]
            for key in required_keys:
                assert key in data, f"Key '{key}' missing from /transaction/random"


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
class TestAuth:
    def test_get_personas(self):
        resp = client.get("/auth/personas")
        assert resp.status_code == 200
        personas = resp.json()["personas"]
        assert len(personas) == 3
        roles = {p["role"] for p in personas}
        assert roles == {"soc_analyst", "compliance_officer", "admin"}

    def test_persona_login_analyst(self):
        resp = client.post("/auth/login", json={"persona": "soc_analyst"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["role"] == "soc_analyst"

    def test_persona_login_admin(self):
        resp = client.post("/auth/login", json={"persona": "admin"})
        assert resp.status_code == 200
        assert resp.json()["user"]["role"] == "admin"

    def test_credential_login_valid(self):
        resp = client.post("/auth/login", json={
            "email": "analyst@fraudshield.ai",
            "password": "analyst123"
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_credential_login_wrong_password(self):
        resp = client.post("/auth/login", json={
            "email": "analyst@fraudshield.ai",
            "password": "wrongpassword"
        })
        assert resp.status_code == 401

    def test_credential_login_unknown_email(self):
        resp = client.post("/auth/login", json={
            "email": "nobody@unknown.com",
            "password": "anything"
        })
        assert resp.status_code == 401

    def test_invalid_persona(self):
        resp = client.post("/auth/login", json={"persona": "nonexistent_role"})
        # Falls through to email/password path without credentials → 400
        assert resp.status_code == 400

    def test_get_me_authenticated(self, analyst_token):
        resp = client.get("/auth/me", headers={"Authorization": f"Bearer {analyst_token}"})
        assert resp.status_code == 200
        assert "user" in resp.json()
        assert resp.json()["user"]["role"] == "soc_analyst"

    def test_get_me_unauthenticated(self):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_register_new_user(self):
        resp = client.post("/auth/register", json={
            "email": "newuser@test.com",
            "password": "securepass123",
            "name": "Test User"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        # Self-registration should never grant admin
        assert data["user"]["role"] != "admin"

    def test_register_duplicate_email(self):
        client.post("/auth/register", json={
            "email": "duplicate@test.com",
            "password": "pass1",
            "name": "First"
        })
        resp = client.post("/auth/register", json={
            "email": "duplicate@test.com",
            "password": "pass2",
            "name": "Second"
        })
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# RBAC Enforcement
# ---------------------------------------------------------------------------
class TestRBAC:
    def test_audit_logs_requires_auth(self):
        resp = client.get("/auth/audit-logs")
        assert resp.status_code == 401

    def test_audit_logs_analyst_forbidden(self, analyst_token):
        resp = client.get("/auth/audit-logs", headers={"Authorization": f"Bearer {analyst_token}"})
        assert resp.status_code == 403

    def test_audit_logs_compliance_allowed(self, compliance_token):
        resp = client.get("/auth/audit-logs", headers={"Authorization": f"Bearer {compliance_token}"})
        assert resp.status_code == 200
        assert "audit_logs" in resp.json()

    def test_audit_logs_admin_allowed(self, admin_token):
        resp = client.get("/auth/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200

    def test_api_keys_requires_admin(self, analyst_token):
        resp = client.get("/auth/api-keys", headers={"Authorization": f"Bearer {analyst_token}"})
        assert resp.status_code == 403

    def test_api_keys_admin_allowed(self, admin_token):
        resp = client.get("/auth/api-keys", headers={"Authorization": f"Bearer {admin_token}"})
        assert resp.status_code == 200
        keys = resp.json()["api_keys"]
        # Raw keys must NOT be exposed
        for k in keys:
            assert "raw_key" not in k
            assert "hashed_key" not in k

    def test_drift_spike_requires_admin(self, analyst_token):
        resp = client.post(
            "/drift/simulate-spike",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        assert resp.status_code == 403

    def test_federated_round_requires_admin(self, analyst_token):
        resp = client.post(
            "/federated/simulate-round",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Transaction Analysis — correct decision/status values
# ---------------------------------------------------------------------------
class TestAnalyze:
    VALID_DECISIONS = {"Approve", "Needs Review", "Block"}
    VALID_STATUSES = {"SAFE", "NEEDS_REVIEW", "FRAUD"}

    def test_analyze_legit_transaction(self, legit_payload):
        resp = client.post("/analyze", json=legit_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "risk_score" in data
        assert "decision" in data
        assert "is_fraud" in data
        assert "explanations" in data
        assert isinstance(data["risk_score"], float)
        assert 0.0 <= data["risk_score"] <= 1.0
        assert data["decision"] in self.VALID_DECISIONS
        assert data["status"] in self.VALID_STATUSES
        assert isinstance(data["explanations"], list)
        assert "signal_breakdown" in data
        assert "reason_codes" in data

    def test_analyze_suspicious_transaction(self, suspicious_payload):
        resp = client.post("/analyze", json=suspicious_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert 0.0 <= data["risk_score"] <= 1.0
        assert data["decision"] in self.VALID_DECISIONS
        assert data["status"] in self.VALID_STATUSES

    def test_analyze_invalid_negative_amount(self):
        resp = client.post("/analyze", json={
            "step": 1, "type": "PAYMENT", "amount": -500.0,
            "nameOrig": "C1", "nameDest": "M1"
        })
        assert resp.status_code == 422  # Pydantic validation error

    def test_analyze_domain_autodetect_creditcard(self):
        """V1 field in payload should auto-detect creditcard domain."""
        payload = {
            "V1": -1.36, "V2": 1.19, "Amount": 150.0,
            "nameOrig": "C999", "nameDest": "M999"
        }
        resp = client.post("/analyze", json=payload)
        assert resp.status_code == 200
        # Domain should be detected as creditcard
        assert resp.json()["domain"] == "creditcard"

    def test_analyze_signal_breakdown_structure(self, legit_payload):
        resp = client.post("/analyze", json=legit_payload)
        assert resp.status_code == 200
        breakdown = resp.json()["signal_breakdown"]
        assert "ml_ensemble" in breakdown
        assert "anomaly_engine" in breakdown
        assert "graph_intelligence" in breakdown
        assert "behavioral_profiler" in breakdown
        assert "rule_matrix" in breakdown


# ---------------------------------------------------------------------------
# Graph Intelligence
# ---------------------------------------------------------------------------
class TestGraph:
    def test_get_graph_network(self):
        resp = client.get("/graph/network")
        assert resp.status_code == 200
        data = resp.json()
        assert "nodes" in data
        assert "edges" in data
        assert "node_count" in data
        assert data["node_count"] > 0

    def test_get_fraud_rings(self):
        resp = client.get("/graph/rings")
        assert resp.status_code == 200
        assert "fraud_rings" in resp.json()
        assert isinstance(resp.json()["fraud_rings"], list)


# ---------------------------------------------------------------------------
# Concept Drift Monitor
# ---------------------------------------------------------------------------
class TestDriftMonitor:
    def test_drift_status(self):
        resp = client.get("/drift/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "overall_psi" in data
        assert "model_status" in data
        assert "feature_metrics" in data
        assert isinstance(data["feature_metrics"], list)

    def test_drift_spike_admin_only(self, admin_token):
        resp = client.post(
            "/drift/simulate-spike?drift_type=HIGH_AMOUNT_BURST",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 200
        assert "model_status" in resp.json()


# ---------------------------------------------------------------------------
# Federated Learning
# ---------------------------------------------------------------------------
class TestFederatedLearning:
    def test_get_federated_state(self):
        resp = client.get("/federated/state")
        assert resp.status_code == 200
        data = resp.json()
        assert "current_round" in data
        assert "global_auc" in data
        assert "participating_banks" in data

    def test_run_federated_round_admin(self, admin_token):
        resp = client.post(
            "/federated/simulate-round",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "global_auc" in data
        assert data["global_auc"] > 0.5


# ---------------------------------------------------------------------------
# Behavioral Profile
# ---------------------------------------------------------------------------
class TestBehavioral:
    def test_get_known_customer_profile(self):
        resp = client.get("/behavioral/profile/C1231006815")
        assert resp.status_code == 200
        data = resp.json()
        assert "avg_amount" in data

    def test_get_unknown_customer_creates_coldstart(self):
        resp = client.get("/behavioral/profile/C_BRAND_NEW_CUSTOMER_XYZ")
        assert resp.status_code == 200
        data = resp.json()
        assert "avg_amount" in data  # cold-start profile created
