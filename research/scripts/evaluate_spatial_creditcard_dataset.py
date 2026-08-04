import os
import json
import logging
import pandas as pd
import numpy as np
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

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c

def evaluate_spatial_creditcard(train_path, test_path, sample_size=200000):
    logging.info(f"Loading Spatial Credit Card Dataset: Train={train_path}, Test={test_path}...")
    df_train = pd.read_csv(train_path)
    df_test = pd.read_csv(test_path)

    if sample_size and len(df_train) > sample_size:
        logging.info(f"Sampling {sample_size:,} records from training set for rapid ML benchmarking...")
        df_fraud = df_train[df_train['is_fraud'] == 1]
        df_norm = df_train[df_train['is_fraud'] == 0].sample(n=sample_size - len(df_fraud), random_state=42)
        df_train = pd.concat([df_fraud, df_norm]).sample(frac=1.0, random_state=42).reset_index(drop=True)

    if sample_size and len(df_test) > 50000:
        df_test_fraud = df_test[df_test['is_fraud'] == 1]
        df_test_norm = df_test[df_test['is_fraud'] == 0].sample(n=50000 - len(df_test_fraud), random_state=42)
        df_test = pd.concat([df_test_fraud, df_test_norm]).sample(frac=1.0, random_state=42).reset_index(drop=True)

    logging.info("Performing Spatial & Behavioral Feature Engineering...")
    for df in [df_train, df_test]:
        df['distance_km'] = haversine_distance(df['lat'], df['long'], df['merch_lat'], df['merch_long'])
        df['hour'] = pd.to_datetime(df['trans_date_trans_time']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['trans_date_trans_time']).dt.dayofweek

    le_cat = LabelEncoder()
    le_gender = LabelEncoder()

    df_train['category'] = le_cat.fit_transform(df_train['category'])
    df_test['category'] = le_cat.transform(df_test['category'])

    df_train['gender'] = le_gender.fit_transform(df_train['gender'])
    df_test['gender'] = le_gender.transform(df_test['gender'])

    features = ['amt', 'distance_km', 'city_pop', 'category', 'gender', 'hour', 'day_of_week']
    
    X_train = df_train[features]
    y_train = df_train['is_fraud']

    X_test = df_test[features]
    y_test = df_test['is_fraud']

    scaler = RobustScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    logging.info("Applying OmniSMOTE oversampling to training set...")
    omni_smote = OmniSMOTE(sampling_strategy=0.50, random_state=42)
    X_train_res, y_train_res = omni_smote.fit_resample(X_train_scaled, y_train)

    logging.info("Training Stacking Ensemble on Spatial Credit Card features...")
    model = StackingClassifier(
        estimators=[
            ('xgb', XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, n_jobs=-1)),
            ('lgbm', LGBMClassifier(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)),
            ('rf', RandomForestClassifier(n_estimators=100, max_depth=8, n_jobs=-1, random_state=42))
        ],
        final_estimator=LogisticRegression(),
        cv=3
    )

    model.fit(X_train_res, y_train_res)

    test_probs = model.predict_proba(X_test_scaled)[:, 1]
    test_preds = (test_probs >= 0.50).astype(int)

    prec, rec, f1, _ = precision_recall_fscore_support(y_test, test_preds, average='binary')
    acc = accuracy_score(y_test, test_preds)
    roc = roc_auc_score(y_test, test_probs)
    pr = average_precision_score(y_test, test_probs)

    print("\n" + "=" * 75)
    print("  EVALUATION REPORT: KAGGLE SPATIAL CREDIT CARD DATASET (kartik2112)")
    print("=" * 75)
    print(f"{'Metric':<25} | {'Spatial Credit Card Test Result':<25}")
    print("-" * 75)
    print(f"{'Accuracy':<25} | {acc:.4f} ({acc*100:.2f}%)")
    print(f"{'Precision':<25} | {prec:.4f} ({prec*100:.2f}%)")
    print(f"{'Recall':<25} | {rec:.4f} ({rec*100:.2f}%)")
    print(f"{'F1-Score':<25} | {f1:.4f} ({f1*100:.2f}%)")
    print(f"{'ROC-AUC':<25} | {roc:.4f}")
    print(f"{'PR-AUC':<25} | {pr:.4f}")
    print("=" * 75 + "\n")

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    train_p = os.path.join(project_root, 'data', 'raw', 'fraudTrain.csv')
    test_p = os.path.join(project_root, 'data', 'raw', 'fraudTest.csv')
    evaluate_spatial_creditcard(train_p, test_p)
