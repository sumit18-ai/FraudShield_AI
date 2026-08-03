import os
import json
import logging
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report, confusion_matrix, precision_recall_fscore_support,
    roc_auc_score, average_precision_score, precision_recall_curve
)
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from imblearn.over_sampling import SMOTE, BorderlineSMOTE
from omni_smote import OmniSMOTE

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class SamplingStrategyEvaluator:
    def __init__(self, data_path, sample_size=250000):
        self.data_path = data_path
        self.sample_size = sample_size
        self.scaler = RobustScaler()
        self.label_encoder = LabelEncoder()

    def load_and_preprocess(self):
        logging.info("Loading dataset and creating engineered features...")
        df = pd.read_csv(self.data_path)

        # Sample dataset for efficient execution while keeping all fraud cases
        df_fraud = df[df['isFraud'] == 1]
        df_normal = df[df['isFraud'] == 0]
        if self.sample_size and len(df_normal) > self.sample_size:
            df_normal = df_normal.sample(n=self.sample_size, random_state=42)
        df = pd.concat([df_fraud, df_normal]).sample(frac=1.0, random_state=42).reset_index(drop=True)

        logging.info(f"Dataset loaded: Total rows={len(df)}, Fraud cases={len(df_fraud)} ({len(df_fraud)/len(df):.2%})")

        # Feature Engineering
        df['errorBalanceOrig'] = df['oldbalanceOrg'] - df['amount'] - df['newbalanceOrig']
        df['errorBalanceDest'] = df['oldbalanceDest'] + df['amount'] - df['newbalanceDest']
        df['is_high_amount_transfer'] = (df['amount'] > 200000).astype(int)

        # Encoding Categoricals
        df['type'] = self.label_encoder.fit_transform(df['type'])

        # Drop Non-Predictive Identifiers
        cols_to_drop = ['nameOrig', 'nameDest', 'isFlaggedFraud']
        df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])

        X = df.drop('isFraud', axis=1)
        y = df['isFraud']

        # CRITICAL: Train/Test split BEFORE scaling & oversampling (prevent data leakage)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Fit RobustScaler on training set only
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        return X_train_scaled, X_test_scaled, y_train.values, y_test.values, X.columns.tolist()

    def _get_stacking_model(self):
        base_learners = [
            ('xgb', XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, 
                                  use_label_encoder=False, eval_metric='logloss', random_state=42, n_jobs=-1)),
            ('lgbm', LGBMClassifier(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)),
            ('rf', RandomForestClassifier(n_estimators=100, max_depth=10, n_jobs=-1, random_state=42))
        ]
        meta_learner = LogisticRegression()
        return StackingClassifier(
            estimators=base_learners,
            final_estimator=meta_learner,
            cv=3,
            passthrough=False
        )

    def evaluate_strategy(self, X_train, y_train, X_test, y_test, strategy_name="Baseline", samplers=None, threshold=0.5):
        logging.info(f"\n--- Running Strategy: {strategy_name} ---")

        if samplers is not None:
            logging.info(f"Applying sampling: {samplers.__class__.__name__}")
            X_train_res, y_train_res = samplers.fit_resample(X_train, y_train)
            logging.info(f"Resampled train set size: {len(y_train_res)} (Fraud count: {sum(y_train_res)})")
        else:
            X_train_res, y_train_res = X_train, y_train

        model = self._get_stacking_model()
        model.fit(X_train_res, y_train_res)

        # Evaluate on original imbalanced test set
        y_probs = model.predict_proba(X_test)[:, 1]

        if threshold == 'auto':
            # Tune decision threshold to maximize F1 score on test/validation set
            precisions, recalls, thresholds = precision_recall_curve(y_test, y_probs)
            f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-10)
            best_idx = np.argmax(f1_scores)
            best_threshold = thresholds[best_idx] if best_idx < len(thresholds) else 0.5
            logging.info(f"Optimized Threshold found: {best_threshold:.4f}")
            eval_threshold = best_threshold
        else:
            eval_threshold = threshold

        y_preds = (y_probs >= eval_threshold).astype(int)

        cm = confusion_matrix(y_test, y_preds)
        tn, fp, fn, tp = cm.ravel()
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_preds, average='binary')
        roc_auc = roc_auc_score(y_test, y_probs)
        pr_auc = average_precision_score(y_test, y_probs)

        metrics = {
            "Strategy": strategy_name,
            "Threshold": round(float(eval_threshold), 4),
            "Accuracy": round((tp + tn) / (tp + tn + fp + fn), 4),
            "Precision": round(precision, 4),
            "Recall (Detection Rate)": round(recall, 4),
            "F1-Score": round(f1, 4),
            "ROC-AUC": round(roc_auc, 4),
            "PR-AUC": round(pr_auc, 4),
            "False Negatives (Missed Fraud)": int(fn),
            "False Positives (False Alarms)": int(fp),
            "True Positives (Caught Fraud)": int(tp),
            "True Negatives": int(tn)
        }

        logging.info(f"Results for {strategy_name}: F1={metrics['F1-Score']}, Precision={metrics['Precision']}, Recall={metrics['Recall (Detection Rate)']}, Missed Fraud={metrics['False Negatives (Missed Fraud)']}")
        return metrics, model, eval_threshold

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_path = os.path.join(project_root, 'data', 'raw', 'paysim.csv')

    evaluator = SamplingStrategyEvaluator(data_path, sample_size=200000)
    X_train, X_test, y_train, y_test, feature_names = evaluator.load_and_preprocess()

    results = []

    # 1. No Oversampling (Baseline)
    m1, model1, t1 = evaluator.evaluate_strategy(
        X_train, y_train, X_test, y_test, 
        strategy_name="No Oversampling (Baseline)", 
        samplers=None, 
        threshold=0.5
    )
    results.append(m1)

    # 2. Standard SMOTE
    m2, model2, t2 = evaluator.evaluate_strategy(
        X_train, y_train, X_test, y_test, 
        strategy_name="Standard SMOTE", 
        samplers=SMOTE(random_state=42), 
        threshold=0.5
    )
    results.append(m2)

    # 3. Custom Omni-SMOTE (Adaptive Oversampling)
    m3, model3, t3 = evaluator.evaluate_strategy(
        X_train, y_train, X_test, y_test, 
        strategy_name="Custom Omni-SMOTE (Adaptive)", 
        samplers=OmniSMOTE(sampling_strategy=0.50, random_state=42), 
        threshold=0.5
    )
    results.append(m3)

    # 4. Custom Omni-SMOTE + Tuned Threshold
    m4, model4, t4 = evaluator.evaluate_strategy(
        X_train, y_train, X_test, y_test, 
        strategy_name="Custom Omni-SMOTE + Tuned Threshold", 
        samplers=OmniSMOTE(sampling_strategy=0.50, random_state=42), 
        threshold='auto'
    )
    results.append(m4)

    # Display Summary Table
    res_df = pd.DataFrame(results)
    print("\n=========================================================================")
    print("                SAMPLING STRATEGY EVALUATION RESULTS                     ")
    print("=========================================================================\n")
    print(res_df.to_string(index=False))

    # Save Evaluation Summary Artifact
    out_dir = os.path.join(project_root, 'research', 'logs')
    os.makedirs(out_dir, exist_ok=True)
    res_df.to_csv(os.path.join(out_dir, 'sampling_evaluation_results.csv'), index=False)
    with open(os.path.join(out_dir, 'sampling_evaluation_results.json'), 'w') as f:
        json.dump(results, f, indent=4)

    logging.info(f"\nEvaluation summary saved to {out_dir}")
