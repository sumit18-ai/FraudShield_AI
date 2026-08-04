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
from sklearn.metrics import precision_recall_curve
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from omni_smote import OmniSMOTE

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
    c = 2 * np.arcsin(np.sqrt(a))
    return R * c

def train_and_export_all(project_root):
    models_dir = os.path.join(project_root, 'backend', 'models')
    os.makedirs(models_dir, exist_ok=True)
    raw_dir = os.path.join(project_root, 'data', 'raw')

    # ----------------------------------------------------
    # 1. PaySim Mobile Money Model
    # ----------------------------------------------------
    paysim_path = os.path.join(raw_dir, 'paysim.csv')
    if os.path.exists(paysim_path):
        logging.info("Training PaySim Mobile Money Domain Model...")
        df_ps = pd.read_csv(paysim_path)
        
        # Feature Engineering
        df_ps['errorBalanceOrig'] = df_ps['oldbalanceOrg'] - df_ps['amount'] - df_ps['newbalanceOrig']
        df_ps['errorBalanceDest'] = df_ps['oldbalanceDest'] + df_ps['amount'] - df_ps['newbalanceDest']
        df_ps['is_high_amount_transfer'] = (df_ps['amount'] > 200000).astype(int)
        
        le_ps = LabelEncoder()
        df_ps['type'] = le_ps.fit_transform(df_ps['type'])
        
        cols_drop = ['nameOrig', 'nameDest', 'isFlaggedFraud']
        df_ps = df_ps.drop(columns=[c for c in cols_drop if c in df_ps.columns])
        
        X_ps = df_ps.drop('isFraud', axis=1)
        y_ps = df_ps['isFraud']
        
        X_tr_ps, X_te_ps, y_tr_ps, y_te_ps = train_test_split(X_ps, y_ps, test_size=0.2, random_state=42, stratify=y_ps)
        scaler_ps = RobustScaler()
        X_tr_ps_s = scaler_ps.fit_transform(X_tr_ps)
        X_te_ps_s = scaler_ps.transform(X_te_ps)
        
        omni_ps = OmniSMOTE(sampling_strategy=0.50, random_state=42)
        X_tr_ps_res, y_tr_ps_res = omni_ps.fit_resample(X_tr_ps_s, y_tr_ps)
        
        model_ps = StackingClassifier(
            estimators=[
                ('xgb', XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, n_jobs=-1)),
                ('lgbm', LGBMClassifier(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)),
                ('rf', RandomForestClassifier(n_estimators=100, max_depth=10, n_jobs=-1, random_state=42))
            ],
            final_estimator=LogisticRegression(),
            cv=3
        )
        model_ps.fit(X_tr_ps_res, y_tr_ps_res)
        
        y_probs_ps = model_ps.predict_proba(X_te_ps_s)[:, 1]
        p_ps, r_ps, t_ps = precision_recall_curve(y_te_ps, y_probs_ps)
        f1_ps = 2 * (p_ps * r_ps) / (p_ps + r_ps + 1e-10)
        opt_t_ps = float(t_ps[np.argmax(f1_ps)]) if len(t_ps) > 0 else 0.50
        
        joblib.dump(model_ps, os.path.join(models_dir, 'ensemble_model.joblib'))
        joblib.dump(scaler_ps, os.path.join(models_dir, 'scaler.joblib'))
        
        ps_meta = {
            'features': list(X_ps.columns),
            'label_encoder_classes': le_ps.classes_.tolist(),
            'optimal_threshold': round(opt_t_ps, 4)
        }
        with open(os.path.join(models_dir, 'feature_metadata.json'), 'w') as f:
            json.dump(ps_meta, f, indent=4)
            
        logging.info(f"PaySim Model Exported! Optimal Threshold: {opt_t_ps:.4f}")

    # ----------------------------------------------------
    # 2. Credit Card PCA Model
    # ----------------------------------------------------
    cc_path = os.path.join(raw_dir, 'creditcard.csv')
    if os.path.exists(cc_path):
        logging.info("Training Credit Card PCA Domain Model...")
        df_cc = pd.read_csv(cc_path)
        X_cc = df_cc.drop(columns=['Class'])
        y_cc = df_cc['Class']
        
        X_tr_cc, X_te_cc, y_tr_cc, y_te_cc = train_test_split(X_cc, y_cc, test_size=0.2, random_state=42, stratify=y_cc)
        scaler_cc = RobustScaler()
        X_tr_cc_s = scaler_cc.fit_transform(X_tr_cc)
        X_te_cc_s = scaler_cc.transform(X_te_cc)
        
        omni_cc = OmniSMOTE(sampling_strategy=0.30, random_state=42)
        X_tr_cc_res, y_tr_cc_res = omni_cc.fit_resample(X_tr_cc_s, y_tr_cc)
        
        model_cc = StackingClassifier(
            estimators=[
                ('xgb', XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.05, scale_pos_weight=3.0, random_state=42, n_jobs=-1)),
                ('lgbm', LGBMClassifier(n_estimators=100, learning_rate=0.05, class_weight='balanced', random_state=42, n_jobs=-1, verbose=-1)),
                ('rf', RandomForestClassifier(n_estimators=100, max_depth=10, class_weight='balanced', n_jobs=-1, random_state=42))
            ],
            final_estimator=LogisticRegression(),
            cv=3
        )
        model_cc.fit(X_tr_cc_res, y_tr_cc_res)
        
        y_probs_cc = model_cc.predict_proba(X_te_cc_s)[:, 1]
        p_cc, r_cc, t_cc = precision_recall_curve(y_te_cc, y_probs_cc)
        f1_cc = 2 * (p_cc * r_cc) / (p_cc + r_cc + 1e-10)
        opt_t_cc = float(t_cc[np.argmax(f1_cc)]) if len(t_cc) > 0 else 0.50
        
        joblib.dump(model_cc, os.path.join(models_dir, 'creditcard_model.joblib'))
        joblib.dump(scaler_cc, os.path.join(models_dir, 'creditcard_scaler.joblib'))
        
        cc_meta = {
            'features': list(X_cc.columns),
            'optimal_threshold': round(opt_t_cc, 4)
        }
        with open(os.path.join(models_dir, 'creditcard_metadata.json'), 'w') as f:
            json.dump(cc_meta, f, indent=4)
            
        logging.info(f"Credit Card PCA Model Exported! Optimal Threshold: {opt_t_cc:.4f}")

    # ----------------------------------------------------
    # 3. Spatial Credit Card Model
    # ----------------------------------------------------
    ftrain_path = os.path.join(raw_dir, 'fraudTrain.csv')
    ftest_path = os.path.join(raw_dir, 'fraudTest.csv')
    if os.path.exists(ftrain_path) and os.path.exists(ftest_path):
        logging.info("Training Spatial Credit Card Domain Model...")
        df_sp_tr = pd.read_csv(ftrain_path)
        df_sp_te = pd.read_csv(ftest_path)
        
        # Sample 200k train records for memory efficiency
        df_sp_tr_fraud = df_sp_tr[df_sp_tr['is_fraud'] == 1]
        df_sp_tr_norm = df_sp_tr[df_sp_tr['is_fraud'] == 0].sample(n=200000 - len(df_sp_tr_fraud), random_state=42)
        df_sp_tr = pd.concat([df_sp_tr_fraud, df_sp_tr_norm]).sample(frac=1.0, random_state=42).reset_index(drop=True)
        
        for df in [df_sp_tr, df_sp_te]:
            df['distance_km'] = haversine_distance(df['lat'], df['long'], df['merch_lat'], df['merch_long'])
            df['hour'] = pd.to_datetime(df['trans_date_trans_time']).dt.hour
            df['day_of_week'] = pd.to_datetime(df['trans_date_trans_time']).dt.dayofweek
            
        le_sp_cat = LabelEncoder()
        le_sp_gen = LabelEncoder()
        
        df_sp_tr['category'] = le_sp_cat.fit_transform(df_sp_tr['category'])
        df_sp_te['category'] = le_sp_cat.transform(df_sp_te['category'])
        
        df_sp_tr['gender'] = le_sp_gen.fit_transform(df_sp_tr['gender'])
        df_sp_te['gender'] = le_sp_gen.transform(df_sp_te['gender'])
        
        sp_features = ['amt', 'distance_km', 'city_pop', 'category', 'gender', 'hour', 'day_of_week']
        X_sp_tr = df_sp_tr[sp_features]
        y_sp_tr = df_sp_tr['is_fraud']
        
        X_sp_te = df_sp_te[sp_features]
        y_sp_te = df_sp_te['is_fraud']
        
        scaler_sp = RobustScaler()
        X_sp_tr_s = scaler_sp.fit_transform(X_sp_tr)
        X_sp_te_s = scaler_sp.transform(X_sp_te)
        
        omni_sp = OmniSMOTE(sampling_strategy=0.30, random_state=42)
        X_sp_tr_res, y_sp_tr_res = omni_sp.fit_resample(X_sp_tr_s, y_sp_tr)
        
        model_sp = StackingClassifier(
            estimators=[
                ('xgb', XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, n_jobs=-1)),
                ('lgbm', LGBMClassifier(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)),
                ('rf', RandomForestClassifier(n_estimators=100, max_depth=8, n_jobs=-1, random_state=42))
            ],
            final_estimator=LogisticRegression(),
            cv=3
        )
        model_sp.fit(X_sp_tr_res, y_sp_tr_res)
        
        y_probs_sp = model_sp.predict_proba(X_sp_te_s)[:, 1]
        p_sp, r_sp, t_sp = precision_recall_curve(y_sp_te, y_probs_sp)
        f1_sp = 2 * (p_sp * r_sp) / (p_sp + r_sp + 1e-10)
        opt_t_sp = float(t_sp[np.argmax(f1_sp)]) if len(t_sp) > 0 else 0.50
        
        joblib.dump(model_sp, os.path.join(models_dir, 'spatial_model.joblib'))
        joblib.dump(scaler_sp, os.path.join(models_dir, 'spatial_scaler.joblib'))
        
        sp_meta = {
            'features': sp_features,
            'category_classes': le_sp_cat.classes_.tolist(),
            'gender_classes': le_sp_gen.classes_.tolist(),
            'optimal_threshold': round(opt_t_sp, 4)
        }
        with open(os.path.join(models_dir, 'spatial_metadata.json'), 'w') as f:
            json.dump(sp_meta, f, indent=4)
            
        logging.info(f"Spatial Credit Card Model Exported! Optimal Threshold: {opt_t_sp:.4f}")

    # ----------------------------------------------------
    # 4. BankSim Retail Model
    # ----------------------------------------------------
    banksim_path = os.path.join(raw_dir, 'banksim_sample.csv')
    if os.path.exists(banksim_path):
        logging.info("Training BankSim Retail Domain Model...")
        df_bs = pd.read_csv(banksim_path)
        for col in df_bs.select_dtypes(include=['object']).columns:
            df_bs[col] = df_bs[col].astype(str).str.replace("'", "").str.strip()
            
        le_bs_age = LabelEncoder()
        le_bs_gen = LabelEncoder()
        le_bs_cat = LabelEncoder()
        
        df_bs['age'] = le_bs_age.fit_transform(df_bs['age'])
        df_bs['gender'] = le_bs_gen.fit_transform(df_bs['gender'])
        df_bs['category'] = le_bs_cat.fit_transform(df_bs['category'])
        
        cols_drop_bs = ['customer', 'merchant', 'zipcodeOri', 'zipMerchant']
        df_bs = df_bs.drop(columns=[c for c in cols_drop_bs if c in df_bs.columns])
        
        X_bs = df_bs.drop(columns=['fraud'])
        y_bs = df_bs['fraud']
        
        X_tr_bs, X_te_bs, y_tr_bs, y_te_bs = train_test_split(X_bs, y_bs, test_size=0.2, random_state=42, stratify=y_bs)
        scaler_bs = RobustScaler()
        X_tr_bs_s = scaler_bs.fit_transform(X_tr_bs)
        X_te_bs_s = scaler_bs.transform(X_te_bs)
        
        omni_bs = OmniSMOTE(sampling_strategy=0.50, random_state=42)
        X_tr_bs_res, y_tr_bs_res = omni_bs.fit_resample(X_tr_bs_s, y_tr_bs)
        
        model_bs = StackingClassifier(
            estimators=[
                ('xgb', XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, n_jobs=-1)),
                ('lgbm', LGBMClassifier(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1, verbose=-1)),
                ('rf', RandomForestClassifier(n_estimators=100, max_depth=8, n_jobs=-1, random_state=42))
            ],
            final_estimator=LogisticRegression(),
            cv=3
        )
        model_bs.fit(X_tr_bs_res, y_tr_bs_res)
        
        y_probs_bs = model_bs.predict_proba(X_te_bs_s)[:, 1]
        p_bs, r_bs, t_bs = precision_recall_curve(y_te_bs, y_probs_bs)
        f1_bs = 2 * (p_bs * r_bs) / (p_bs + r_bs + 1e-10)
        opt_t_bs = float(t_bs[np.argmax(f1_bs)]) if len(t_bs) > 0 else 0.50
        
        joblib.dump(model_bs, os.path.join(models_dir, 'banksim_model.joblib'))
        joblib.dump(scaler_bs, os.path.join(models_dir, 'banksim_scaler.joblib'))
        
        bs_meta = {
            'features': list(X_bs.columns),
            'age_classes': le_bs_age.classes_.tolist(),
            'gender_classes': le_bs_gen.classes_.tolist(),
            'category_classes': le_bs_cat.classes_.tolist(),
            'optimal_threshold': round(opt_t_bs, 4)
        }
        with open(os.path.join(models_dir, 'banksim_metadata.json'), 'w') as f:
            json.dump(bs_meta, f, indent=4)
            
        logging.info(f"BankSim Retail Model Exported! Optimal Threshold: {opt_t_bs:.4f}")

    logging.info("ALL MULTI-DOMAIN MODEL ARTIFACTS EXPORTED SUCCESSFULLY TO backend/models/")

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    train_and_export_all(project_root)
