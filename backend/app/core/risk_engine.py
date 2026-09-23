import math
from typing import Dict, Any, List, Tuple
from .graph_engine import graph_engine
from .anomaly_engine import anomaly_engine
from .behavioral_engine import behavioral_engine
from .logger import get_logger

logger = get_logger(__name__)

class AdaptiveMultiSignalRiskEngine:
    def __init__(self):
        # Default policy weights (Sum to 1.0)
        self.weights = {
            "ml_model": 0.40,
            "anomaly_engine": 0.20,
            "graph_intelligence": 0.20,
            "behavioral_profiler": 0.10,
            "rule_matrix": 0.10
        }

    def evaluate_rule_matrix(self, txn_dict: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        Deterministic Financial Compliance & Risk Policy Matrix.
        Hard checks that add immediate safety guarantees.
        """
        amount = float(txn_dict.get("amount") or txn_dict.get("amt") or 0.0)
        old_orig = float(txn_dict.get("oldbalanceOrg", 0.0))
        new_orig = float(txn_dict.get("newbalanceOrig", 0.0))
        tx_type = str(txn_dict.get("type", "PAYMENT")).upper()
        
        triggered_rules = []
        rule_score = 0.05

        # Rule 1: Extreme Transfer Volume Threshold ($200k+)
        if amount >= 200000.0:
            rule_score += 0.35
            triggered_rules.append("POLICY-RULE-101: High-value transaction exceeding $200,000 regulatory reporting threshold")

        # Rule 2: Zero Balance Liquidation on Transfer/Cash-Out
        if tx_type in ["TRANSFER", "CASH_OUT"] and old_orig > 10000.0 and new_orig == 0.0:
            rule_score += 0.30
            triggered_rules.append("POLICY-RULE-204: Complete balance extraction flag (Origin balance liquidated to 0.00)")

        # Rule 3: Insufficient Funds Math Inconsistency
        if old_orig > 0 and amount > old_orig and tx_type in ["TRANSFER", "CASH_OUT"]:
            rule_score += 0.25
            triggered_rules.append("POLICY-RULE-309: Overdraft/Exceeded funds anomaly (Transaction amount exceeds initial origin balance)")

        # Rule 4: High-Risk Transaction Channel
        if tx_type == "TRANSFER":
            rule_score += 0.10
        elif tx_type == "CASH_OUT":
            rule_score += 0.15

        final_rule_score = max(0.01, min(0.99, round(rule_score, 4)))
        if not triggered_rules:
            triggered_rules.append("Passed all deterministic hard compliance policy checks.")

        return final_rule_score, triggered_rules

    def compute_composite_risk(
        self,
        ml_prob: float,
        txn_dict: Dict[str, Any],
        sender: str,
        receiver: str,
        device: str = None,
        ip: str = None
    ) -> Dict[str, Any]:
        """
        Executes multi-engine orchestration and computes final actionable decision.
        """
        # 1. Unsupervised Anomaly Engine
        anomaly_res = anomaly_engine.calculate_anomaly_score(txn_dict)
        s_anomaly = anomaly_res["anomaly_score"]

        # 2. Graph Intelligence Engine
        graph_res = graph_engine.calculate_graph_risk(sender, receiver, device, ip)
        s_graph = graph_res["graph_risk_score"]

        # 3. Customer Behavioral Baseline
        behavioral_res = behavioral_engine.evaluate_behavioral_deviation(txn_dict)
        s_behavioral = behavioral_res["behavioral_score"]

        # 4. Deterministic Rule Matrix
        s_rules, rule_reasons = self.evaluate_rule_matrix(txn_dict)

        # 5. Composite Weighted Calculation
        composite_score = (
            self.weights["ml_model"] * ml_prob +
            self.weights["anomaly_engine"] * s_anomaly +
            self.weights["graph_intelligence"] * s_graph +
            self.weights["behavioral_profiler"] * s_behavioral +
            self.weights["rule_matrix"] * s_rules
        )

        # If any single engine shows critical threat (> 0.85), boost composite score safely
        if s_graph >= 0.80 or s_anomaly >= 0.85 or ml_prob >= 0.85:
            composite_score = max(composite_score, 0.76)

        final_risk = max(0.01, min(0.99, round(composite_score, 4)))

        # 6. Multi-Tier Decisioning & Action Matrix
        if final_risk >= 0.70:
            decision = "Block"
            status = "FRAUD"
            action_code = "ACTION_BLOCK_AND_ALERT"
            action_description = "Transaction blocked immediately. Automated SAR (Suspicious Activity Report) generated for compliance audit."
            step_up_challenge = "HARD_BLOCK"
        elif final_risk >= 0.31:
            decision = "Needs Review"
            status = "NEEDS_REVIEW"
            action_code = "ACTION_STEP_UP_VERIFICATION"
            action_description = "Step-up authentication required: Mandatory Out-of-Band (OOB) Biometric or SMS OTP challenge."
            step_up_challenge = "OTP_BIOMETRIC_STEP_UP"
        else:
            decision = "Approve"
            status = "SAFE"
            action_code = "ACTION_APPROVE_INSTANT"
            action_description = "Instant authorization approved. Low composite multi-engine risk profile."
            step_up_challenge = "NONE"

        # Record this transaction into the living graph
        graph_engine.add_transaction({
            **txn_dict,
            "nameOrig": sender,
            "nameDest": receiver,
            "isFraud": 1 if final_risk >= 0.70 else 0
        })

        return {
            "composite_risk_score": final_risk,
            "decision": decision,
            "status": status,
            "action_code": action_code,
            "action_description": action_description,
            "step_up_challenge": step_up_challenge,
            "signal_breakdown": {
                "ml_ensemble": {
                    "score": round(float(ml_prob), 4),
                    "weight_pct": int(self.weights["ml_model"] * 100),
                    "label": "Stacking Ensemble (XGB+LGBM+RF)"
                },
                "anomaly_engine": {
                    "score": round(float(s_anomaly), 4),
                    "weight_pct": int(self.weights["anomaly_engine"] * 100),
                    "label": "Isolation Forest Outlier Engine",
                    "details": anomaly_res["reasons"]
                },
                "graph_intelligence": {
                    "score": round(float(s_graph), 4),
                    "weight_pct": int(self.weights["graph_intelligence"] * 100),
                    "label": "Graph Ring & Entity Resolution",
                    "in_ring": graph_res["in_fraud_ring"],
                    "details": graph_res["reasons"]
                },
                "behavioral_profiler": {
                    "score": round(float(s_behavioral), 4),
                    "weight_pct": int(self.weights["behavioral_profiler"] * 100),
                    "label": "Customer Historical Baseline",
                    "details": behavioral_res["reasons"]
                },
                "rule_matrix": {
                    "score": round(float(s_rules), 4),
                    "weight_pct": int(self.weights["rule_matrix"] * 100),
                    "label": "Compliance Policy Rule Matrix",
                    "details": rule_reasons
                }
            }
        }

risk_engine = AdaptiveMultiSignalRiskEngine()
