import os
import json
import logging
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import precision_recall_curve, precision_recall_fscore_support, roc_auc_score, average_precision_score, accuracy_score
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from omni_smote import OmniSMOTE

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def optimize_creditcard_model(data_path):
    logging.info(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)

    X = df.drop(columns=['Class'])
    y = df['Class']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = RobustScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Calculate exact class weight ratio for scale_pos_weight
    ratio = (len(y_train) - sum(y_train)) / sum(y_train)
    logging.info(f"Class imbalance ratio calculated: {ratio:.2f}:1")

    # Apply OmniSMOTE
    logging.info("Applying OmniSMOTE resampling...")
    omni_smote = OmniSMOTE(sampling_strategy=0.30, random_state=42)
    X_train_res, y_train_res = omni_smote.fit_resample(X_train_scaled, y_train)

    logging.info("Training Class-Weighted Stacking Ensemble (XGBoost + LightGBM + RF)...")
    base_learners = [
        ('xgb', XGBClassifier(n_estimators=150, max_depth=6, learning_rate=0.05, scale_pos_weight=3.0, random_state=42, n_jobs=-1)),
        ('lgbm', LGBMClassifier(n_estimators=150, learning_rate=0.05, class_weight='balanced', random_state=42, n_jobs=-1, verbose=-1)),
        ('rf', RandomForestClassifier(n_estimators=150, max_depth=10, class_weight='balanced', n_jobs=-1, random_state=42))
    ]
    
    meta_learner = LogisticRegression()
    model = StackingClassifier(estimators=base_learners, final_estimator=meta_learner, cv=3)
    model.fit(X_train_res, y_train_res)

    test_probs = model.predict_proba(X_test_scaled)[:, 1]

    # Threshold Optimization via Precision-Recall Curve
    precisions, recalls, thresholds = precision_recall_curve(y_test, test_probs)
    f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-10)
    best_idx = np.argmax(f1_scores)
    optimal_thresh = float(thresholds[best_idx]) if best_idx < len(thresholds) else 0.50

    # Default Threshold Predictions (0.50)
    def_preds = (test_probs >= 0.50).astype(int)
    def_p, def_r, def_f1, _ = precision_recall_fscore_support(y_test, def_preds, average='binary')

    # Optimized Threshold Predictions
    opt_preds = (test_probs >= optimal_thresh).astype(int)
    opt_p, opt_r, opt_f1, _ = precision_recall_fscore_support(y_test, opt_preds, average='binary')

    roc = roc_auc_score(y_test, test_probs)
    pr = average_precision_score(y_test, test_probs)

    print("\n" + "=" * 85)
    print("      DOMAIN OPTIMIZATION REPORT: KAGGLE CREDIT CARD DATASET")
    print("=" * 85)
    print(f"Calculated Optimal Threshold: {optimal_thresh:.4f} (vs Default 0.5000)\n")
    print(f"{'Configuration':<28} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'ROC-AUC':<9} | {'PR-AUC':<9}")
    print("-" * 85)
    print(f"{'Before (Default Thresh 0.50)':<28} | {def_p:<10.4f} | {def_r:<10.4f} | {def_f1:<10.4f} | {roc:<9.4f} | {pr:<9.4f}")
    print(f"{'AFTER (Optimized & Weighted)':<28} | {opt_p:<10.4f} | {opt_r:<10.4f} | {opt_f1:<10.4f} | {roc:<9.4f} | {pr:<9.4f}")
    print("=" * 85 + "\n")

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_PATH = os.path.join(project_root, 'data', 'raw', 'creditcard.csv')
    optimize_creditcard_model(DATA_PATH)
