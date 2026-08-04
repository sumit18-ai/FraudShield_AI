import os
import json
import logging
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    precision_recall_fscore_support, roc_auc_score, average_precision_score,
    accuracy_score, confusion_matrix
)
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from omni_smote import OmniSMOTE

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def evaluate_banksim(data_path):
    logging.info(f"Loading BankSim Dataset from {data_path}...")
    if not os.path.exists(data_path):
        logging.error(f"Dataset file not found at {data_path}")
        return

    df = pd.read_csv(data_path)
    
    # Strip quotes from strings if present
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.replace("'", "").str.strip()

    total_records = len(df)
    fraud_records = int(df['fraud'].sum())
    fraud_rate = (fraud_records / total_records) * 100

    logging.info(f"BankSim Dataset loaded: {total_records} records, {fraud_records} Fraud cases ({fraud_rate:.2f}%).")

    # Category Fraud Rate Breakdown Table
    cat_summary = df.groupby('category').agg(
        Total=('fraud', 'count'),
        Fraud_Cases=('fraud', 'sum'),
        Total_Amount=('amount', 'sum')
    ).reset_index()
    cat_summary['Fraud_Rate_%'] = (cat_summary['Fraud_Cases'] / cat_summary['Total']) * 100
    cat_summary['Avg_Amount'] = cat_summary['Total_Amount'] / cat_summary['Total']
    cat_summary = cat_summary.sort_values(by='Fraud_Rate_%', ascending=False)

    # Encode Categoricals for ML
    label_encoders = {}
    for col in ['age', 'gender', 'category']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le

    # Drop Identifiers
    cols_to_drop = ['customer', 'merchant', 'zipcodeOri', 'zipMerchant']
    df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])

    X = df.drop(columns=['fraud'])
    y = df['fraud']

    # Train / Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = RobustScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Model Architecture Benchmark
    logging.info("Training ML Model Architectures on BankSim dataset...")
    
    models = {
        'Stacking Ensemble': StackingClassifier(
            estimators=[
                ('xgb', XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, n_jobs=-1)),
                ('lgbm', LGBMClassifier(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)),
                ('rf', RandomForestClassifier(n_estimators=100, max_depth=8, n_jobs=-1, random_state=42))
            ],
            final_estimator=LogisticRegression(),
            cv=3
        ),
        'XGBoost': XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, n_jobs=-1),
        'LightGBM': LGBMClassifier(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1),
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=8, n_jobs=-1, random_state=42)
    }

    # Apply OmniSMOTE to training set
    omni_smote = OmniSMOTE(sampling_strategy=0.50, random_state=42)
    X_train_res, y_train_res = omni_smote.fit_resample(X_train_scaled, y_train)

    model_results = []
    for name, clf in models.items():
        clf.fit(X_train_res, y_train_res)
        probs = clf.predict_proba(X_test_scaled)[:, 1]
        preds = (probs >= 0.50).astype(int)

        prec, rec, f1, _ = precision_recall_fscore_support(y_test, preds, average='binary', zero_division=0)
        roc = roc_auc_score(y_test, probs)
        pr = average_precision_score(y_test, probs)
        acc = accuracy_score(y_test, preds)

        model_results.append({
            'Model': name,
            'Accuracy': acc,
            'Precision': prec,
            'Recall': rec,
            'F1_Score': f1,
            'ROC_AUC': roc,
            'PR_AUC': pr
        })

    model_df = pd.DataFrame(model_results)

    # Print Formatted Evaluation Tables
    print("\n" + "=" * 80)
    print("      TABLE 1: BANKSIM DATASET CATEGORY FRAUD RISK ANALYSIS")
    print("=" * 80)
    print(f"{'Category':<24} | {'Total Tx':<9} | {'Fraud Cases':<11} | {'Fraud Rate %':<13} | {'Avg Amount ($)':<14}")
    print("-" * 80)
    for _, r in cat_summary.iterrows():
        print(f"{r['category']:<24} | {r['Total']:<9} | {r['Fraud_Cases']:<11} | {r['Fraud_Rate_%']:<13.2f}% | ${r['Avg_Amount']:<13.2f}")
    print("=" * 80)

    print("\n" + "=" * 80)
    print("      TABLE 2: BANKSIM MODEL ARCHITECTURE BENCHMARK (WITH OMNISMOTE)")
    print("=" * 80)
    print(f"{'Model Architecture':<22} | {'Accuracy':<9} | {'Precision':<10} | {'Recall':<9} | {'F1-Score':<9} | {'ROC-AUC':<8} | {'PR-AUC':<8}")
    print("-" * 80)
    for _, r in model_df.iterrows():
        print(f"{r['Model']:<22} | {r['Accuracy']:<9.4f} | {r['Precision']:<10.4f} | {r['Recall']:<9.4f} | {r['F1_Score']:<9.4f} | {r['ROC_AUC']:<8.4f} | {r['PR_AUC']:<8.4f}")
    print("=" * 80 + "\n")

    return cat_summary, model_df

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_PATH = os.path.join(project_root, 'data', 'raw', 'banksim_sample.csv')
    evaluate_banksim(DATA_PATH)
