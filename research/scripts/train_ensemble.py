import pandas as pd
import numpy as np
import logging
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from imblearn.over_sampling import SMOTE

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class FraudShieldPipeline:
    def __init__(self, data_path):
        self.data_path = data_path
        self.scaler = RobustScaler()
        self.label_encoder = LabelEncoder()
        self.stacking_model = None

    def load_and_engineer_features(self):
        """Loads data and creates PaySim-specific features."""
        logging.info("Loading dataset and performing feature engineering...")
        df = pd.read_csv(self.data_path)

        # Downsample majority class to speed up training
        df_fraud = df[df['isFraud'] == 1]
        df_normal = df[df['isFraud'] == 0].sample(n=200000, random_state=42) # Take 200k normal rows
        df = pd.concat([df_fraud, df_normal])

        # 1. Feature Engineering: Balance Errors
        # Fraud often involves emptying an account; these errors capture discrepancies
        df['errorBalanceOrig'] = df['oldbalanceOrg'] - df['amount'] - df['newbalanceOrig']
        df['errorBalanceDest'] = df['oldbalanceDest'] + df['amount'] - df['newbalanceDest']

        # 2. Boolean for High Amount Transfer
        # PaySim fraud often targets amounts > 200,000 (common threshold in research)
        df['is_high_amount_transfer'] = (df['amount'] > 200000).astype(int)

        # 3. Categorical Encoding
        df['type'] = self.label_encoder.fit_transform(df['type'])

        # 4. Drop Identifiers (Non-predictive)
        cols_to_drop = ['nameOrig', 'nameDest', 'isFlaggedFraud']
        df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])
        
        return df

    def preprocess_and_resample(self, df):
        """Scales data and handles class imbalance using SMOTE."""
        logging.info("Preprocessing data and applying SMOTE...")
        
        X = df.drop('isFraud', axis=1)
        y = df['isFraud']

        # RobustScaler handles the high variance/outliers in transaction amounts
        X_scaled = self.scaler.fit_transform(X)

        # Handle Imbalance: SMOTE creates synthetic fraud cases to balance the classes
        smote = SMOTE(sampling_strategy='auto', random_state=42)
        X_resampled, y_resampled = smote.fit_resample(X_scaled, y)
        
        return train_test_split(X_resampled, y_resampled, test_size=0.2, random_state=42)

    def build_stacking_ensemble(self):
        """Defines the Stacking architecture."""
        logging.info("Initializing Stacking Ensemble Engine...")
        
        # Base Learners
        base_learners = [
            ('xgb', XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, 
                                  use_label_encoder=False, eval_metric='logloss', random_state=42)),
            ('lgbm', LGBMClassifier(n_estimators=100, learning_rate=0.1, random_state=42)),
            ('rf', RandomForestClassifier(n_estimators=100, max_depth=10, n_jobs=-1, random_state=42))
        ]
        
        # Meta-Learner
        meta_learner = LogisticRegression()

        # Stacking Classifier
        self.stacking_model = StackingClassifier(
            estimators=base_learners,
            final_estimator=meta_learner,
            cv=5, # 5-fold cross-validation for base-learner predictions
            passthrough=False 
        )
        return self.stacking_model

    def run_pipeline(self):
        """Executes the full training workflow."""
        df = self.load_and_engineer_features()
        X_train, X_test, y_train, y_test = self.preprocess_and_resample(df)
        
        model = self.build_stacking_ensemble()
        
        logging.info("Training final Stacking model (this may take a few minutes)...")
        model.fit(X_train, y_train)
        
        accuracy = model.score(X_test, y_test)
        logging.info(f"Model Training Complete. Test Accuracy: {accuracy:.4f}")
        
        # Save Model and Preprocessing Objects
        self.export_model()

    def export_model(self):
        """Saves the pipeline components separately."""
        import os
        import json
        models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'backend', 'models')
        os.makedirs(models_dir, exist_ok=True)
        
        joblib.dump(self.stacking_model, os.path.join(models_dir, 'ensemble_model.joblib'))
        joblib.dump(self.scaler, os.path.join(models_dir, 'scaler.joblib'))
        
        feature_metadata = {
            'label_encoder_classes': self.label_encoder.classes_.tolist(),
            'features': ['step', 'type', 'amount', 'oldbalanceOrg', 'newbalanceOrig', 
                         'oldbalanceDest', 'newbalanceDest', 'errorBalanceOrig', 
                         'errorBalanceDest', 'is_high_amount_transfer']
        }
        with open(os.path.join(models_dir, 'feature_metadata.json'), 'w') as f:
            json.dump(feature_metadata, f, indent=4)
        
        logging.info(f"Model and artifacts successfully exported to {models_dir}")

if __name__ == "__main__":
    import os
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA_PATH = os.path.join(project_root, 'data', 'raw', 'paysim.csv') 
    
    pipeline = FraudShieldPipeline(DATA_PATH)
    pipeline.run_pipeline()