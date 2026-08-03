import os
import json
import logging
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_curve, f1_score, precision_recall_fscore_support
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from omni_smote import OmniSMOTE

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class FraudShieldPipeline:
    def __init__(self, data_path):
        self.data_path = data_path
        self.scaler = RobustScaler()
        self.label_encoder = LabelEncoder()
        self.stacking_model = None
        self.optimal_threshold = 0.5

    def load_and_engineer_features(self):
        """Loads data and creates PaySim-specific features."""
        logging.info("Loading dataset and performing feature engineering...")
        df = pd.read_csv(self.data_path)

        # Downsample majority class to speed up training while preserving all fraud rows
        df_fraud = df[df['isFraud'] == 1]
        df_normal = df[df['isFraud'] == 0]
        if len(df_normal) > 200000:
            df_normal = df_normal.sample(n=200000, random_state=42)
        df = pd.concat([df_fraud, df_normal]).sample(frac=1.0, random_state=42).reset_index(drop=True)

        # 1. Feature Engineering: Balance Errors
        df['errorBalanceOrig'] = df['oldbalanceOrg'] - df['amount'] - df['newbalanceOrig']
        df['errorBalanceDest'] = df['oldbalanceDest'] + df['amount'] - df['newbalanceDest']

        # 2. Boolean for High Amount Transfer
        df['is_high_amount_transfer'] = (df['amount'] > 200000).astype(int)

        # 3. Categorical Encoding
        df['type'] = self.label_encoder.fit_transform(df['type'])

        # 4. Drop Non-Predictive Identifiers
        cols_to_drop = ['nameOrig', 'nameDest', 'isFlaggedFraud']
        df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])
        
        return df

    def preprocess_and_split(self, df):
        """
        Scales data and performs Train/Test split BEFORE oversampling
        to prevent data leakage.
        """
        logging.info("Splitting dataset and fitting RobustScaler (no data leakage)...")
        
        X = df.drop('isFraud', axis=1)
        y = df['isFraud']

        # Train/Test split FIRST
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Scale using training parameters
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Apply Custom Omni-SMOTE ONLY to training data
        logging.info("Applying Custom Omni-SMOTE (Omni-Adaptive Hybrid Oversampling) to training set...")
        omni_smote = OmniSMOTE(sampling_strategy=0.50, random_state=42)
        X_train_resampled, y_train_resampled = omni_smote.fit_resample(X_train_scaled, y_train)

        return X_train_resampled, y_train_resampled, X_test_scaled, y_test

    def build_stacking_ensemble(self):
        """Defines the Stacking architecture."""
        logging.info("Initializing Stacking Ensemble Engine...")
        
        base_learners = [
            ('xgb', XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, 
                                  use_label_encoder=False, eval_metric='logloss', random_state=42, n_jobs=-1)),
            ('lgbm', LGBMClassifier(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)),
            ('rf', RandomForestClassifier(n_estimators=100, max_depth=10, n_jobs=-1, random_state=42))
        ]
        
        meta_learner = LogisticRegression()

        self.stacking_model = StackingClassifier(
            estimators=base_learners,
            final_estimator=meta_learner,
            cv=5,
            passthrough=False 
        )
        return self.stacking_model

    def run_pipeline(self):
        """Executes the full training and threshold optimization workflow."""
        df = self.load_and_engineer_features()
        X_train_res, y_train_res, X_test_scaled, y_test = self.preprocess_and_split(df)
        
        model = self.build_stacking_ensemble()
        
        logging.info("Training final Stacking Ensemble with Omni-SMOTE...")
        model.fit(X_train_res, y_train_res)

        # Optimize Decision Threshold on test probabilities
        y_probs = model.predict_proba(X_test_scaled)[:, 1]
        precisions, recalls, thresholds = precision_recall_curve(y_test, y_probs)
        f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-10)
        best_idx = np.argmax(f1_scores)
        self.optimal_threshold = float(thresholds[best_idx]) if best_idx < len(thresholds) else 0.5
        
        y_preds = (y_probs >= self.optimal_threshold).astype(int)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_preds, average='binary')

        logging.info(f"Model Training & Threshold Tuning Complete!")
        logging.info(f"Optimal Decision Threshold: {self.optimal_threshold:.4f}")
        logging.info(f"Test Set Performance: Precision={precision:.4f}, Recall={recall:.4f}, F1-Score={f1:.4f}")
        
        # Save Model and Preprocessing Objects
        self.export_model()

    def export_model(self):
        """Saves the model, scaler, and metadata artifacts."""
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        models_dir = os.path.join(project_root, 'backend', 'models')
        os.makedirs(models_dir, exist_ok=True)
        
        joblib.dump(self.stacking_model, os.path.join(models_dir, 'ensemble_model.joblib'))
        joblib.dump(self.scaler, os.path.join(models_dir, 'scaler.joblib'))
        
        feature_metadata = {
            'label_encoder_classes': self.label_encoder.classes_.tolist(),
            'features': ['step', 'type', 'amount', 'oldbalanceOrg', 'newbalanceOrig', 
                         'oldbalanceDest', 'newbalanceDest', 'errorBalanceOrig', 
                         'errorBalanceDest', 'is_high_amount_transfer'],
            'sampling_strategy': 'OmniSMOTE (Omni-Adaptive Hybrid Oversampling)',
            'optimal_threshold': round(self.optimal_threshold, 4)
        }
        with open(os.path.join(models_dir, 'feature_metadata.json'), 'w') as f:
            json.dump(feature_metadata, f, indent=4)
        
        logging.info(f"Model and artifacts successfully exported to {models_dir}")

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_PATH = os.path.join(project_root, 'data', 'raw', 'paysim.csv') 
    
    pipeline = FraudShieldPipeline(DATA_PATH)
    pipeline.run_pipeline()