# FraudShield AI: Multi-Domain Financial Fraud Detection via Stacking Ensembles, Calibrated Risk Scoring, and TreeSHAP Explainability

**Author**: FraudShield AI Engineering & Research Team  
**Date**: August 2026  
**Repository**: [github.com/sumit18-ai/FraudShield_AI](https://github.com/sumit18-ai/FraudShield_AI)

---

## Abstract

Financial fraud detection presents significant challenges to machine learning systems due to extreme class imbalance (often exceeding 1:500), severe domain shifts across payment ecosystems (e.g., mobile money vs. credit card PCA vectors vs. spatial geolocation), and the strict requirement for model explainability in regulatory environments. In this paper, we present **FraudShield AI**, a multi-domain fraud detection architecture powered by a Stacking Ensemble classifier (XGBoost, LightGBM, Random Forest) with domain-specific model heads, class-weighted optimization, and continuous risk calibration. Evaluated across four benchmark financial datasets—PaySim Mobile Money, European Credit Card PCA, Spatial Behavioral Credit Card, and BankSim Retail Banking—FraudShield AI achieves near-perfect F1-scores on mobile money transactions (**99.66% F1, 100% Precision**) and achieves an **8.40% boost in F1-Score** (to **89.25% F1, 94.32% Precision**) on extreme imbalanced PCA vector data. Furthermore, we integrate TreeSHAP for feature attribution and implement a continuous 3-tier risk classification system (`SAFE < 45%`, `NEEDS REVIEW 45%–75%`, `FRAUD ≥ 75%`) deployed via FastAPI and React.

---

## 1. Introduction

Financial fraud causes tens of billions of dollars in annual losses globally across electronic payment networks, peer-to-peer (P2P) transfers, credit cards, and retail banking networks. Machine learning has emerged as the primary defense against sophisticated fraudulent activities. However, existing commercial systems face four critical shortcomings:

1. **Extreme Class Imbalance**: Legitimate transactions outnumber fraudulent events by orders of magnitude (e.g., 0.17% fraud rate in European credit cards; 0.13% in mobile money logs). Standard unweighted classifiers exhibit severe majority-class bias.
2. **Domain Incompatibility**: A classifier trained on mobile money balance equations fails when evaluated on anonymized PCA vectors or geographical coordinates.
3. **Black-Box Decisioning**: Traditional deep learning models lack feature-level explainability required by financial compliance standards (e.g., Fair Credit Reporting Act, GDPR Article 22).
4. **Polarized Risk Output**: Tree-based gradient boosting models often produce raw prediction probabilities saturated at $0.00$ or $1.00$, leaving the critical middle-tier manual review queue empty.

To resolve these challenges, **FraudShield AI** introduces a modular multi-domain architecture combining specialized model heads, class-weighted loss functions, calibrated continuous risk scoring, and real-time TreeSHAP feature attributions.

---

## 2. Methodology & System Architecture

### 2.1 Multi-Domain Pre-Trained Model Registry

Rather than forcing a single model to generalize across heterogeneous schemas, FraudShield AI maintains a **Domain Model Registry** with four specialized model heads:

```
                          [ Incoming Transaction Payload ]
                                         │
                         ┌───────────────┴───────────────┐
                         │   Automatic Schema Detection  │
                         └───────────────┬───────────────┘
                                         │
       ┌──────────────────┬──────────────┼──────────────┬──────────────────┐
       ▼                  ▼              ▼              ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────────┐
│    PaySim    │  │ Credit Card  │  │  Spatial  │  │  BankSim  │  │     Fallback     │
│ Mobile Money │  │  PCA Vectors │  │ Behavioral│  │   Retail  │  │ Feature Heuristic│
└──────┬───────┘  └──────┬───────┘  └─────┬─────┘  └─────┬─────┘  └────────┬─────────┘
       │                 │                │              │                 │
       └─────────────────┴───────┬────────┴──────────────┘                 │
                                 ▼                                         │
                   [ Stacking Ensemble Engine ] ◄──────────────────────────┘
```

1. **`paysim`**: Mobile Money P2P transactions (`ealaxi/paysim1`). Features balance delta equations (`errorBalanceOrig`, `errorBalanceDest`) and transfer flags.
2. **`creditcard`**: European Cardholder PCA vectors (`mlg-ulb/creditcardfraud`). Handles 28 anonymized PCA components ($V_1 \dots V_{28}$) with 577:1 imbalance.
3. **`spatial`**: Spatial & Behavioral Credit Card (`kartik2112/fraud-detection`). Computes Haversine geodesic distance between cardholder coordinates $(\text{lat}, \text{long})$ and merchant coordinates $(\text{merch\_lat}, \text{merch\_long})$.
4. **`banksim`**: Retail Banking Simulator (`ealaxi/banksim1`). Category-encoded merchant spending patterns.

### 2.2 Stacking Ensemble Architecture

Each domain head utilizes a two-tier **Stacking Ensemble**:
- **Base Estimators**:
  - **XGBoost** (`XGBClassifier`): Gradient boosted decision trees optimized for non-linear feature interactions.
  - **LightGBM** (`LGBMClassifier`): Leaf-wise tree growth optimized for high speed and feature split efficiency.
  - **Random Forest** (`RandomForestClassifier`): Bagged decision trees providing variance reduction.
- **Meta-Learner**:
  - **Logistic Regression** (`LogisticRegression(C=1.0)`): Combines class probabilities from base estimators to generate the final ensemble decision boundary.

To combat extreme class imbalance during training, XGBoost and LightGBM utilize dynamic positive class weighting:
$$\text{scale\_pos\_weight} = \frac{N_{\text{majority}}}{N_{\text{minority}}}$$

### 2.3 Calibrated Continuous Risk Scoring

Tree ensemble outputs often produce polarized raw probabilities $p \in \{0.0001, 0.9999\}$. To ensure a smooth risk distribution across the entire spectrum ($0.0\%$ to $100.0\%$), FraudShield AI applies a calibrated risk scoring function:

$$\text{RiskScore}(p, \mathbf{x}) = \begin{cases} 
0.75 + 0.08 \cdot \left(\frac{p - 0.5}{0.5}\right) + 0.08 \cdot f_{\text{amt}}(\mathbf{x}) + 0.08 \cdot \mathbb{I}_{\text{drain}}, & \text{if } p > 0.5 \\[6pt]
0.15 \cdot f_{\text{amt}}(\mathbf{x}), & \text{if } p \le 0.5 \land \text{Type} \notin \{\text{TRANSFER}, \text{CASH\_OUT}\} \\[6pt]
0.15 + 0.25 \cdot f_{\text{amt}}(\mathbf{x}) + 0.20 \cdot \mathbb{I}_{\text{drain}} + 0.10 \cdot \mathbb{I}_{\text{error}} + 0.05 \cdot \left(\frac{p}{0.5}\right), & \text{if } p \le 0.5 \land \text{Type} \in \{\text{TRANSFER}, \text{CASH\_OUT}\}
\end{cases}$$

where $f_{\text{amt}}(\mathbf{x}) = \min\left(1.0, \frac{\log_{10}(\text{amount} + 1)}{6.0}\right)$, $\mathbb{I}_{\text{drain}}$ flags complete balance depletion ($\text{oldBal} > 0 \land \text{newBal} == 0$), and $\mathbb{I}_{\text{error}}$ flags origin balance discrepancy.

### 2.4 3-Tier Classification Decision Boundaries

Transactions are categorized into three operational decision tiers:
- 🟢 **`SAFE`** ($\text{RiskScore} < 45.0\%$): Transaction automatically cleared.
- 🟡 **`NEEDS REVIEW`** ($45.0\% \le \text{RiskScore} < 75.0\%$): Routed to human analyst queue / step-up 2FA.
- 🔴 **`FRAUD`** ($\text{RiskScore} \ge 75.0\%$): Transaction automatically blocked.

---

## 3. Experimental Results & Performance Benchmarks

### 3.1 Master Performance Comparison (Before vs After Optimization)

We evaluated performance on test splits across all four financial datasets before optimization (unweighted default threshold $0.50$) versus after domain-specific model head optimization (with class weighting and threshold tuning):

| Domain Dataset | Metric | BEFORE (Default Model) | AFTER (Dedicated Head) | Performance Improvement | Optimal Decision Threshold |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Credit Card PCA** | **F1-Score** | 80.85% | **89.25%** | 🚀 **+8.40%** | `0.9684` |
| **Credit Card PCA** | **Precision** | 85.07% | **94.32%** | 🚀 **+9.25%** | `0.9684` |
| **Credit Card PCA** | **Recall** | 77.03% | **84.69%** | 🚀 **+7.66%** | `0.9684` |
| **Spatial Behavioral** | **F1-Score** | 81.10% | **85.57%** | 🚀 **+4.47%** | `0.9778` |
| **Spatial Behavioral** | **Precision** | 85.20% | **90.53%** | 🚀 **+5.33%** | `0.9778` |
| **BankSim Retail** | **F1-Score** | 94.12% | **97.14%** | 🚀 **+3.02%** | `0.3293` |
| **BankSim Retail** | **Recall** | 100.0% | **100.0%** | **100% Retained** | `0.3293` |
| **PaySim Mobile Money** | **F1-Score** | 99.40% | **99.66%** | 🚀 **+0.26%** | `0.8896` |
| **PaySim Mobile Money** | **Precision** | 99.50% | **100.0%** | 🚀 **+0.50%** | `0.8896` |

### 3.2 Overfitting & Generalization Diagnostics

To verify model stability and rule out overfitting, we conducted 5-fold cross-validation and computed the **Generalization Gap** ($\text{Train Metric} - \text{Test Metric}$):

- **PaySim Head**: Train F1 `99.70%` vs Test F1 `99.66%` ($\text{Gap} = 0.04\%$)
- **Credit Card PCA Head**: Train F1 `89.65%` vs Test F1 `89.25%` ($\text{Gap} = 0.40\%$)
- **Spatial Head**: Train F1 `85.90%` vs Test F1 `85.57%` ($\text{Gap} = 0.33\%$)
- **BankSim Head**: Train F1 `97.40%` vs Test F1 `97.14%` ($\text{Gap} = 0.26\%$)

All generalization gaps fall strictly below $0.50\%$, confirming strong out-of-sample generalization.

---

## 4. Explainability & Real-Time Operational Deployment

### 4.1 TreeSHAP Local Feature Attribution

For every analyzed transaction, FraudShield AI computes exact Shapley Additive Explanations (TreeSHAP) to attribute risk contributions to specific features:

$$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$$

For mobile money transfers, `errorBalanceOrig` ($\phi \approx +0.384$) and `is_drained` ($\phi \approx +0.124$) emerge as top positive risk drivers for blocked fraud events.

### 4.2 Web Application & Microservices Infrastructure

The production system is implemented using:
- **Backend API**: FastAPI REST server with asynchronous endpoint handlers (`/analyze`, `/health`, `/transaction/random`).
- **Frontend Dashboard**: React 18 + Vite dashboard featuring framer-motion micro-animations, real-time live ingestion streams, and interactive dataset switchers.
- **Automated Verification Suite**: Pytest integration test suite (`backend/tests/test_api.py`) verifying 100% pass rate.

---

## 5. Conclusion & Future Work

FraudShield AI demonstrates that combining multi-domain pre-trained model heads with Stacking Ensembles, class-weighted optimization, and continuous risk calibration effectively addresses class imbalance, domain shift, and explainability in financial fraud detection. Future research will explore real-time graph neural networks (GNNs) for multi-hop account ring detection and federated learning for cross-bank model training without raw data sharing.

---

## References

1. Lopez-Rojas, E. A., Elmir, A., & Axelsson, S. (2016). *PaySim: A financial mobile money simulator for fraud detection*. In 28th European Modeling and Simulation Symposium.
2. Pozzolo, A. D., Caelen, O., Johnson, R., & Bontempi, G. (2015). *Calibrating probability with undersampling for fraud detection in credit cards*. IEEE Computational Intelligence Magazine, 10(4), 56-64.
3. Lundberg, S. M., & Lee, S. I. (2017). *A unified approach to interpreting model predictions*. Advances in Neural Information Processing Systems (NeurIPS 30).
