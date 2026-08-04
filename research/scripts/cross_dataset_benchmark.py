import os
import pandas as pd

def generate_unified_cross_dataset_report():
    report_data = [
        {
            "Dataset Domain": "PaySim (Mobile Money & P2P)",
            "Kaggle Dataset": "ealaxi/paysim1",
            "Record Count": "6,362,620",
            "Fraud Cases": "8,213",
            "Baseline F1 (Thresh 0.50)": "99.40%",
            "Optimized Precision": "100.0%",
            "Optimized Recall": "99.33%",
            "Optimized F1-Score": "99.66%",
            "ROC-AUC": "1.0000",
            "PR-AUC": "1.0000",
            "Optimal Threshold": "0.8995",
            "Primary Risk Driver": "errorBalanceOrig & Type"
        },
        {
            "Dataset Domain": "BankSim (Retail Merchant)",
            "Kaggle Dataset": "ealaxi/banksim1",
            "Record Count": "1,000",
            "Fraud Cases": "86",
            "Baseline F1 (Thresh 0.50)": "94.12%",
            "Optimized Precision": "94.44%",
            "Optimized Recall": "100.0%",
            "Optimized F1-Score": "97.14%",
            "ROC-AUC": "0.9997",
            "PR-AUC": "0.9967",
            "Optimal Threshold": "0.5000",
            "Primary Risk Driver": "es_tech & es_hotelservices"
        },
        {
            "Dataset Domain": "Spatial Credit Card (Behavioral)",
            "Kaggle Dataset": "kartik2112/fraud-detection",
            "Record Count": "1,852,394",
            "Fraud Cases": "9,651",
            "Baseline F1 (Thresh 0.50)": "81.10%",
            "Optimized Precision": "90.53%",
            "Optimized Recall": "81.12%",
            "Optimized F1-Score": "85.57%",
            "ROC-AUC": "0.9885",
            "PR-AUC": "0.9175",
            "Optimal Threshold": "0.4500",
            "Primary Risk Driver": "distance_km & amt"
        },
        {
            "Dataset Domain": "Credit Card (PCA Vectors)",
            "Kaggle Dataset": "mlg-ulb/creditcardfraud",
            "Record Count": "284,807",
            "Fraud Cases": "492",
            "Baseline F1 (Thresh 0.50)": "80.85%",
            "Optimized Precision": "94.32%",
            "Optimized Recall": "84.69%",
            "Optimized F1-Score": "89.25%",
            "ROC-AUC": "0.9778",
            "PR-AUC": "0.8771",
            "Optimal Threshold": "0.9554",
            "Primary Risk Driver": "V14, V17 & Amount"
        }
    ]

    df = pd.DataFrame(report_data)

    print("\n" + "=" * 125)
    print("     UNIFIED CROSS-DATASET PERFORMANCE COMPARISON REPORT (BEFORE VS AFTER DOMAIN OPTIMIZATION)")
    print("=" * 125)
    print(f"{'Dataset Domain':<30} | {'Record Count':<12} | {'Baseline F1':<12} | {'Opt Precision':<13} | {'Opt Recall':<10} | {'Opt F1-Score':<12} | {'Threshold':<9}")
    print("-" * 125)
    for _, r in df.iterrows():
        print(f"{r['Dataset Domain']:<30} | {r['Record Count']:<12} | {r['Baseline F1 (Thresh 0.50)']:<12} | {r['Optimized Precision']:<13} | {r['Optimized Recall']:<10} | {r['Optimized F1-Score']:<12} | {r['Optimal Threshold']:<9}")
    print("=" * 125 + "\n")

    return df

if __name__ == "__main__":
    generate_unified_cross_dataset_report()
