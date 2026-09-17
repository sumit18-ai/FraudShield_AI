import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import math
from typing import Dict, Any, List

class UnsupervisedAnomalyEngine:
    def __init__(self):
        self.iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.03,
            random_state=42,
            n_jobs=-1
        )
        self.is_fitted = False
        self._fit_synthetic_baseline()

    def _fit_synthetic_baseline(self):
        """Fits baseline distribution on genuine financial transactions."""
        np.random.seed(42)
        n_samples = 2000
        
        # Simulated standard benign paysim features: [step, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest]
        amounts = np.random.exponential(scale=150.0, size=n_samples) + 5.0
        old_orig = np.random.exponential(scale=5000.0, size=n_samples) + amounts
        new_orig = np.maximum(0, old_orig - amounts)
        old_dest = np.random.exponential(scale=3000.0, size=n_samples)
        new_dest = old_dest + amounts
        steps = np.random.randint(1, 744, size=n_samples)

        X_baseline = np.column_stack([steps, amounts, old_orig, new_orig, old_dest, new_dest])
        self.iso_forest.fit(X_baseline)
        self.is_fitted = True

    def calculate_anomaly_score(self, txn_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes normalized Anomaly Outlier Score S_anomaly in [0.0, 1.0].
        Scores > 0.6 indicate unseen, zero-day, or statistical distribution outliers.
        """
        step = float(txn_dict.get("step", 1))
        amount = float(txn_dict.get("amount") or txn_dict.get("amt") or 0.0)
        old_orig = float(txn_dict.get("oldbalanceOrg", 0.0))
        new_orig = float(txn_dict.get("newbalanceOrig", 0.0))
        old_dest = float(txn_dict.get("oldbalanceDest", 0.0))
        new_dest = float(txn_dict.get("newbalanceDest", 0.0))

        features = np.array([[step, amount, old_orig, new_orig, old_dest, new_dest]])

        # 1. Isolation Forest Raw Decision Function (negative = outlier, positive = inlier)
        if self.is_fitted:
            raw_iso_score = self.iso_forest.decision_function(features)[0] # approx [-0.5, 0.5]
            # Map [-0.35, 0.20] to [1.0, 0.0]
            normalized_iso = max(0.0, min(1.0, (0.20 - raw_iso_score) / 0.55))
        else:
            normalized_iso = 0.10

        # 2. Structural Conservation Deviation (Bookkeeping discrepancy)
        error_orig = old_orig - amount - new_orig
        orig_discrepancy = min(1.0, abs(error_orig) / (amount + 1.0)) if amount > 0 else 0.0

        # 3. Liquidation Anomaly: Account drained completely to 0 from a high balance
        liquidation_flag = 1.0 if (old_orig > 50000.0 and new_orig == 0.0) else 0.0

        # 4. Outlier Scale Multiplier (Extreme value anomaly)
        amount_log = math.log10(amount + 1.0)
        extreme_amt_factor = max(0.0, min(1.0, (amount_log - 4.0) / 3.0)) # scale 10k to 10M

        # Combine Unsupervised Signals
        composite_anomaly = (
            0.45 * normalized_iso +
            0.25 * orig_discrepancy +
            0.15 * liquidation_flag +
            0.15 * extreme_amt_factor
        )

        final_score = max(0.01, min(0.99, round(composite_anomaly, 4)))

        anomaly_reasons = []
        if normalized_iso > 0.6:
            anomaly_reasons.append("Multi-dimensional feature vector lies in high-density Isolation Forest outlier region")
        if liquidation_flag > 0:
            anomaly_reasons.append("Account complete balance liquidation anomaly (High initial balance emptied to zero)")
        if orig_discrepancy > 0.2:
            anomaly_reasons.append("Mathematical balance conservation discrepancy detected between source and destination")
        if extreme_amt_factor > 0.6:
            anomaly_reasons.append(f"Transaction magnitude (${amount:,.2f}) deviates significantly from standard transaction distributions")

        if not anomaly_reasons:
            anomaly_reasons.append("Transaction characteristics match expected normal statistical distribution.")

        return {
            "anomaly_score": final_score,
            "is_outlier": final_score >= 0.55,
            "iso_forest_metric": round(float(normalized_iso), 4),
            "reasons": anomaly_reasons
        }

anomaly_engine = UnsupervisedAnomalyEngine()
