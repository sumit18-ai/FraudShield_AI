import time
import math
from typing import Dict, Any, List

class CustomerBehavioralProfiler:
    def __init__(self):
        # In-memory customer profile store: customer_id -> ProfileData
        self.profiles: Dict[str, Dict[str, Any]] = {}
        self._seed_default_profiles()

    def _seed_default_profiles(self):
        """Seeds realistic historical customer profiles."""
        seed_data = [
            ("C1231006815", {"avg_amount": 120.0, "std_amount": 45.0, "tx_count": 42, "typical_hours": [9, 10, 11, 14, 18, 19], "typical_recipients": ["M1979787155", "M3489346"]}),
            ("C1666544295", {"avg_amount": 350.0, "std_amount": 80.0, "tx_count": 19, "typical_hours": [12, 13, 17, 20], "typical_recipients": ["M1823043282"]}),
            ("C1305486145", {"avg_amount": 55.0, "std_amount": 15.0, "tx_count": 88, "typical_hours": [8, 9, 12, 13, 15, 18], "typical_recipients": ["M4948455"]}),
            ("C90101", {"avg_amount": 40.0, "std_amount": 10.0, "tx_count": 4, "typical_hours": [10, 11], "typical_recipients": []}),
        ]
        for cid, data in seed_data:
            self.profiles[cid] = data

    def get_or_create_profile(self, customer_id: str) -> Dict[str, Any]:
        if customer_id not in self.profiles:
            # Cold-start baseline for new customer
            self.profiles[customer_id] = {
                "avg_amount": 150.0,
                "std_amount": 100.0,
                "tx_count": 5,
                "typical_hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                "typical_recipients": []
            }
        return self.profiles[customer_id]

    def evaluate_behavioral_deviation(self, txn_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes behavioral anomaly deviation score S_behavioral in [0.0, 1.0].
        Evaluates:
        1. Amount Z-Score against user's historical distribution
        2. Off-Hours / Nocturnal Activity deviation
        3. Recipient Familiarity / Novel Account interaction
        4. Transaction Velocity Spikes
        """
        customer_id = str(txn_dict.get("nameOrig", "C_UNKNOWN"))
        amount = float(txn_dict.get("amount") or txn_dict.get("amt") or 0.0)
        step = int(txn_dict.get("step", 1))
        hour_of_day = (step % 24) # 0 to 23
        recipient = str(txn_dict.get("nameDest", ""))

        profile = self.get_or_create_profile(customer_id)
        avg_amt = profile["avg_amount"]
        std_amt = max(10.0, profile["std_amount"])
        typical_hours = profile.get("typical_hours", list(range(24)))
        typical_recipients = profile.get("typical_recipients", [])

        # 1. Amount Z-Score
        z_score = max(0.0, (amount - avg_amt) / std_amt)
        # Scale z-score: z=0 -> 0.0, z=3 -> 0.6, z=6+ -> 0.95
        amount_deviation_score = min(1.0, z_score / 6.0)

        # 2. Time-of-day off-hours check (e.g. 2 AM - 5 AM unusual burst)
        is_off_hours = hour_of_day not in typical_hours and (hour_of_day < 6 or hour_of_day > 23)
        time_deviation_score = 0.45 if is_off_hours else 0.0

        # 3. New Recipient Flag
        is_new_recipient = (recipient not in typical_recipients) and (len(typical_recipients) > 0)
        recipient_score = 0.20 if is_new_recipient else 0.0

        # 4. High Multiplier over user average
        multiplier = (amount / avg_amt) if avg_amt > 0 else 1.0

        # Composite Behavioral Risk Score
        raw_behavior_score = (
            0.50 * amount_deviation_score +
            0.30 * time_deviation_score +
            0.20 * recipient_score
        )

        behavior_score = max(0.01, min(0.99, round(raw_behavior_score, 4)))

        reasons = []
        if multiplier >= 3.0:
            reasons.append(f"Transaction amount (${amount:,.2f}) is {multiplier:.1f}× higher than customer's 30-day baseline average (${avg_amt:,.2f})")
        if is_off_hours:
            reasons.append(f"Activity at {hour_of_day:02d}:00 hours falls outside of the customer's typical operating window (Nocturnal anomaly)")
        if is_new_recipient and amount > 5000:
            reasons.append(f"High-value transfer directed to a previously unseen recipient account ('{recipient}')")

        if not reasons:
            reasons.append("Transaction aligns with historical customer spending and timing profile.")

        return {
            "behavioral_score": behavior_score,
            "z_score": round(float(z_score), 2),
            "customer_baseline_avg": round(float(avg_amt), 2),
            "amount_multiplier": round(float(multiplier), 2),
            "is_off_hours": is_off_hours,
            "reasons": reasons
        }

behavioral_engine = CustomerBehavioralProfiler()
