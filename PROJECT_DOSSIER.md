# THAKUR COLLEGE OF ENGINEERING & TECHNOLOGY
*(Autonomous Institute, Affiliated to University of Mumbai)*

# PROJECT DOSSIER

### Semester VI
### Problem Intelligence, Research Design & Claim Formulation

---

**Project Title:** FraudShield AI: An Intelligent Real-Time Financial Transaction & Credit Card Fraud Detection Platform Using Hybrid Stacking Ensemble and Explainable AI (XAI)  
**Domain:** Artificial Intelligence & Machine Learning / Financial Security Systems  
**Student Team:** Ashmit Singh, Sumit Singh, Shivam Singh  
**Faculty Guide:** Ms. Tanmayi Nagale  

---

## 1. Abstract

The exponential growth of online banking, digital payment gateways, and e-commerce has led to a parallel rise in financial fraud, resulting in billions of dollars in annual global losses. Traditional fraud detection platforms rely heavily on static rule-based engines that struggle with non-stationary fraud patterns, generating excessively high False Positive Rates (FPR) that disrupt legitimate transactions. Conversely, standard machine learning models face severe performance degradation when applied to real-world financial transaction datasets characterized by extreme class imbalance (e.g., fraud accounts for less than 0.17% of total volume). Furthermore, most high-performing ensemble models operate as opaque "black boxes," leaving risk analysts without interpretable evidence to justify transaction blocks or dispute approvals.

This project introduces **FraudShield AI**, a comprehensive end-to-end platform designed for real-time financial fraud detection and explainability. FraudShield AI integrates a hybrid **Stacking Ensemble Architecture**—combining XGBoost, LightGBM, and Random Forest base classifiers with a Logistic Regression meta-learner—preprocessed with **OmniSMOTE** oversampling and **RobustScaler** normalization to address class imbalance. To eliminate model opacity, the platform embeds **Explainable AI (XAI)** modules utilizing **SHAP (SHapley Additive exPlanations)** and **LIME (Local Interpretable Model-agnostic Explanations)**, providing local feature attribution and global feature impact rankings for every evaluated transaction. Powered by a high-performance **FastAPI** backend and an interactive **Vite + React** dynamic web dashboard, FraudShield AI offers sub-100ms inference latency, live transaction stream monitoring, instant explainability visualizer, and single-transaction risk diagnostics.

---

## 2. Problem Context and System Understanding

The global financial ecosystem processes billions of digital transactions daily across credit card networks, wire transfers, and digital wallets. While digital transformation has enhanced transaction speed and convenience, it has simultaneously created complex attack vectors for fraudulent actors, including identity theft, account takeover, synthetic carding, and cross-border cyber fraud.

### Core Challenges in Contemporary Fraud Detection:

1. **Extreme Class Imbalance**: In financial datasets, genuine transactions overwhelmingly outnumber fraudulent ones (often exceeding 99.8% to 0.2%). Models trained on such uncalibrated distributions tend to overfit the majority class, achieving misleadingly high accuracy while missing critical fraud cases (low recall).
2. **Opaque "Black-Box" Artificial Intelligence**: Deep learning models and complex gradient-boosted trees yield probability scores without contextual explanation. Modern regulatory frameworks (such as GDPR Article 22 and FCRA compliance guidelines) mandate a "Right to Explanation" for automated financial decisions.
3. **High False Positive Rates in Legacy Systems**: Legacy rule-based detection platforms rely on rigid conditional logic (e.g., flagging transactions > $5,000 across state lines). This results in friction for legitimate cardholders, lost merchant revenue, and analyst fatigue from reviewing thousands of benign alerts.
4. **Latency and Scalability Constraints**: Inline fraud assessment must occur within sub-second SLAs (typically < 200ms) before transaction authorization. Heavy diagnostic computation must be decoupled and optimized to ensure real-time stream processing.

**FraudShield AI** solves these challenges by combining robust imbalanced learning strategies, multi-model stacking ensemble diversity, real-time XAI attribution, and a modular web-based monitoring ecosystem.

---

## 3. Stakeholder Identification

The primary stakeholders for the **FraudShield AI** platform include:

1. **Financial Institutions & Issuing Banks**: Require low fraud loss ratios, reduced operational expenditure on manual fraud investigation, compliance with international financial regulations, and protection of brand reputation.
2. **Fraud Risk Analysts & Compliance Officers**: Demand interpretable diagnostic tools, interactive risk dashboards, transparent feature attributions (SHAP/LIME value charts), and actionable transaction risk scores to make fast, accurate dispute determinations.
3. **Cardholders & Merchant Partners**: Benefit from frictionless payment approvals, minimal false transaction declines, instant security alerts, and robust defense against unauthorized card exploitation.
4. **System Administrators & Security Engineers**: Require low-latency API integration (FastAPI backend), robust REST endpoints, model performance metrics benchmarking, and real-time transaction ingestion monitoring.

---

## 4. Root Cause Analysis

To trace operational and technological failures in traditional financial fraud detection down to their fundamental drivers, two analytical techniques were conducted: **5-Why Analysis** and **Ishikawa (Fishbone) Analysis**.

### 4.1 5-Why Analysis

* **Why do financial institutions suffer high unrecovered losses from credit card fraud?**
  * *Because legacy detection platforms fail to detect complex, multi-variable fraud patterns in real time.*
* **Why do legacy platforms fail to detect these dynamic fraud patterns?**
  * *Because they rely on static rule-based conditions and single-classifier ML models that cannot adapt to non-stationary fraud behavior.*
* **Why do single-classifier ML models perform poorly in production fraud systems?**
  * *Because extreme class imbalance causes models to over-predict majority non-fraud transactions, resulting in low recall and high false positive rates.*
* **Why are risk analysts unable to quickly verify and override automated fraud alerts?**
  * *Because traditional ML systems provide raw probability scores without human-understandable explanations or feature impact attributions.*
* **Why are real-time explainability and adaptive ensemble models not unified in modern fraud management?**
  * *Because existing software implementations treat fraud scoring, imbalance resampling, model interpretability, and live stream visualization as isolated components rather than an integrated platform.*

---

### 4.2 Ishikawa (Fishbone) Analysis

```
                      ISHIKAWA (FISHBONE) DIAGRAM: FRAUD DETECTION INEFFICIENCIES

   METHOD (Detection Process)           MATERIAL (Transaction Data)           MACHINE (Infrastructure)
   --------------------------           ---------------------------           ------------------------
   - Static rule thresholds             - Extreme class imbalance             - High inference latency
   - Lack of ensemble diversity          - High-dimensional anonymized features - Legacy batch processing
   - Uncalibrated decision limits       - Non-stationary fraud patterns       - Lack of real-time stream APIs
                                 \                   |                   /
                                  \                  |                  /
                                   \                 |                 /
                                    ===================================>  INEFFICIENT REAL-TIME
                                   /                 |                 \  FRAUD DETECTION & HIGH
                                  /                  |                  \ FALSE POSITIVE RATES
                                 /                   |                   \
   --------------------------           ---------------------------           ------------------------
   - Risk analyst alert fatigue         - Evolving cyber threat vectors       - Evaluation on accuracy only
   - Lack of XAI decision clarity       - Cross-border transaction volume      - Absence of real-time FPR/Recall 
   - Manual override delay              - High customer friction expectation    metric tracking
     MAN (Human Factors)                  ENVIRONMENT (Market Context)          MEASUREMENT (Metrics)
```

1. **Method (Detection Process)**: Dependence on rigid, manual rule definitions; absence of multi-algorithm stacking ensembles; uncalibrated risk scoring thresholds.
2. **Material (Transaction Data)**: Extreme class imbalance (0.17% fraud prevalence); high dimensionality ($V1-V28$ PCA features); rapid temporal shifts in fraudulent spending behavior.
3. **Machine (Infrastructure & Compute)**: Slow batch-oriented prediction systems; lack of asynchronous low-latency REST endpoints; absence of parallelized XAI calculation pipelines.
4. **Man (Human Factors)**: Risk analyst fatigue caused by thousands of false alerts; inability to trust opaque probability outputs without local feature attribution.
5. **Environment (Market & Cyber Threat Landscape)**: Rapid escalation in online card-not-present (CNP) transactions; globalized multi-channel attack vectors.
6. **Measurement (Metrics & Benchmarking)**: Over-reliance on overall accuracy instead of Precision-Recall AUC, ROC-AUC, and cost-sensitive F1-score evaluation.

---

## 5. Literature Review Summary

| Ref. | Author(s), Year | Key Contribution | Gap Identified |
| :--- | :--- | :--- | :--- |
| **[1][2]** | Dal Pozzolo et al., 2015; Carcillo et al., 2018 | Analyzed credit card fraud detection challenges, emphasis on concept drift and class imbalance in streaming data. | Focused on standalone classifiers without real-time explainable AI (XAI) integration. |
| **[3][4]** | Chawla et al., 2002; He & Garcia, 2009 | Formulated SMOTE and adaptive oversampling methods for imbalanced data distributions. | Basic synthetic sampling can produce overgeneralization noise along decision boundaries if uncalibrated. |
| **[5][6]** | Lundberg & Lee, 2017; Ribeiro et al., 2016 | Developed SHAP (SHapley Additive exPlanations) and LIME for local and global model interpretability. | High computational complexity of SHAP makes real-time sub-100ms online prediction explainability challenging. |
| **[7][8]** | Chen & Guestrin, 2016; Ke et al., 2017 | Introduced XGBoost and LightGBM gradient boosting algorithms for high-speed, accurate structured data classification. | Individual tree models struggle with extreme edge cases without stacked meta-learning ensembles. |
| **[9][10]** | Wolpert, 1992; Breiman, 1996 | Established Stacking Generalization and Bagging principles for combining heterogeneous base models. | Stacking models increase system complexity and require specialized API architectures for fast inference. |
| **[11][12]**| FastAPI Documentation, 2025; Uvicorn Core Team, 2024 | Demonstrated asynchronous ASGI microservices for low-latency machine learning model deployment. | Application docs focus on generic REST APIs rather than integrated financial XAI stream pipelines. |
| **[13][14]**| React Core Team, 2025; Vite Dev Team, 2025 | Modern frontend component architecture for dynamic, real-time data visualization dashboards. | Web framework guides lack specialized risk management and transaction explainability components. |
| **[15][16]**| EU Artificial Intelligence Act, 2024; Financial Conduct Authority, 2023 | Mandated explainability, audit trails, and fairness standards for AI models in credit and financial scoring. | Regulatory guidelines state requirements but do not specify technical reference implementation architectures. |

---

## 6. Proposed Architecture

FraudShield AI implements a decoupled, high-performance web architecture consisting of a **React + Vite Dynamic UI Frontend**, an **Asynchronous FastAPI Microservice Backend**, a **Hybrid Stacking Ensemble Model Engine**, an **OmniSMOTE Class Imbalance Resampler**, and a dual **SHAP/LIME Explainable AI Engine**.

```
+-----------------------------------------------------------------------------------+
|                                 USER INTERFACE                                    |
|                       React 18 + Vite + Tailwind CSS                              |
|   +-------------------+  +--------------------+  +----------------------------+   |
|   | Dashboard Module  |  | Live Monitoring    |  | Transaction Analysis       |   |
|   +-------------------+  +--------------------+  +----------------------------+   |
|   +-------------------+  +--------------------+                                   |
|   | Explainable AI    |  | Model Comparison   |                                   |
|   +-------------------+  +--------------------+                                   |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (HTTP / JSON)
                                          v
+-----------------------------------------------------------------------------------+
|                                FASTAPI BACKEND API                                |
|                                 (main.py / routes)                                |
+-----------------------------------------+-----------------------------------------+
                                          |
                   +----------------------+----------------------+
                   |                                             |
                   v                                             v
+------------------------------------+        +-------------------------------------+
|        MODEL ENGINE LAYER          |        |       EXPLAINABLE AI ENGINE         |
|      (model_engine.py)             |        |          (explainer.py)             |
|  +------------------------------+  |        |  +-------------------------------+  |
|  | Base Learners:               |  |        |  | SHAP Kernel / Tree Explainer |  |
|  |  - XGBoost Classifier        |  |        |  +-------------------------------+  |
|  |  - LightGBM Classifier       |  |        |  +-------------------------------+  |
|  |  - Random Forest Classifier  |  |        |  | LIME Tabular Explainer        |  |
|  +--------------+---------------+  |        |  +-------------------------------+  |
|                 |                  |        +-------------------------------------+
|                 v                  |
|  +------------------------------+  |
|  | Meta Learner:                |  |
|  |  - Logistic Regression       |  |
|  +------------------------------+  |
+------------------+-----------------+
                   |
                   v
+-----------------------------------------------------------------------------------+
|                         DATA PREPROCESSING & SAMPLING                             |
|                           (data_loader.py / OmniSMOTE)                            |
|       - RobustScaler (Center & Scale)     - Synthetic Imbalance Resampling       |
+-----------------------------------------------------------------------------------+
```

### Architectural Component Breakdown:

1. **Frontend Presentation Layer ([frontend/src](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/frontend/src))**:
   - **Dashboard Module ([DashboardModule.jsx](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/frontend/src/components/DashboardModule.jsx))**: Executive view featuring KPI summary metrics, transaction volume charts, fraud detection rates, and system latency.
   - **Live Monitoring Module ([LiveMonitoringModule.jsx](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/frontend/src/components/LiveMonitoringModule.jsx))**: Real-time transaction ingestion feed with automated risk level badges (Low, Medium, High Fraud Risk).
   - **Transaction Analysis Module ([TransactionAnalysisModule.jsx](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/frontend/src/components/TransactionAnalysisModule.jsx))**: Single transaction inspector allowing users to modify parameters ($V1-V28$, Amount, Time) and trigger instant predictions.
   - **Explainable AI Module ([ExplainableAIModule.jsx](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/frontend/src/components/ExplainableAIModule.jsx))**: Interactive visualization of SHAP waterfall plots and LIME feature weights for individual predictions.
   - **Model Comparison Module ([ModelComparisonModule.jsx](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/frontend/src/components/ModelComparisonModule.jsx))**: Comparative metrics matrix (ROC-AUC, Precision, Recall, F1-Score, Latency) across individual algorithms vs. the Stacking Ensemble.

2. **Backend API Gateway ([backend/main.py](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/backend/main.py))**:
   - Built on **FastAPI** with CORS middleware support.
   - Exposes RESTful endpoints for single transaction prediction (`/predict`), batch monitoring (`/transactions`), SHAP feature attribution (`/explain/shap`), LIME explanation (`/explain/lime`), and model metrics benchmarking (`/metrics`).

3. **Core Model & Preprocessing Engine ([backend/app/core](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/backend/app/core))**:
   - **Data Preprocessing ([data_loader.py](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/backend/app/core/data_loader.py))**: Scales transaction features using `RobustScaler` to minimize outlier distortion on $V1-V28$ PCA components and `Amount`.
   - **Imbalance Management ([evaluate_creditcard_dataset.py](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/research/scripts/evaluate_creditcard_dataset.py))**: Utilizes **OmniSMOTE** oversampling to generate synthetic minority samples, raising fraud prevalence during training to optimal ratios (e.g., 50:50 balance).
   - **Stacking Classifier ([model_engine.py](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/backend/app/core/model_engine.py))**: Integrates XGBoost, LightGBM, and Random Forest base classifiers with a 3-fold cross-validated Logistic Regression meta-learner.

4. **Explainable AI Engine ([explainer.py](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/backend/app/core/explainer.py))**:
   - Pre-computes background data distributions and dynamically extracts additive feature attribution scores (SHAP values) and sparse linear approximations (LIME weights) for real-time visual breakdown.

---

## 7. Research Gap Identification

Based on exhaustive analysis of existing literature and industrial fraud detection platforms, four major research gaps were identified:

* **Gap 1: Disjointed Class Imbalance Resampling and Stacking Ensembles**  
  *Existing Research*: Most studies apply basic SMOTE on single classifiers (e.g., Random Forest or Logistic Regression) independently.  
  *Limitation*: Single models fail to capture complex non-linear feature inter-dependencies, while basic SMOTE can introduce boundary noise. FraudShield AI bridges this gap by coupling **OmniSMOTE** with a heterogeneous multi-model **Stacking Ensemble**.

* **Gap 2: Black-Box Predictions in High-Accuracy Ensemble Models**  
  *Existing Research*: Gradient boosted trees (XGBoost, LightGBM) yield state-of-the-art ROC-AUC metrics but offer no inline interpretability.  
  *Limitation*: Fraud analysts cannot determine *why* a specific transaction was flagged, leading to slow manual reviews or unverified rejections. FraudShield AI integrates **SHAP** and **LIME** directly into the prediction lifecycle.

* **Gap 3: High False Positive Rates in Legacy Rule-Based & Standalone Systems**  
  *Existing Research*: Traditional rule engines generate up to 90%+ false positives, causing severe cardholder friction.  
  *Limitation*: Standard classifiers lack fine-grained decision threshold calibration. FraudShield AI's stacking meta-learner optimizes probability calibration to dramatically suppress False Positives while preserving high Recall.

* **Gap 4: Absence of an Integrated, End-to-End Real-Time Monitoring Platform**  
  *Existing Research*: Theoretical machine learning research papers focus strictly on offline Jupyter Notebook evaluations.  
  *Limitation*: There is a lack of production-ready reference implementations connecting trained ML models, low-latency REST APIs, and modern interactive frontend dashboards. FraudShield AI fulfills this by offering a full-stack, deployable solution.

---

## 8. Problem Statement and Research Objectives

### Formal Problem Statement

> *"Contemporary financial transaction systems face severe vulnerabilities from sophisticated fraud patterns, exacerbated by extreme data class imbalance, high false positive rates in legacy rule engines, and the opaque black-box nature of advanced machine learning models. There is a critical need for an integrated real-time platform that combines advanced imbalance resampling, a heterogeneous stacking ensemble classifier, and instant explainable AI (XAI) feature attributions within a low-latency web architecture to enhance fraud detection accuracy, reduce analyst verification overhead, and ensure financial compliance."*

### Research Objectives

1. **Develop a Hybrid Stacking Ensemble Classifier**: Design and evaluate a multi-model stacking architecture combining XGBoost, LightGBM, and Random Forest base learners with a Logistic Regression meta-classifier for transaction fraud prediction.
2. **Implement Advanced Class Imbalance Resampling**: Apply **OmniSMOTE** synthetic oversampling alongside `RobustScaler` feature normalization to mitigate extreme minority class imbalance without overfitting.
3. **Integrate Dual Real-Time Explainable AI (XAI) Engines**: Embed **SHAP** and **LIME** interpretability algorithms into the API pipeline to generate instant local feature attributions and global feature importance rankings.
4. **Build a High-Throughput, Low-Latency Microservice Backend**: Construct an asynchronous **FastAPI** REST backend capable of processing single transaction predictions, batch stream processing, and XAI calculations in under 100ms.
5. **Construct an Interactive Web Monitoring Dashboard**: Develop a responsive, modern frontend platform using **React 18 + Vite + Tailwind CSS** featuring live transaction feeds, interactive SHAP waterfall visualizers, and comparative model metric benchmarking.

---

## 9. Hypotheses and Claim Formulation

To evaluate the technical effectiveness of **FraudShield AI**, four core hypotheses have been formulated for empirical validation:

### Hypothesis 1: Enhanced Fraud Detection Accuracy & Recall (Detection Accuracy Claim)
* **Claim**: Integrating an OmniSMOTE-resampled Stacking Ensemble (XGBoost + LightGBM + Random Forest) will yield significantly higher Recall and F1-Score on imbalanced transaction data compared to individual standalone base classifiers.
* **Validation Metric**: Measure and compare Precision, Recall, F1-Score, and Precision-Recall AUC (PR-AUC) across standalone models versus the Stacking Ensemble on real-world transaction datasets (e.g., Kaggle Credit Card Fraud Dataset).

### Hypothesis 2: Reduction in False Positive Rate (Operational Efficiency Claim)
* **Claim**: The meta-learner stacking stage will improve probability calibration, reducing the False Positive Rate (FPR) compared to traditional single tree models and static rule-based systems.
* **Validation Metric**: Evaluate False Positive Count, Specificity, and Confusion Matrix ratios across varying decision thresholds ($0.30$ to $0.70$).

### Hypothesis 3: Real-Time Model Interpretability (XAI Transparency Claim)
* **Claim**: Incorporating SHAP feature attributions and LIME local approximations provides transparent, consistent rationale for high-risk transaction flags, enabling risk analysts to verify decisions instantly.
* **Validation Metric**: Evaluate feature attribution stability, local fidelity of LIME linear surrogates, and user usability feedback on XAI visualizer plots.

### Hypothesis 4: Low-Latency & High-Throughput System Performance (System Latency Claim)
* **Claim**: The asynchronous FastAPI microservice architecture will maintain average prediction response times under 100ms and end-to-end XAI explanation latency under 300ms under concurrent user access.
* **Validation Metric**: Conduct load testing and benchmark API response latency, memory footprint, and request throughput ($req/sec$).

---

*End of Project Dossier — FraudShield AI*
