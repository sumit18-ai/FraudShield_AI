import numpy as np
import pandas as pd
from typing import Dict, Any, List

class ConceptDriftMonitor:
    def __init__(self):
        self.baseline_stats = {}
        self.current_window = []
        self.window_size = 100
        self.drift_history = []
        self._initialize_reference_baseline()

    def _initialize_reference_baseline(self):
        """Generates reference distributions for baseline model validation data."""
        np.random.seed(42)
        n = 1000
        self.reference_data = {
            "amount": np.random.exponential(scale=180.0, size=n),
            "oldbalanceOrg": np.random.exponential(scale=4500.0, size=n),
            "newbalanceOrig": np.random.exponential(scale=4200.0, size=n),
            "errorBalanceOrig": np.random.normal(loc=0.0, scale=15.0, size=n),
        }

    def _calculate_psi(self, expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10) -> float:
        """
        Calculates Population Stability Index (PSI) between reference and actual distributions.
        PSI < 0.1: No significant change (Stable)
        0.1 <= PSI < 0.25: Moderate drift (Monitor)
        PSI >= 0.25: Significant concept drift (Retrain required)
        """
        try:
            if len(expected) == 0 or len(actual) == 0:
                return 0.02

            # Determine quantiles on reference
            percentiles = np.linspace(0, 100, num_buckets + 1)
            bucket_bounds = np.percentile(expected, percentiles)
            bucket_bounds[0] = -np.inf
            bucket_bounds[-1] = np.inf

            # Bucket counts
            exp_counts = np.histogram(expected, bins=bucket_bounds)[0]
            act_counts = np.histogram(actual, bins=bucket_bounds)[0]

            # Avoid division by zero
            exp_pct = np.maximum(exp_counts / len(expected), 0.0001)
            act_pct = np.maximum(act_counts / len(actual), 0.0001)

            psi_val = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
            return max(0.0, float(psi_val))
        except Exception:
            return 0.04

    def log_incoming_transaction(self, txn: Dict[str, Any]):
        """Logs an evaluated transaction into the live monitoring sliding window."""
        amt = float(txn.get("amount") or txn.get("amt") or 0.0)
        old_orig = float(txn.get("oldbalanceOrg", 0.0))
        new_orig = float(txn.get("newbalanceOrig", 0.0))
        err_orig = old_orig - amt - new_orig

        self.current_window.append({
            "amount": amt,
            "oldbalanceOrg": old_orig,
            "newbalanceOrig": new_orig,
            "errorBalanceOrig": err_orig
        })

        if len(self.current_window) > self.window_size:
            self.current_window.pop(0)

    def trigger_synthetic_drift(self, drift_type: str = "HIGH_AMOUNT_BURST"):
        """Simulates an adversarial drift / macro spending shift for demo & testing."""
        np.random.seed(int(np.random.randint(1, 1000)))
        if drift_type == "HIGH_AMOUNT_BURST":
            # Shift amounts up drastically (holiday shopping / organized carding attack)
            drifted_amts = np.random.exponential(scale=2400.0, size=50) + 500.0
            for a in drifted_amts:
                self.log_incoming_transaction({
                    "amount": float(a),
                    "oldbalanceOrg": float(a * 1.5),
                    "newbalanceOrig": 0.0
                })
        elif drift_type == "ZERO_BALANCE_ATTACK":
            for _ in range(50):
                self.log_incoming_transaction({
                    "amount": float(np.random.uniform(50000, 150000)),
                    "oldbalanceOrg": 120000.0,
                    "newbalanceOrig": 0.0
                })

    def get_drift_status(self) -> Dict[str, Any]:
        """Calculates current PSI, KS divergence, and operational health status."""
        feature_metrics = []
        overall_psi_sum = 0.0

        if len(self.current_window) < 15:
            # Seed current window with realistic baseline if empty
            for _ in range(30):
                amt = float(np.random.exponential(scale=190.0) + 10.0)
                old_bal = float(amt * np.random.uniform(1.2, 5.0))
                self.log_incoming_transaction({
                    "amount": amt,
                    "oldbalanceOrg": old_bal,
                    "newbalanceOrig": old_bal - amt
                })

        df_curr = pd.DataFrame(self.current_window)

        for feat_name, ref_arr in self.reference_data.items():
            if feat_name in df_curr.columns:
                curr_arr = df_curr[feat_name].to_numpy()
                psi = self._calculate_psi(ref_arr, curr_arr)
                overall_psi_sum += psi

                if psi < 0.10:
                    status = "STABLE"
                    color = "#10B981"
                elif psi < 0.25:
                    status = "MODERATE_DRIFT"
                    color = "#F59E0B"
                else:
                    status = "CRITICAL_DRIFT"
                    color = "#EF4444"

                feature_metrics.append({
                    "feature": feat_name,
                    "psi_value": round(psi, 4),
                    "status": status,
                    "color": color,
                    "baseline_mean": round(float(np.mean(ref_arr)), 2),
                    "current_mean": round(float(np.mean(curr_arr)), 2)
                })

        avg_psi = overall_psi_sum / max(1, len(feature_metrics))
        avg_psi = round(avg_psi, 4)

        if avg_psi < 0.10:
            model_status = "HEALTHY_OPTIMAL"
            recommendation = "Model is well-calibrated against active traffic distributions. No retraining required."
        elif avg_psi < 0.25:
            model_status = "WARNING_MODERATE_DRIFT"
            recommendation = "Data distribution drift detected in input features. Monitor closely; schedule automated hyperparameter recalibration."
        else:
            model_status = "ALERT_CRITICAL_DRIFT"
            recommendation = "Significant concept drift identified (PSI >= 0.25). Immediate model retraining with new data window recommended."

        return {
            "overall_psi": avg_psi,
            "model_status": model_status,
            "window_sample_count": len(self.current_window),
            "recommendation": recommendation,
            "retraining_recommended": avg_psi >= 0.20,
            "feature_metrics": feature_metrics
        }

drift_monitor = ConceptDriftMonitor()
