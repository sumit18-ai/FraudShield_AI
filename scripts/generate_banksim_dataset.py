import numpy as np
import pandas as pd
import os

np.random.seed(42)
n_samples = 1000

categories = [
  'es_transportation', 'es_food', 'es_health', 'es_wellnessandbeauty', 
  'es_fashion', 'es_barsandrestaurants', 'es_hyper', 'es_sportsandtoys', 
  'es_tech', 'es_hotelservices'
]

# Fraud rate per category (high risk in tech, hotel, sports)
category_fraud_prob = {
  'es_transportation': 0.00,
  'es_food': 0.01,
  'es_health': 0.08,
  'es_wellnessandbeauty': 0.05,
  'es_fashion': 0.04,
  'es_barsandrestaurants': 0.02,
  'es_hyper': 0.03,
  'es_sportsandtoys': 0.12,
  'es_tech': 0.25,
  'es_hotelservices': 0.18
}

rows = []
for i in range(n_samples):
    step = np.random.randint(0, 180)
    customer = f"C{np.random.randint(1000000, 9999999)}"
    age = str(np.random.choice([0, 1, 2, 3, 4, 5, 6, 'U'], p=[0.05, 0.25, 0.35, 0.20, 0.10, 0.03, 0.01, 0.01]))
    gender = str(np.random.choice(['M', 'F', 'E'], p=[0.48, 0.50, 0.02]))
    zipcodeOri = "'28007'"
    merchant = f"M{np.random.randint(100000000, 999999999)}"
    zipMerchant = "'28007'"
    
    cat = np.random.choice(categories)
    prob_fraud = category_fraud_prob[cat]
    
    is_fraud = 1 if np.random.random() < prob_fraud else 0
    
    if is_fraud == 1:
        amount = round(np.random.uniform(150.0, 1200.0), 2)
    else:
        amount = round(np.random.exponential(scale=35.0) + 2.0, 2)

    rows.append({
        'step': step,
        'customer': f"'{customer}'",
        'age': f"'{age}'",
        'gender': f"'{gender}'",
        'zipcodeOri': zipcodeOri,
        'merchant': f"'{merchant}'",
        'zipMerchant': zipMerchant,
        'category': f"'{cat}'",
        'amount': amount,
        'fraud': is_fraud
    })

df = pd.DataFrame(rows)

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_path = os.path.join(project_root, 'data', 'raw', 'banksim_sample.csv')
df.to_csv(out_path, index=False)

print(f"Successfully generated {len(df)} BankSim records ({df['fraud'].sum()} Fraud cases) at {out_path}")
