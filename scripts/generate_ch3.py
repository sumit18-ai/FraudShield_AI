import os

def get_chapter_3():
    return """
<div style="page-break-before: always;"></div>

---

# Chapter 3: Requirement Gathering, Analysis and Planning

## 3.1 Requirement Specification

Software Requirement Specification (SRS) establishes the foundational functional capabilities, performance standards, architectural constraints, and operational boundaries of the FraudShield AI platform. The system is engineered to function within mission-critical banking environments where high availability, ultra-low latency, mathematical transparency, and regulatory compliance are non-negotiable.

### 3.1.1 Functional Requirements Specifications (FR)

The platform’s functional scope is partitioned into twelve formal Functional Requirements (FR-01 through FR-12) detailed below:

#### Table 3.1: Functional Requirements Specifications

| Requirement ID | Requirement Title | Requirement Description & Acceptance Criteria | Priority |
| :---: | :--- | :--- | :---: |
| **FR-01** | Multi-Domain Schema Ingestion & Routing | The system must automatically detect the schema of incoming transaction payloads (e.g., PaySim, Credit Card PCA, Spatial Behavioral, BankSim) and route the payload to the corresponding pre-trained domain model head. Acceptance: Routing completes in $< 2\\text{ms}$ with 100% schema match. | High |
| **FR-02** | Stacking Ensemble Inference | The platform must execute Level-0 inference across XGBoost, LightGBM, and Random Forest base classifiers and synthesize predictions using a Logistic Regression meta-learner. Acceptance: Ensemble output yields continuous posterior probability $p \\in [0, 1]$. | High |
| **FR-03** | Calibrated Continuous Risk Scoring | The system must map raw ensemble probabilities into a continuous risk score ($0.0\\% - 100.0\\%$) using transaction velocity, account liquidation heuristics, and geolocation deltas, assigning one of three decision tiers: `SAFE`, `NEEDS REVIEW`, or `FRAUD`. | High |
| **FR-04** | Real-Time TreeSHAP Feature Attribution | The platform must synchronously compute exact Shapley values (TreeSHAP) for each input feature during transaction scoring. Acceptance: Feature attributions must satisfy additive efficiency ($\sum \phi_i = f(x) - \phi_0$) within $< 50\\text{ms}$. | High |
| **FR-05** | Automated FCRA Reason Code Generation | For any transaction assigned to `NEEDS REVIEW` or `FRAUD`, the system must extract top positive risk-driving features and map them into standardized Fair Credit Reporting Act (FCRA) Adverse Action Reason Codes (e.g., `RC-BAL-02`, `RC-GEO-01`). | High |
| **FR-06** | In-Memory Cyclic Mule Ring Detection | The graph intelligence engine must construct an in-memory directed transaction graph and detect multi-hop cycles ($A \\rightarrow B \\rightarrow C \\rightarrow A$) of length $k \\in [2, 6]$. Acceptance: Detects cyclic money laundering paths in $< 10\\text{ms}$ for up to 10,000 active nodes. | High |
| **FR-07** | Account Mule Centrality Scoring | The system must compute composite mule risk scores for individual accounts based on graph in-degree, out-degree, transaction velocity, and balance depletion flags. Acceptance: Scores updated dynamically upon new edge creation. | Medium |
| **FR-08** | MLOps Concept Drift Monitoring | The platform must monitor streaming feature distributions against baseline reference distributions using two-sample Kolmogorov-Smirnov (KS) tests and Population Stability Index (PSI). Acceptance: Generates automated warnings when $\\text{PSI} > 0.10$ and alerts when $\\text{PSI} > 0.25$. | Medium |
| **FR-09** | Synthetic Adversarial Drift Injection | The platform must provide an administrative sandbox allowing authorized users to inject synthetic covariate drift vectors (e.g., balance anomalies, amount spikes) to test system resilience. | Medium |
| **FR-10** | Federated Learning Simulation (FedAvg) | The system must simulate decentralized multi-bank collaborative training across at least three independent nodes (Bank Alpha, Beta, Gamma) using Federated Averaging (FedAvg), updating global model weights without sharing raw transaction records. | Medium |
| **FR-11** | Role-Based Access Control (RBAC) | The platform must enforce strict cryptographic JWT authentication, provisioning distinct permissions for three user personas: SOC Analyst, Compliance Officer, and System Administrator. | High |
| **FR-12** | Immutable Audit Trail Logging | The system must maintain an append-only, tamper-evident audit log recording user logins, single-transaction inspections, manual triage overrides, and federated training rounds with microsecond timestamps. | High |

---

### 3.1.2 Non-Functional Requirements Specifications (NFR)

Non-functional requirements specify operational criteria used to evaluate system performance, security posture, reliability, and usability:

#### Table 3.2: Non-Functional Requirements Specifications

| Requirement ID | Quality Attribute | Technical Specification & Target Benchmark |
| :---: | :--- | :--- |
| **NFR-01** | Performance & Latency | Single-transaction inference and risk scoring must execute within an average response latency of $< 100\\text{ms}$ (P95 $< 150\\text{ms}$, P99 $< 250\\text{ms}$) under a baseline concurrency of 50 requests/sec. |
| **NFR-02** | High Throughput | The asynchronous FastAPI microservice backend must support sustained throughput of $\\ge 500\\text{ transactions/sec}$ in batch ingestion mode on standard quad-core server hardware. |
| **NFR-03** | System Availability | The platform architecture must support $99.9\\%$ service availability, utilizing container health probes (`/health`) and automatic process restarts via Docker orchestration. |
| **NFR-04** | Security & Hardening | All API endpoints must enforce OWASP Recommended Security Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict CORS policies. Sensitive tokens must utilize HMAC-SHA256 signatures with 60-minute expiration windows. |
| **NFR-05** | Anti-DDoS Protection | The API Gateway must implement sliding-window rate limiting (e.g., max 100 requests per minute per IP for public endpoints) returning HTTP 429 Too Many Requests upon breach. |
| **NFR-06** | Explainability Latency | Synchronous TreeSHAP feature attribution calculation must not introduce more than $50\\text{ms}$ of computational overhead to the base inference pipeline. |
| **NFR-07** | Responsive Web Usability | The React 19 frontend SPA must achieve a Google Lighthouse performance score of $\\ge 90$, render fluid micro-animations at 60 FPS, and adapt responsively across desktop, tablet, and mobile displays. |
| **NFR-08** | Maintainability & Testability | Codebase must maintain modular separation of concerns (Core, API, Schemas, UI), achieve $\\ge 90\\%$ code coverage across core scoring logic, and execute automated pytest suites in $< 15\\text{ seconds}$. |

---

### 3.1.3 Role-Based Access Control (RBAC) Specifications

To safeguard sensitive financial data and prevent unauthorized override of automated fraud decisions, FraudShield AI enforces a granular Role-Based Access Control matrix. The platform defines three distinct user personas:

#### Table 3.3: Role-Based Access Control (RBAC) Permission Matrix

| Functional Capability / Endpoint | Public / Unauthenticated | SOC Analyst (`soc_analyst`) | Compliance Officer (`compliance_officer`) | System Administrator (`admin`) |
| :--- | :---: | :---: | :---: | :---: |
| System Health Check (`/health`) | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| User Authentication (`/auth/login`) | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| User Self-Registration (`/auth/register`) | ✅ Allowed | ❌ Denied | ❌ Denied | ✅ Allowed |
| Single Transaction Scoring (`/analyze`) | ❌ Denied | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| Live Transaction Stream Monitoring | ❌ Denied | ✅ View & Triage | ✅ View Only | ✅ Full Control |
| TreeSHAP Waterfall & Feature View | ❌ Denied | ✅ View Attribution | ✅ Full Audit View | ✅ Full Audit View |
| FCRA Adverse Action Letter Download | ❌ Denied | ❌ Denied | ✅ Generate & Export | ✅ Generate & Export |
| Graph Network Topology & Mule Rings | ❌ Denied | ✅ Investigate Rings | ✅ View Topology | ✅ Full Admin Control |
| MLOps Drift Status & KS Metrics | ❌ Denied | ❌ Denied | ✅ View Metrics | ✅ Full Access |
| Synthetic Drift Injection Sandbox | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Execute Spikes |
| Federated Learning Simulation Round | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Trigger FedAvg |
| View Immutable Security Audit Logs | ❌ Denied | ❌ Denied | ✅ Read-Only Audit | ✅ Full Audit Access |

---

## 3.2 Feasibility Study

A multi-dimensional feasibility study was conducted prior to system implementation to evaluate technical, operational, economic, schedule, and legal dimensions.

### 3.2.1 Technical Feasibility

The technical feasibility evaluates whether available algorithmic frameworks, programming languages, libraries, and hardware infrastructure can satisfy project objectives:
- **Machine Learning & Ensemble Feasibility**: Python provides mature, highly optimized C++ bindings for gradient-boosted trees through `xgboost` and `lightgbm`. Both libraries support multi-threaded CPU and GPU training, built-in $L_1/L_2$ regularization, and native positive class weighting (`scale_pos_weight`). Scikit-learn's `StackingClassifier` offers an industrial-grade interface for training Level-0 base learners and Level-1 meta-classifiers.
- **Explainability Feasibility**: Lundberg’s `shap` C++ implementation of the TreeSHAP algorithm evaluates tree ensemble attributions in polynomial time $\\mathcal{O}(T L D^2)$, reducing calculation times from minutes (KernelSHAP) to under 30 milliseconds.
- **Microservices & Web Feasibility**: FastAPI utilizes Starlette and Pydantic, executing asynchronous event loops powered by `uvloop`. It consistently ranks among the fastest web frameworks in TechEmpower benchmarks, rivaling Node.js and Go. On the frontend, React 19 and Vite 6 provide rapid Hot Module Replacement (HMR) and lightweight production bundles ($< 400\\text{ KB}$ gzipped).
- **Conclusion**: The project is **100% Technically Feasible**.

### 3.2.2 Operational Feasibility

Operational feasibility evaluates how effectively the platform integrates into existing banking workflows:
- **Analyst Workflow Alignment**: FraudShield AI provides pre-configured 1-click personas in the Identity Portal, eliminating onboarding friction. Rather than forcing analysts to parse raw JSON logs, the interface presents intuitive visual risk badges, plain-English FCRA reason cards, and interactive network graphs.
- **Human-in-the-Loop Safeguards**: By introducing the `NEEDS REVIEW` tier ($45\\%-75\\%$), the platform respects established banking standard operating procedures (SOPs), automating straight-through processing for obvious safe/fraud transactions while empowering human analysts to handle nuanced disputes.
- **Conclusion**: The platform achieves **High Operational Feasibility**.

### 3.2.3 Economic Feasibility

Economic feasibility assesses development and operational expenditures against anticipated financial returns:
- **Development Costs**: The platform is constructed entirely using open-source technologies (Python, FastAPI, React, Vite, Docker, Scikit-learn, XGBoost, NetworkX), incurring zero software licensing fees.
- **Infrastructure Costs**: Microservice architecture allows containerized deployment on modest cloud instances (e.g., 2 vCPUs, 4GB RAM) or free-tier hosting platforms (Render, Vercel, Docker Hub).
- **Return on Investment (ROI)**: Commercial financial institutions lose billions annually to fraud and spend millions on manual investigation. A platform that reduces false positive rates by $20\\%$ saves tier-1 banks millions annually in operational costs while preserving cardholder revenue.
- **Conclusion**: The project demonstrates **Exceptional Economic Feasibility**.

### 3.2.4 Schedule Feasibility

The project schedule was structured across two academic semesters (Semester VI & Semester VII) using the Agile Scrum framework across six 3-week sprint cycles. All functional milestones—from exploratory data analysis (EDA) to model training, API construction, frontend design, and automated testing—were sequenced logically with generous risk contingency buffers.
- **Conclusion**: The project satisfies **Strict Schedule Feasibility**.

### 3.2.5 Legal, Ethical & Regulatory Feasibility

Compliance with international legal frameworks is a core design criterion of FraudShield AI:
- **GDPR Article 22 & EU AI Act (2024)**: The system strictly satisfies the "Right to Explanation" by decomposing every classification into exact TreeSHAP feature attributions.
- **FCRA Section 615(a) & ECOA**: Automated generation of Adverse Action reason codes guarantees that consumers are not denied financial services based on discriminatory, arbitrary, or unrecorded criteria.
- **Data Privacy & Sovereignty**: The Federated Learning simulation module proves that cross-institutional fraud defense can operate without pooling raw transaction records or customer PII.
- **Conclusion**: The project establishes **Complete Legal and Regulatory Feasibility**.

---

## 3.3 Methodology

FraudShield AI adopts a modified **CRISP-DM (Cross-Industry Standard Process for Data Mining)** framework tailored specifically for high-frequency, regulated financial machine learning systems. The lifecycle comprises six iterative, interconnected phases:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            MODIFIED CRISP-DM FINANCIAL AI LIFECYCLE                         │
│                                                                                             │
│  ┌────────────────────────┐         ┌────────────────────────┐         ┌─────────────────┐  │
│  │ 1. Problem & Regulatory│ ──────► │ 2. Multi-Domain Data   │ ──────► │ 3. Preprocessing│  │
│  │    Intelligence Phase  │         │    Acquisition & EDA   │         │    & OmniSMOTE  │  │
│  └────────────────────────┘         └────────────────────────┘         └────────┬────────┘  │
│                                                                                 │           │
│  ┌────────────────────────┐         ┌────────────────────────┐                  │           │
│  │ 6. Continuous MLOps &  │ ◄────── │ 5. Explainability &    │ ◄────────────────┘           │
│  │    Federated Monitoring│         │    Operational Tuning  │   4. Stacking Ensemble       │
│  └────────────────────────┘         └────────────────────────┘      Training & Validation   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3.1 Phase 1: Problem & Regulatory Intelligence
- Formalize business objectives: maximize fraud recall ($> 85\\%$ on imbalanced data) while suppressing false positive rates ($< 6\\%$).
- Identify regulatory constraints: map EU AI Act transparency rules and FCRA adverse action mandates directly into algorithmic requirements.

### 3.3.2 Phase 2: Multi-Domain Data Acquisition & Exploratory Analysis
- Ingest four benchmark datasets: PaySim Mobile Money (6.3M records), European Credit Card PCA (284k records), Spatial Behavioral Credit Card (1.8M records), and BankSim Retail Banking (594k records).
- Analyze class imbalance distributions, covariance structures, outlier distributions, and missing value profiles.

### 3.3.3 Phase 3: Data Preprocessing & Advanced Resampling
- Apply `RobustScaler` across continuous transaction attributes ($V_1-V_{28}$, Amount, Balance) using interquartile range (IQR) scaling:
  $$x_{\\text{scaled}} = \\frac{x - \\text{median}(x)}{\\text{IQR}(x)} = \\frac{x - Q_2}{Q_3 - Q_1}$$
  preventing extreme financial transaction outliers from distorting feature variance.
- Execute **OmniSMOTE** boundary-calibrated oversampling on training splits, raising minority class prevalence to balanced ratios while pruning boundary synthesis that overlaps majority clusters.

### 3.3.4 Phase 4: Stacking Ensemble Training & Out-of-Fold Validation
- Partition datasets into stratified $80\\%$ training and $20\\%$ holdout testing splits.
- Train Level-0 base estimators: XGBoost (`scale_pos_weight` tuned), LightGBM (`max_depth=6`, `num_leaves=31`), and Random Forest (`n_estimators=100`).
- Generate out-of-fold probability predictions using 5-fold stratified cross-validation.
- Train Level-1 Logistic Regression meta-learner ($C=1.0$) on meta-probability vectors.

### 3.3.5 Phase 5: Real-Time Explainability & Decision Tuning
- Pre-compute TreeSHAP explainer trees using background reference transaction matrices.
- Formulate continuous risk calibration formulas fusing model probabilities with balance liquidation flags and velocity heuristics.
- Establish 3-tier classification thresholds: `SAFE` ($< 45\\%$), `NEEDS REVIEW` ($45\\%-75\\%$), `FRAUD` ($\\ge 75\\%$).

### 3.3.6 Phase 6: Continuous MLOps, Drift Auditing & Federated Defense
- Deploy streaming Kolmogorov-Smirnov and PSI covariate shift detectors.
- Integrate in-memory NetworkX graph cycle algorithms for mule ring detection.
- Simulate Federated Averaging (FedAvg) rounds across banking nodes to validate privacy-preserving collaborative learning.

---

## 3.4 Technology Stack

The FraudShield AI technological architecture is constructed using modern, industry-standard languages, frameworks, and deployment containers:

#### Table 3.5: Comprehensive Technology Stack Specification

| Subsystem Layer | Technology / Tool | Version | Architectural Role & Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** | 19.0.0 | High-performance single-page application (SPA) library utilizing concurrent rendering and virtual DOM diffing. |
| **Build & Bundler** | **Vite** | 6.0.0 | Next-generation frontend tooling providing sub-second Hot Module Replacement (HMR) and optimized Rollup builds. |
| **CSS & Styling** | **Tailwind CSS** | 3.4.1 | Utility-first CSS framework enabling dark-mode glassmorphic aesthetics and responsive layouts without stylesheet bloat. |
| **Micro-Animations** | **Framer Motion** | 11.0.0 | Production-grade motion library for fluid UI transitions, expandable transaction triage drawers, and modal overlays. |
| **Network Visualization** | **SVG / Canvas** | Native | Interactive rendering of transaction topologies, circular money laundering rings, and account node clusters. |
| **Backend API Framework**| **FastAPI** | 0.115.0+ | Modern, asynchronous ASGI web framework built on Starlette and Pydantic with automatic OpenAPI documentation. |
| **ASGI Web Server** | **Uvicorn** | 0.30.0+ | Lightning-fast asynchronous server implementation for Python based on `uvloop` and `httptools`. |
| **Data Validation** | **Pydantic** | 2.8.0+ | Robust data validation and schema enforcement utilizing Python type hints with zero-overhead runtime parsing. |
| **Machine Learning Core** | **Scikit-Learn** | 1.5.0+ | Core machine learning library providing `StackingClassifier`, `RobustScaler`, metrics benchmarking, and model persistence. |
| **Gradient Boosting (1)** | **XGBoost** | 2.1.0+ | Extreme Gradient Boosting library optimized for fast parallel tree construction and positive class weighting. |
| **Gradient Boosting (2)** | **LightGBM** | 4.4.0+ | High-performance gradient boosting framework utilizing histogram binning, GOSS, and leaf-wise tree growth. |
| **Imbalanced Learning** | **Imbalanced-Learn** | 0.12.0+ | Advanced resampling suite providing SMOTE, Borderline-SMOTE, and ADASYN implementations. |
| **Explainable AI (XAI)** | **SHAP (TreeSHAP)** | 0.46.0+ | Game-theoretic feature attribution library providing exact polynomial-time TreeSHAP calculations. |
| **Graph Intelligence** | **NetworkX** | 3.3.0+ | Comprehensive Python graph library for building transaction networks, finding cycles, and computing degree centrality. |
| **Security & JWT** | **PyJWT** | 2.8.0+ | Cryptographic JSON Web Token implementation for stateless, secure session authentication and RBAC claims. |
| **Containerization** | **Docker & Compose** | 26.0+ | Container virtualization ensuring consistent, reproducible deployment across development, staging, and production. |
| **Automated Testing** | **Pytest** | 8.2.0+ | Mature Python testing framework used for unit testing, endpoint integration testing, and regression suites. |

---

## 3.5 Gantt Chart and Process Model

### 3.5.1 Agile Scrum Process Model

FraudShield AI was developed utilizing the **Agile Scrum** methodology. Development was divided into six two-week sprints grouped into two macro project phases:

#### Table 3.6: Agile Sprint Backlog, Story Points, and Delivery Milestones

| Sprint No. | Sprint Focus & Core Deliverables | Story Points | Duration | Milestones Achieved |
| :---: | :--- | :---: | :---: | :--- |
| **Sprint 1** | Problem Formulation, Regulatory Audit, Dataset Acquisition | 25 pts | Weeks 1–3 | Project Dossier, Dataset Ingestion Pipeline, Baseline EDA. |
| **Sprint 2** | Data Preprocessing, RobustScaler, OmniSMOTE Resampling | 35 pts | Weeks 4–6 | Cleaned multi-domain datasets, balanced training partitions. |
| **Sprint 3** | Stacking Ensemble Training & Hyperparameter Optimization | 45 pts | Weeks 7–9 | Level-0 XGB/LGBM/RF models, Level-1 Meta-Learner, 5-fold CV. |
| **Sprint 4** | TreeSHAP Integration, FCRA Reason Codes, Risk Calibration | 40 pts | Weeks 10–12 | Sub-50ms TreeSHAP engine, 3-tier calibrated risk scoring. |
| **Sprint 5** | FastAPI Microservice Gateway, RBAC, Security & Audit Logs | 35 pts | Weeks 13–15 | Complete REST API endpoints (`/analyze`, `/health`, `/auth`). |
| **Sprint 6** | React 19 Frontend SPA, Live Stream, Network Graph, Docker | 40 pts | Weeks 16–18 | Full-stack containerized platform, live stream simulator, Blue Book. |

### 3.5.2 Gantt Chart Schedule

The visual timeline illustrating task sequencing, dependency relationships, and milestone completions across the academic cycle is shown below:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            FRAUDSHIELD AI PROJECT GANTT CHART                               │
│                                                                                             │
│ Phase / Task Name            W1  W2  W3  W4  W5  W6  W7  W8  W9  W10 W11 W12 W13 W14 W15 W16│
│ ─────────────────────────────────────────────────────────────────────────────────────────── │
│ 1. Problem Def & Literature  [██████]                                                       │
│ 2. Data Acquisition & EDA        [██████]                                                   │
│ 3. Preprocessing & Resample          [██████]                                               │
│ 4. Stacking Model Training               [██████████]                                       │
│ 5. TreeSHAP & Risk Engine                        [██████████]                               │
│ 6. FastAPI Backend & RBAC                                [██████████]                       │
│ 7. React 19 Frontend UI                                      [██████████]                   │
│ 8. Graph & Drift Modules                                             [██████████]           │
│ 9. Automated Testing & Docker                                                [██████]       │
│ 10. Blue Book Documentation                                                      [████████] │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.6 System Analysis (Functional, Structural, and Behavioral Models)

System analysis provides formal object-oriented and structural models representing system capabilities, entity relationships, and temporal interaction lifecycles.

### 3.6.1 Functional Model: Use Case Diagram & Specifications

The Use Case model defines interactions between external human/machine actors and system capabilities:
- **Actors**:
  1. `External Core Banking / Webhook`: Machine actor submitting live transaction payloads via API.
  2. `SOC Fraud Analyst`: Human security operator monitoring live transaction feeds, triaging alerts, inspecting single transactions, and investigating mule rings.
  3. `Compliance Officer`: Regulatory auditor reviewing TreeSHAP attributions, generating FCRA Adverse Action letters, and inspecting audit logs.
  4. `System Administrator`: Technical operator executing synthetic drift spikes, triggering federated learning rounds, managing API keys, and managing user accounts.

```
                               USE CASE DIAGRAM: FRAUDSHIELD AI

     ┌─────────────────┐                                                 ┌─────────────────┐
     │  Banking Core / │                                                 │   SOC Analyst   │
     │     Webhook     │                                                 │     Actor       │
     └────────┬────────┘                                                 └────────┬────────┘
              │                                                                   │
              │──► [UC-01: Ingest Transaction Payload]                           │
              │──► [UC-02: Synchronous Fraud Risk Scoring] ◄──────────────────────┤
              │                                                                   │
              │                                      [UC-03: View Live Stream] ◄──┤
              │                                      [UC-04: Single Txn Triage]◄──┤
              │                                      [UC-05: Inspect TreeSHAP] ◄──┤
              │                                      [UC-06: Investigate Mule] ◄──┤
              │                                                                   │
     ┌────────┴────────┐                                                 ┌────────┴────────┐
     │   Compliance    │                                                 │  System Admin   │
     │     Officer     │                                                 │     Actor       │
     └────────┬────────┘                                                 └────────┬────────┘
              │                                                                   │
              │──► [UC-07: Generate FCRA Adverse Action Letter]                  │
              │──► [UC-08: Audit Immutable Security Trail] ◄──────────────────────┤
              │──► [UC-09: Monitor Concept Drift Metrics]  ◄──────────────────────┤
              │                                                                   │
              │                                      [UC-10: Trigger FedAvg]   ◄──┤
              │                                      [UC-11: Inject Drift Spike]◄─┤
              │                                      [UC-12: Manage User RBAC] ◄──┘
```

---

### 3.6.2 Structural Model: Unified Class Diagram

The class diagram illustrates the object-oriented structure of the backend analytical engines, data schemas, and API gateway:

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│        TransactionPayload       │                 │         PredictionResult        │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ + domain: str                   │                 │ + transaction_id: str           │
│ + raw_features: dict            │                 │ + raw_probability: float        │
│ + timestamp: datetime           │                 │ + risk_score: float             │
│ + ip_address: Optional[str]     │                 │ + decision_tier: str            │
├─────────────────────────────────┤                 │ + is_fraud: bool                │
│ + validate_schema(): bool       │                 │ + latency_ms: float             │
│ + to_feature_vector(): ndarray  │                 └─────────────────────────────────┘
└───────────────┬─────────────────┘                                  ▲
                │                                                    │
                ▼                                                    │ generates
┌─────────────────────────────────┐                                  │
│        ModelEngineRegistry      │                                  │
├─────────────────────────────────┤                                  │
│ - model_heads: dict             │                                  │
│ - meta_learners: dict           │                                  │
│ - scalers: dict                 │                                  │
├─────────────────────────────────┤                                  │
│ + detect_domain(data): str      │                                  │
│ + predict(payload): Result ─────┼──────────────────────────────────┘
│ + get_model_metrics(): dict     │
└───────────────┬─────────────────┘
                │ delegates to
                ▼
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│        StackingEnsemble         │                 │         TreeSHAPExplainer       │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ - xgb_model: XGBClassifier      │                 │ - explainer: TreeExplainer      │
│ - lgb_model: LGBMClassifier     │                 │ - background_data: ndarray      │
│ - rf_model: RandomForestClass   │                 ├─────────────────────────────────┤
│ - meta_learner: LogisticRegress │                 │ + explain_instance(x): dict     │
├─────────────────────────────────┤                 │ + get_waterfall_plot(x): dict   │
│ + fit(X, y): void               │                 │ + map_fcra_reason_codes(): list │
│ + predict_proba(X): ndarray     │                 └─────────────────────────────────┘
└─────────────────────────────────┘
```

---

### 3.6.3 Behavioral Model: Sequence Diagram

The sequence diagram illustrates the temporal execution flow when a client or analyst submits a transaction for scoring, explainability, and graph lookup:

```
 Client / UI              FastAPI Gateway           ModelEngine           TreeSHAP           NetworkX Graph
      │                          │                       │                    │                     │
      │── POST /analyze (JSON) ─►│                       │                    │                     │
      │                          │── validate JWT/Auth ─►│                    │                     │
      │                          │── detect schema ─────►│                    │                     │
      │                          │                       │                    │                     │
      │                          │── predict_proba() ───►│                    │                     │
      │                          │                       │── L0 Base Predict ─│                     │
      │                          │                       │── L1 Meta Predict ─│                     │
      │                          │                       │◄─ raw prob (p) ────│                     │
      │                          │                       │                    │                     │
      │                          │── compute risk score ─│                    │                     │
      │                          │                       │── explain(x) ─────►│                     │
      │                          │                       │◄─ shap values (phi)│                     │
      │                          │                       │                    │                     │
      │                          │── check cycles/mule ────────────────────────────────────────────►│
      │                          │◄── return mule score & cycle flag ───────────────────────────────│
      │                          │                       │                    │                     │
      │                          │── compile JSON result │                    │                     │
      │◄── HTTP 200 (Risk, XAI) ─│                       │                    │                     │
```

---

*End of Chapter 3 — Requirement Gathering, Analysis and Planning*
"""

print("Chapter 3 generated successfully.")
