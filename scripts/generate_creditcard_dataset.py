import numpy as np
import pandas as pd
import os

np.random.seed(42)
n_samples = 500
n_fraud = 50
n_normal = n_samples - n_fraud

# Generate normal PCA features (V1..V28 around mean 0, std 1)
normal_features = np.random.normal(0, 1, size=(n_normal, 28))
normal_amount = np.random.exponential(scale=100, size=(n_normal, 1)) + 5.0
normal_time = np.sort(np.random.uniform(0, 86400, size=(n_normal, 1)))
normal_target = np.zeros((n_normal, 1))

# Generate fraud PCA features (shifted distribution for V1, V3, V14, V17)
fraud_features = np.random.normal(0, 1, size=(n_fraud, 28))
fraud_features[:, 0] -= 2.5  # V1 anomaly
fraud_features[:, 2] -= 3.0  # V3 anomaly
fraud_features[:, 13] -= 4.0 # V14 anomaly
fraud_features[:, 16] -= 3.5 # V17 anomaly
fraud_amount = np.random.exponential(scale=500, size=(n_fraud, 1)) + 50.0
fraud_time = np.sort(np.random.uniform(0, 86400, size=(n_fraud, 1)))
fraud_target = np.ones((n_fraud, 1))

normal_data = np.hstack([normal_time, normal_features, normal_amount, normal_target])
fraud_data = np.hstack([fraud_time, fraud_features, fraud_amount, fraud_target])

all_data = np.vstack([normal_data, fraud_data])
np.random.shuffle(all_data)

cols = ['Time'] + [f'V{i}' for i in range(1, 29)] + ['Amount', 'Class']
df = pd.DataFrame(all_data, columns=cols)
df['Class'] = df['Class'].astype(int)

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_path = os.path.join(project_root, 'data', 'raw', 'creditcard_sample.csv')
df.to_csv(out_path, index=False)

print(f"Successfully generated {len(df)} Credit Card records ({int(df['Class'].sum())} Fraud cases) at {out_path}")
