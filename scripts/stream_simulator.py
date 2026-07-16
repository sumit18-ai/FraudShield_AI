import pandas as pd
import requests
import time
import random
import json

# Configuration
API_URL = "http://localhost:8008/analyze"  # Ensure your FastAPI is running here
DATA_PATH = "data/raw/paysim.csv"
DELAY_SECONDS = 2  # Time between transactions

def load_simulation_data():
    print("🚀 Loading dataset for simulation...")
    df = pd.read_csv(DATA_PATH)
    
    # Separate fraud and legitimate to control the flow
    fraud_cases = df[df['isFraud'] == 1]
    legit_cases = df[df['isFraud'] == 0]
    
    print(f"📊 Dataset Loaded: {len(legit_cases)} Legit, {len(fraud_cases)} Fraud cases available.")
    return fraud_cases, legit_cases

def simulate_stream():
    fraud_df, legit_df = load_simulation_data()
    
    print(f"📡 Starting Live Transaction Stream to {API_URL}...")
    print("Press Ctrl+C to stop.\n")

    while True:
        # 80% chance of legit transaction, 20% chance of fraud for demo purposes
        # (Real life is 99.9% legit, but that makes for a boring demo!)
        if random.random() < 0.2:
            transaction = fraud_df.sample(1).iloc[0]
            tag = "🚨 [EXPECTED FRAUD]"
        else:
            transaction = legit_df.sample(1).iloc[0]
            tag = "✅ [EXPECTED LEGIT]"

        # Convert the row to a dictionary matching your FastAPI Pydantic model
        payload = {
            "step": int(transaction['step']),
            "type": str(transaction['type']),
            "amount": float(transaction['amount']),
            "nameOrig": str(transaction['nameOrig']),
            "oldbalanceOrg": float(transaction['oldbalanceOrg']),
            "newbalanceOrig": float(transaction['newbalanceOrig']),
            "nameDest": str(transaction['nameDest']),
            "oldbalanceDest": float(transaction['oldbalanceDest']),
            "newbalanceDest": float(transaction['newbalanceDest'])
        }

        try:
            # Send to Backend
            response = requests.post(API_URL, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                score = result.get('risk_score', 0)
                decision = result.get('decision', 'UNKNOWN')
                
                # Terminal UI
                color = "\033[91m" if decision.upper() == "BLOCK" else "\033[92m"
                reset = "\033[0m"
                
                print(f"{tag} Trans: {payload['nameOrig']} -> {payload['amount']} | "
                      f"Risk: {color}{score}%{reset} | Decision: {color}{decision}{reset}")
                
                if decision.upper() == "BLOCK":
                    print(f"   ↳ Reasons: {result.get('explanations', 'N/A')}")
            else:
                print(f"❌ API Error: {response.status_code}")

        except requests.exceptions.ConnectionError:
            print("⚠️ Backend Offline. Make sure main.py is running on localhost:8008")

        time.sleep(DELAY_SECONDS)

if __name__ == "__main__":
    simulate_stream()