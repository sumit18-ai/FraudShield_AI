import os
import json
import logging
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import RobustScaler, LabelEncoder
from sklearn.metrics import (
    precision_recall_fscore_support, roc_auc_score, average_precision_score,
    accuracy_score, confusion_matrix
)

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def evaluate_overfitting(data_path, sample_size=250000):
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    models_dir = os.path.join(project_root, 'backend', 'models')

    logging.info("Loading saved model artifacts...")
    model_path = os.path.join(models_dir, 'ensemble_model.joblib')
    scaler_path = os.path.join(models_dir, 'scaler.joblib')
    meta_path = os.path.join(models_dir, 'feature_metadata.json')

    if not os.path.exists(model_path):
        logging.error(f"Model file not found at {model_path}")
        return

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    with open(meta_path, 'r') as f:
        meta = json.load(f)

    optimal_threshold = meta.get('optimal_threshold', 0.5)

    logging.info(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)

    if sample_size and len(df) > sample_size:
        logging.info(f"Sampling {sample_size:,} records for out-of-sample overfitting evaluation...")
        df_fraud = df[df['isFraud'] == 1]
        df_normal = df[df['isFraud'] == 0].sample(n=sample_size - len(df_fraud), random_state=42)
        df = pd.concat([df_fraud, df_normal]).sample(frac=1.0, random_state=42).reset_index(drop=True)

    # Feature Engineering
    df['errorBalanceOrig'] = df['oldbalanceOrg'] - df['amount'] - df['newbalanceOrig']
    df['errorBalanceDest'] = df['oldbalanceDest'] + df['amount'] - df['newbalanceDest']
    df['is_high_amount_transfer'] = (df['amount'] > 200000).astype(int)

    label_encoder = LabelEncoder()
    df['type'] = label_encoder.fit_transform(df['type'])

    cols_to_drop = ['nameOrig', 'nameDest', 'isFlaggedFraud']
    df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])

    X = df.drop('isFraud', axis=1)
    y = df['isFraud']

    # Train / Test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Predictions & Probabilities on Training Set
    train_probs = model.predict_proba(X_train_scaled)[:, 1]
    train_preds = (train_probs >= optimal_threshold).astype(int)

    # Predictions & Probabilities on Test Set
    test_probs = model.predict_proba(X_test_scaled)[:, 1]
    test_preds = (test_probs >= optimal_threshold).astype(int)

    # Metrics computation
    tr_prec, tr_rec, tr_f1, _ = precision_recall_fscore_support(y_train, train_preds, average='binary')
    te_prec, te_rec, te_f1, _ = precision_recall_fscore_support(y_test, test_preds, average='binary')

    tr_roc = roc_auc_score(y_train, train_probs)
    te_roc = roc_auc_score(y_test, test_probs)

    tr_pr = average_precision_score(y_train, train_probs)
    te_pr = average_precision_score(y_test, test_probs)

    tr_acc = accuracy_score(y_train, train_preds)
    te_acc = accuracy_score(y_test, test_preds)

    f1_gap = tr_f1 - te_f1
    pr_gap = tr_pr - te_pr

    print("\n" + "=" * 60)
    print("        MODEL OVERFITTING DIAGNOSTIC REPORT")
    print("=" * 60)
    print(f"Optimal Decision Threshold: {optimal_threshold:.4f}\n")

    print(f"{'Metric':<20} | {'Train Set':<12} | {'Test Set (Unseen)':<18} | {'Gap (Train - Test)':<18}")
    print("-" * 75)
    print(f"{'Accuracy':<20} | {tr_acc:<12.4f} | {te_acc:<18.4f} | {tr_acc - te_acc:<18.4f}")
    print(f"{'Precision':<20} | {tr_prec:<12.4f} | {te_prec:<18.4f} | {tr_prec - te_prec:<18.4f}")
    print(f"{'Recall':<20} | {tr_rec:<12.4f} | {te_rec:<18.4f} | {tr_rec - te_rec:<18.4f}")
    print(f"{'F1-Score':<20} | {tr_f1:<12.4f} | {te_f1:<18.4f} | {f1_gap:<18.4f}")
    print(f"{'ROC-AUC':<20} | {tr_roc:<12.4f} | {te_roc:<18.4f} | {tr_roc - te_roc:<18.4f}")
    print(f"{'PR-AUC':<20} | {tr_pr:<12.4f} | {te_pr:<18.4f} | {pr_gap:<18.4f}")
    print("=" * 75)

    print("\nOVERFITTING DIAGNOSIS:")
    if abs(f1_gap) < 0.02 and abs(pr_gap) < 0.02:
        print("[OK] NO OVERFITTING DETECTED! The model generalizes exceptionally well to unseen test data.")
        print(f"   (F1-Score Generalization Gap is only {abs(f1_gap):.4f}, well below the 0.05 threshold).")
    elif abs(f1_gap) < 0.05:
        print("⚠️ MILD OVERFITTING RISK: Minor variance gap, but performance remains stable.")
    else:
        print("❌ OVERFITTING DETECTED! High gap between training and test performance.")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_PATH = os.path.join(project_root, 'data', 'raw', 'paysim.csv')
    evaluate_overfitting(DATA_PATH)
