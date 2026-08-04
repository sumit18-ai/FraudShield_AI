import os
import joblib
import pandas as pd
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(os.path.dirname(os.path.dirname(current_dir)), 'models')

# Model Registry
domain_models = {}
domain_scalers = {}
domain_metadata = {}

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
    global domain_models, domain_scalers, domain_metadata
    
    # Domain Configurations: (name, model_file, scaler_file, meta_file)
    configs = [
        ('paysim', 'ensemble_model.joblib', 'scaler.joblib', 'feature_metadata.json'),
        ('creditcard', 'creditcard_model.joblib', 'creditcard_scaler.joblib', 'creditcard_metadata.json'),
        ('spatial', 'spatial_model.joblib', 'spatial_scaler.joblib', 'spatial_metadata.json'),
        ('banksim', 'banksim_model.joblib', 'banksim_scaler.joblib', 'banksim_metadata.json'),
    ]

    for domain_key, m_file, s_file, meta_file in configs:
        m_path = os.path.join(models_dir, m_file)
        s_path = os.path.join(models_dir, s_file)
        meta_path = os.path.join(models_dir, meta_file)

        if os.path.exists(m_path) and os.path.exists(s_path) and os.path.exists(meta_path):
            try:
                m_obj = joblib.load(m_path)
                patch_logistic_regression(m_obj)
                s_obj = joblib.load(s_path)
                with open(meta_path, 'r') as f:
                    meta_obj = json.load(f)

                domain_models[domain_key] = m_obj
                domain_scalers[domain_key] = s_obj
                domain_metadata[domain_key] = meta_obj
                print(f"Loaded Domain Model Head: '{domain_key}'")
            except Exception as e:
                print(f"Error loading domain '{domain_key}': {e}")
        else:
            print(f"Domain model head '{domain_key}' not found at {m_path}, fallback available.")

    # Set default pointers for backward compatibility
    global model, scaler, feature_metadata
    model = domain_models.get('paysim')
    scaler = domain_scalers.get('paysim')
    feature_metadata = domain_metadata.get('paysim')

def preprocess_transaction(t_dict: dict, domain: str = 'paysim'):
    domain = domain.lower()
    if domain not in domain_models:
        domain = 'paysim'

    meta = domain_metadata[domain]
    sc = domain_scalers[domain]
    df = pd.DataFrame([t_dict])

    if domain == 'paysim':
        df['errorBalanceOrig'] = df['oldbalanceOrg'] - df['amount'] - df['newbalanceOrig']
        df['errorBalanceDest'] = df['oldbalanceDest'] + df['amount'] - df['newbalanceDest']
        df['is_high_amount_transfer'] = (df['amount'] > 200000).astype(int)
        
        type_val = df['type'].iloc[0] if 'type' in df.columns else 'PAYMENT'
        classes = meta.get('label_encoder_classes', [])
        df['type'] = classes.index(type_val) if type_val in classes else 0

    elif domain == 'banksim':
        for col in ['age', 'gender', 'category']:
            if col in df.columns:
                val = str(df[col].iloc[0]).replace("'", "").strip()
                classes = meta.get(f'{col}_classes', [])
                df[col] = classes.index(val) if val in classes else 0
            else:
                df[col] = 0

    features = meta['features']
    # Fill missing features with 0.0 if not present
    for f in features:
        if f not in df.columns:
            df[f] = 0.0

    df = df[features]
    scaled_data = sc.transform(df)
    return df, scaled_data
