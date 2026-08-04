import os
import logging
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
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

def evaluate_creditcard_backend(data_path):
    logging.info(f"Loading Credit Card Test Dataset from {data_path}...")
    if not os.path.exists(data_path):
        logging.error(f"Dataset file not found at {data_path}")
        return

    df = pd.read_csv(data_path)
    logging.info(f"Credit Card Dataset loaded: {len(df)} records, {len(df[df['Class']==1])} Fraud cases.")

    X = df.drop(columns=['Class'])
    y = df['Class']

    # Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    scaler = RobustScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Oversampling via OmniSMOTE
    logging.info("Applying OmniSMOTE oversampling to Credit Card training features...")
    omni_smote = OmniSMOTE(sampling_strategy=0.50, random_state=42)
    X_train_res, y_train_res = omni_smote.fit_resample(X_train_scaled, y_train)

    # Train Stacking Ensemble Model
    logging.info("Fitting Stacking Ensemble (XGBoost + LightGBM + Random Forest) on Credit Card dataset...")
    base_learners = [
        ('xgb', XGBClassifier(n_estimators=50, max_depth=4, learning_rate=0.1, random_state=42, n_jobs=-1)),
        ('lgbm', LGBMClassifier(n_estimators=50, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)),
        ('rf', RandomForestClassifier(n_estimators=50, max_depth=6, n_jobs=-1, random_state=42))
    ]
    meta_learner = LogisticRegression()

    stacking_model = StackingClassifier(
        estimators=base_learners,
        final_estimator=meta_learner,
        cv=3
    )

    stacking_model.fit(X_train_res, y_train_res)

    # Evaluate on Test Set
    test_probs = stacking_model.predict_proba(X_test_scaled)[:, 1]
    test_preds = (test_probs >= 0.50).astype(int)

    prec, rec, f1, _ = precision_recall_fscore_support(y_test, test_preds, average='binary', zero_division=1)
    acc = accuracy_score(y_test, test_preds)

    print("\n" + "=" * 65)
    print("      BACKEND EVALUATION REPORT: CREDIT CARD FRAUD DATASET")
    print("=" * 65)
    print(f"{'Metric':<25} | {'Credit Card Test Result':<20}")
    print("-" * 65)
    print(f"{'Accuracy':<25} | {acc:.4f} ({acc*100:.2f}%)")
    print(f"{'Precision':<25} | {prec:.4f} ({prec*100:.2f}%)")
    print(f"{'Recall':<25} | {rec:.4f} ({rec*100:.2f}%)")
    print(f"{'F1-Score':<25} | {f1:.4f} ({f1*100:.2f}%)")
    print("=" * 65 + "\n")

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1
    }

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    real_kaggle_path = os.path.join(project_root, 'data', 'raw', 'creditcard.csv')
    sample_path = os.path.join(project_root, 'data', 'raw', 'creditcard_sample.csv')
    
    DATA_PATH = real_kaggle_path if os.path.exists(real_kaggle_path) else sample_path
    evaluate_creditcard_backend(DATA_PATH)
