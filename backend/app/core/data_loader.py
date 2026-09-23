import pandas as pd
import random
import os
import json
from .logger import get_logger

logger = get_logger(__name__)

# Define path robustly relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
DATA_PATH = os.path.join(project_root, "data", "raw", "paysim.csv")
SEED_PATH = os.path.join(project_root, "data", "seed", "sample_transactions.json")

# Fallback for Docker environment where data volume is mounted at /app/data
if not os.path.exists(DATA_PATH):
    docker_data_path = "/app/data/raw/paysim.csv"
    if os.path.exists(docker_data_path):
        DATA_PATH = docker_data_path

if not os.path.exists(SEED_PATH):
    docker_seed_path = "/app/data/seed/sample_transactions.json"
    if os.path.exists(docker_seed_path):
        SEED_PATH = docker_seed_path

fraud_df = None
legit_df = None

def load_data():
    global fraud_df, legit_df
    
    # 1. Try loading raw PaySim CSV if present
    if os.path.exists(DATA_PATH):
        try:
            logger.info("data_loader_loading_csv", path=DATA_PATH)
            df = pd.read_csv(DATA_PATH)
            fraud_df = df[df['isFraud'] == 1]
            legit_df = df[df['isFraud'] == 0]
            logger.info("data_loader_csv_loaded", legit_count=len(legit_df), fraud_count=len(fraud_df))
            return
        except Exception as e:
            logger.error("data_loader_csv_read_failed", error=str(e), path=DATA_PATH)

    # 2. Fall back to curated seed transactions JSON
    if os.path.exists(SEED_PATH):
        try:
            logger.info("data_loader_loading_seed", path=SEED_PATH)
            with open(SEED_PATH, "r") as f:
                seed_data = json.load(f)
            df = pd.DataFrame(seed_data)
            fraud_df = df[df['isFraud'] == 1]
            legit_df = df[df['isFraud'] == 0]
            logger.info("data_loader_seed_loaded", legit_count=len(legit_df), fraud_count=len(fraud_df))
            return
        except Exception as e:
            logger.error("data_loader_seed_read_failed", error=str(e), path=SEED_PATH)

    # 3. In-memory synthetic fallback if seed files are unavailable
    logger.warning("data_loader_using_in_memory_fallback")
    fallback_records = [
        {"step": 1, "type": "PAYMENT", "amount": 98.5, "nameOrig": "C12345", "oldbalanceOrg": 500.0, "newbalanceOrig": 401.5, "nameDest": "M98765", "oldbalanceDest": 0.0, "newbalanceDest": 0.0, "isFraud": 0},
        {"step": 2, "type": "TRANSFER", "amount": 250000.0, "nameOrig": "C99999", "oldbalanceOrg": 250000.0, "newbalanceOrig": 0.0, "nameDest": "C88888", "oldbalanceDest": 0.0, "newbalanceDest": 0.0, "isFraud": 1}
    ]
    df = pd.DataFrame(fallback_records)
    fraud_df = df[df['isFraud'] == 1]
    legit_df = df[df['isFraud'] == 0]

def get_random_transaction(fraud_rate: float = 0.015):
    global fraud_df, legit_df
    if fraud_df is None or legit_df is None:
        load_data()
        
    if fraud_df is None or legit_df is None or (fraud_df.empty and legit_df.empty):
        return None
        
    # Reflect real-world severe class imbalance: 98.5% legit, 1.5% fraud
    target_fraud_rate = max(0.0, min(1.0, fraud_rate if fraud_rate is not None else 0.015))
    if not fraud_df.empty and random.random() < target_fraud_rate:
        return fraud_df.sample(1).iloc[0]
    elif not legit_df.empty:
        return legit_df.sample(1).iloc[0]
    elif not fraud_df.empty:
        return fraud_df.sample(1).iloc[0]
    return None
