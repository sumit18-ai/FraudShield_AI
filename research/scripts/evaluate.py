import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix, classification_report, 
    precision_recall_curve, average_precision_score, ConfusionMatrixDisplay
)

class FraudShieldEvaluator:
    def __init__(self, models_dir, test_data_path):
        import os, json
        # Load the saved model and preprocessing tools
        logging_info = "Loading models and test data..."
        print(logging_info)
        
        self.model = joblib.load(os.path.join(models_dir, 'ensemble_model.joblib'))
        self.scaler = joblib.load(os.path.join(models_dir, 'scaler.joblib'))
        
        with open(os.path.join(models_dir, 'feature_metadata.json'), 'r') as f:
            metadata = json.load(f)
            self.classes_ = metadata['label_encoder_classes']
        
        # Load and process the data (using same logic as training)
        self.df = pd.read_csv(test_data_path)
        self.X, self.y = self._prepare_data(self.df)

    def _prepare_data(self, df):
        """Replicates the feature engineering from the training script."""
        df = df.copy()
        # Feature Engineering
        df['errorBalanceOrig'] = df['oldbalanceOrg'] - df['amount'] - df['newbalanceOrig']
        df['errorBalanceDest'] = df['oldbalanceDest'] + df['amount'] - df['newbalanceDest']
        df['is_high_amount_transfer'] = (df['amount'] > 200000).astype(int)
        
        # Encoding and Dropping
        try:
            df['type'] = df['type'].apply(lambda x: self.classes_.index(x) if x in self.classes_ else 0)
        except Exception:
            df['type'] = 0
            
        cols_to_drop = ['nameOrig', 'nameDest', 'isFlaggedFraud', 'isFraud']
        
        X = df.drop(columns=[c for c in cols_to_drop if c in df.columns])
        y = df['isFraud']
        
        # Scaling
        X_scaled = self.scaler.transform(X)
        return X_scaled, y

    def plot_confusion_matrix(self):
        """Generates a Confusion Matrix focused on False Negatives."""
        y_pred = self.model.predict(self.X)
        cm = confusion_matrix(self.y, y_pred)
        
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                    xticklabels=['Normal', 'Fraud'], 
                    yticklabels=['Normal', 'Fraud'])
        plt.title('Confusion Matrix: FraudShield AI')
        plt.xlabel('Predicted Label')
        plt.ylabel('True Label')
        
        # Highlight False Negatives
        fn = cm[1, 0]
        plt.annotate(f'Missed Fraud\n(False Negatives): {fn}', 
                     xy=(0.5, 1.5), xytext=(0.1, 1.8),
                     arrowprops=dict(facecolor='red', shrink=0.05))
        plt.show()

    def plot_precision_recall_curve(self):
        """Generates the PR Curve (Crucial for imbalanced data)."""
        y_probs = self.model.predict_proba(self.X)[:, 1]
        precision, recall, _ = precision_recall_curve(self.y, y_probs)
        avg_precision = average_precision_score(self.y, y_probs)

        plt.figure(figsize=(8, 6))
        plt.plot(recall, precision, color='darkorange', lw=2, 
                 label=f'PR Curve (AP = {avg_precision:.4f})')
        plt.fill_between(recall, precision, alpha=0.2, color='darkorange')
        plt.xlabel('Recall (Detection Rate)')
        plt.ylabel('Precision (Accuracy of Alarms)')
        plt.title('Precision-Recall Curve: FraudShield AI')
        plt.legend(loc="lower left")
        plt.grid(alpha=0.3)
        plt.show()

    def plot_feature_importance(self, feature_names):
        """
        Extracts feature importance from the XGBoost base learner 
        within the Stacking ensemble.
        """
        # We pull the XGBoost model from the stacking ensemble's named estimators
        xgb_model = self.model.named_estimators_['xgb']
        importances = xgb_model.feature_importances_
        
        # Sort indices
        indices = np.argsort(importances)[::-1]

        plt.figure(figsize=(10, 8))
        sns.barplot(x=importances[indices], y=np.array(feature_names)[indices], palette='viridis')
        plt.title('Feature Importance (XGBoost Base Learner)')
        plt.xlabel('Importance Score')
        plt.ylabel('Features')
        plt.tight_layout()
        plt.show()

if __name__ == "__main__":
    import os
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # 1. Path to your saved model directory
    MODELS_DIR = os.path.join(project_root, 'backend', 'models')
    
    # 2. Path to your data (you can use a separate test CSV or the same for demo)
    TEST_DATA_PATH = os.path.join(project_root, 'data', 'raw', 'paysim.csv') 
    
    # 3. Define the column names as they appear after engineering
    # Note: These must match the order of columns in X
    feature_columns = ['step', 'type', 'amount', 'oldbalanceOrg', 'newbalanceOrig', 
                       'oldbalanceDest', 'newbalanceDest', 'errorBalanceOrig', 
                       'errorBalanceDest', 'is_high_amount_transfer']

    evaluator = FraudShieldEvaluator(MODELS_DIR, TEST_DATA_PATH)
    
    print("\n--- Generating Precision-Recall Curve ---")
    evaluator.plot_precision_recall_curve()
    
    print("\n--- Generating Confusion Matrix ---")
    evaluator.plot_confusion_matrix()
    
    print("\n--- Generating Feature Importance Plot ---")
    evaluator.plot_feature_importance(feature_columns)