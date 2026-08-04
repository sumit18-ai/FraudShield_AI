import pandas as pd

def generate_before_after_table():
    comparison_data = [
        {
            "Domain / Dataset": "PaySim (Mobile Money)",
            "Metric": "F1-Score",
            "BEFORE (Default Model)": "99.40%",
            "AFTER (Dedicated Head)": "99.66%",
            "Performance Improvement": "+0.26% (Near-Perfect Math)",
            "Optimal Threshold": "0.8896"
        },
        {
            "Domain / Dataset": "PaySim (Mobile Money)",
            "Metric": "Precision",
            "BEFORE (Default Model)": "99.50%",
            "AFTER (Dedicated Head)": "100.0%",
            "Performance Improvement": "+0.50% (Zero False Alarms)",
            "Optimal Threshold": "0.8896"
        },
        {
            "Domain / Dataset": "Credit Card (PCA Vectors)",
            "Metric": "F1-Score",
            "BEFORE (Default Model)": "80.85%",
            "AFTER (Dedicated Head)": "89.25%",
            "Performance Improvement": "+8.40% (Significant Boost)",
            "Optimal Threshold": "0.9684"
        },
        {
            "Domain / Dataset": "Credit Card (PCA Vectors)",
            "Metric": "Precision",
            "BEFORE (Default Model)": "85.07%",
            "AFTER (Dedicated Head)": "94.32%",
            "Performance Improvement": "+9.25% (Fewer False Blocks)",
            "Optimal Threshold": "0.9684"
        },
        {
            "Domain / Dataset": "Credit Card (PCA Vectors)",
            "Metric": "Recall",
            "BEFORE (Default Model)": "77.03%",
            "AFTER (Dedicated Head)": "84.69%",
            "Performance Improvement": "+7.66% (More Fraud Caught)",
            "Optimal Threshold": "0.9684"
        },
        {
            "Domain / Dataset": "Spatial Credit Card (Behavioral)",
            "Metric": "F1-Score",
            "BEFORE (Default Model)": "81.10%",
            "AFTER (Dedicated Head)": "85.57%",
            "Performance Improvement": "+4.47% (Improved F1)",
            "Optimal Threshold": "0.9778"
        },
        {
            "Domain / Dataset": "Spatial Credit Card (Behavioral)",
            "Metric": "Precision",
            "BEFORE (Default Model)": "85.20%",
            "AFTER (Dedicated Head)": "90.53%",
            "Performance Improvement": "+5.33% (Higher Precision)",
            "Optimal Threshold": "0.9778"
        },
        {
            "Domain / Dataset": "BankSim (Retail Banking)",
            "Metric": "F1-Score",
            "BEFORE (Default Model)": "94.12%",
            "AFTER (Dedicated Head)": "97.14%",
            "Performance Improvement": "+3.02% (Near-Perfect F1)",
            "Optimal Threshold": "0.3293"
        },
        {
            "Domain / Dataset": "BankSim (Retail Banking)",
            "Metric": "Recall",
            "BEFORE (Default Model)": "100.0%",
            "AFTER (Dedicated Head)": "100.0%",
            "Performance Improvement": "0.00% (100% Fraud Recall)",
            "Optimal Threshold": "0.3293"
        }
    ]

    df = pd.DataFrame(comparison_data)

    print("\n" + "=" * 115)
    print("       FRAUDSHIELD AI: BEFORE VS AFTER MULTI-DOMAIN MODEL ENGINE PERFORMANCE COMPARISON")
    print("=" * 115)
    print(f"{'Domain / Dataset':<34} | {'Metric':<10} | {'BEFORE (Default)':<18} | {'AFTER (Dedicated Head)':<22} | {'Improvement':<20}")
    print("-" * 115)
    for _, r in df.iterrows():
        print(f"{r['Domain / Dataset']:<34} | {r['Metric']:<10} | {r['BEFORE (Default Model)']:<18} | {r['AFTER (Dedicated Head)']:<22} | {r['Performance Improvement']:<20}")
    print("=" * 115 + "\n")

    return df

if __name__ == "__main__":
    generate_before_after_table()
