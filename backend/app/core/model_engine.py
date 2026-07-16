import os
import joblib
import pandas as pd
import json

# Define paths
current_dir = os.path.dirname(os.path.abspath(__file__))
# app/core -> app -> backend -> models
models_dir = os.path.join(os.path.dirname(os.path.dirname(current_dir)), 'models')

# Global variables
model = None
scaler = None
feature_metadata = None

def patch_logistic_regression(obj):
    from sklearn.linear_model import LogisticRegression
    if isinstance(obj, LogisticRegression):
        if not hasattr(obj, 'multi_class'):
            obj.multi_class = 'auto'
    elif hasattr(obj, '__dict__'):
        for k, v in list(obj.__dict__.items()):
            patch_logistic_regression(v)
    elif isinstance(obj, list) or isinstance(obj, tuple):
        for item in obj:
            patch_logistic_regression(item)
    elif isinstance(obj, dict):
        for item in list(obj.values()):
            patch_logistic_regression(item)

def load_models():
    global model, scaler, feature_metadata
    try:
        model = joblib.load(os.path.join(models_dir, 'ensemble_model.joblib'))
        # Patch unpickled models to be fully compatible with scikit-learn 1.6.x
        patch_logistic_regression(model)
        
        scaler = joblib.load(os.path.join(models_dir, 'scaler.joblib'))
        with open(os.path.join(models_dir, 'feature_metadata.json'), 'r') as f:
            feature_metadata = json.load(f)
        print("Models loaded successfully.")
    except Exception as e:
        print(f"Error loading models: {e}")

def preprocess_transaction(t_dict: dict):
    df = pd.DataFrame([t_dict])

    # Feature Engineering
    df['errorBalanceOrig'] = df['oldbalanceOrg'] - df['amount'] - df['newbalanceOrig']
    df['errorBalanceDest'] = df['oldbalanceDest'] + df['amount'] - df['newbalanceDest']
    df['is_high_amount_transfer'] = (df['amount'] > 200000).astype(int)

    # Encoding
    try:
        type_val = df['type'].iloc[0]
        classes = feature_metadata['label_encoder_classes']
        if type_val in classes:
            df['type'] = classes.index(type_val)
        else:
            df['type'] = 0
    except Exception:
        df['type'] = 0 

    # Reorder columns and scale
    df = df[feature_metadata['features']]
    scaled_data = scaler.transform(df)
    return df, scaled_data
