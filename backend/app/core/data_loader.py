import pandas as pd
import random
import os

# Define path robustly relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
DATA_PATH = os.path.join(project_root, "data", "raw", "paysim.csv")

# Fallback for Docker environment where data volume is mounted at /app/data
if not os.path.exists(DATA_PATH):
    docker_data_path = "/app/data/raw/paysim.csv"
    if os.path.exists(docker_data_path):
        DATA_PATH = docker_data_path


fraud_df = None
legit_df = None

def load_data():
    global fraud_df, legit_df
    print(f"🚀 Loading dataset for simulation into memory from {DATA_PATH}...")
    
    if not os.path.exists(DATA_PATH):
        print(f"❌ Dataset file not found at {DATA_PATH}")
        return
        
    df = pd.read_csv(DATA_PATH)
    
    # Separate fraud and legitimate
    fraud_cases = df[df['isFraud'] == 1]
    legit_cases = df[df['isFraud'] == 0]
    
    fraud_df = fraud_cases
    legit_df = legit_cases
    
    print(f"📊 Dataset Loaded: {len(legit_df)} Legit, {len(fraud_df)} Fraud cases available.")

def get_random_transaction():
    global fraud_df, legit_df
    if fraud_df is None or legit_df is None:
        load_data()
        
    if fraud_df is None or legit_df is None or fraud_df.empty or legit_df.empty:
        return None
        
    # 80% chance of legit transaction, 20% chance of fraud for demo purposes
    if random.random() < 0.2:
        return fraud_df.sample(1).iloc[0]
    else:
        return legit_df.sample(1).iloc[0]

