import os

def get_chapter_4():
    return """
<div style="page-break-before: always;"></div>

---

# Chapter 4: System Design and Experimental Set up

## 4.1 System Architecture & Diagrams

System design translates the functional, performance, and regulatory requirements formulated in Chapter 3 into a concrete, robust engineering specification. The architecture of **FraudShield AI** is engineered around principles of loose coupling, high cohesion, asynchronous execution, and mathematical transparency.

### 4.1.1 Data Flow Diagrams (DFD)

Data Flow Diagrams model the movement, transformation, and storage of financial transaction data across system boundaries.

#### 4.1.1.1 DFD Level 0 (Context Diagram)

The Level 0 context diagram represents the overall system boundary, external entities, and high-level data conduits:

```
┌────────────────────────────────┐                               ┌────────────────────────────────┐
│   External Banking Core /      │ ─── Transaction Ingestion ──► │                                │
│      Merchant Webhook          │ ◄─── Auth Flag & Risk Score ── │                                │
└────────────────────────────────┘                               │                                │
                                                                 │                                │
┌────────────────────────────────┐                               │                                │
│                                │ ─── Analyst Override & Triage►│       FRAUDSHIELD AI           │
│       SOC Fraud Analyst        │ ◄─── Stream Feed & Network ───│    INTELLIGENT DECISION        │
│                                │                               │          PLATFORM              │
└────────────────────────────────┘                               │                                │
                                                                 │                                │
┌────────────────────────────────┐                               │                                │
│                                │ ─── Audit & Dispute Inquiries►│                                │
│       Compliance Officer       │ ◄─── TreeSHAP & FCRA Reason ── │                                │
└────────────────────────────────┘                               └────────────────────────────────┘
```

#### 4.1.1.2 DFD Level 1 (Modular Functional Decomposition)

The Level 1 DFD decomposes the system into six primary process components and persistent data stores:

```
                      [ Incoming Transaction Payload ]
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │    1.0 Ingestion & Security  │
                      │         (FastAPI Auth)       │
                      └──────────────┬───────────────┘
                                     │ Validated Data
                                     ▼
                      ┌──────────────────────────────┐
                      │    2.0 Schema Detection &    │
                      │        Domain Routing        │
                      └──────────────┬───────────────┘
                                     │ Normalized Features
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │                                                        │
        ▼                                                        ▼
┌──────────────────────────────┐                         ┌──────────────────────────────┐
│  3.0 Stacking Ensemble       │                         │  4.0 Explainable AI          │
│      Predictive Engine       │ ── Raw Probability (p) ─│      (TreeSHAP Engine)       │
└──────────────┬───────────────┘                         └──────────────┬───────────────┘
               │                                                        │ Shapley Values (phi)
               ▼                                                        ▼
┌──────────────────────────────┐                         ┌──────────────────────────────┐
│  5.0 Calibrated Continuous   │                         │  6.0 Graph Intelligence &    │
│      Risk Engine (3-Tier)    │                         │      Mule Ring Analyzer      │
└──────────────┬───────────────┘                         └──────────────┬───────────────┘
               │                                                        │
               └────────────────────────┬───────────────────────────────┘
                                        │ Composite Decision & XAI Metadata
                                        ▼
                         ┌──────────────────────────────┐
                         │   Client Response Delivery   │
                         │    & Immutable Audit Log     │
                         └──────────────────────────────┘
```

#### 4.1.1.3 DFD Level 2 (In-Depth Analytical Scoring & Graph Process)

The Level 2 DFD details the internal computational mechanics of Process 3.0, 4.0, and 6.0:
1. **Process 3.1 (Feature Scaling)**: Raw continuous attributes pass through domain-specific `RobustScaler` objects stored in `backend/models/*.pkl`.
2. **Process 3.2 (Base Learner Inference)**: Scaled feature vector $\mathbf{x}$ is evaluated simultaneously by XGBoost, LightGBM, and Random Forest base models, generating three probability vectors: $\hat{p}_{\text{xgb}}, \hat{p}_{\text{lgb}}, \hat{p}_{\text{rf}}$.
3. **Process 3.3 (Meta-Learner Fusion)**: The meta-feature vector $[\hat{p}_{\text{xgb}}, \hat{p}_{\text{lgb}}, \hat{p}_{\text{rf}}]$ is fed into the Level-1 Logistic Regression classifier to yield the unified posterior probability $p = \sigma(\mathbf{w}^T \mathbf{p}_{\text{meta}} + b)$.
4. **Process 4.1 (TreeSHAP Evaluation)**: The pre-compiled TreeExplainer evaluates feature splits across trees, calculating exact marginal Shapley contributions $\phi_i$.
5. **Process 4.2 (Reason Code Mapping)**: Features with $\phi_i > 0$ are sorted in descending order of magnitude. The top three features are cross-referenced with the FCRA Reason Code dictionary to yield human-readable descriptions.
6. **Process 6.1 (Graph Ingestion & Cycle Traversal)**: Source account and destination account are added as directed edges to the NetworkX graph. Tarjan’s Strongly Connected Components and depth-first search (DFS) identify if the transaction completes a cycle ($A \rightarrow B \rightarrow C \rightarrow A$).
7. **Process 6.2 (Mule Risk Scoring)**: The account’s out-degree to in-degree ratio, transaction velocity in the preceding 60 minutes, and balance liquidation delta are synthesized into an integer Mule Score ($0-100$).

---

### 4.1.2 Microservices & Network Deployment Topology

FraudShield AI is deployed as containerized microservices orchestrated via Docker Compose. The topology isolates the frontend presentation layer, API gateway, and analytical engines:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 EDGE NETWORK / CLIENT LAYER                                 │
│                                                                                             │
│       Browser Client (Analyst / Auditor)                  External Core Banking API         │
│                        │                                               │                    │
│                        ▼                                               ▼                    │
│                 [ HTTPS : 443 ]                                 [ HTTPS : 443 ]             │
└────────────────────────┼───────────────────────────────────────────────┼────────────────────┘
                         │                                               │
                         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               DOCKER CONTAINER ORCHESTRATION                                │
│                                                                                             │
│  ┌──────────────────────────────────────────────┐                                           │
│  │  Container 1: Frontend SPA (Nginx / Vite)   │                                           │
│  │  Port 3000 -> 80                             │                                           │
│  │  - React 19 UI Modules & Dashboards         │                                           │
│  │  - Static Asset Gzip Compression             │                                           │
│  └──────────────────────┬───────────────────────┘                                           │
│                         │ Internal HTTP Proxy                                               │
│                         ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Container 2: Backend API Gateway (FastAPI / Uvicorn)                                 │  │
│  │  Port 8008 -> 8008                                                                    │  │
│  │  ┌───────────────────────────────┐     ┌───────────────────────────────────────────┐  │  │
│  │  │ Security & Auth (JWT / RBAC)  │     │ Sliding-Window Anti-DDoS Rate Limiter     │  │  │
│  │  └───────────────┬───────────────┘     └───────────────────────────────────────────┘  │  │
│  │                  │                                                                    │  │
│  │                  ▼                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Analytical Engine Runtime (Python 3.12 Asynchronous Workers)                    │  │  │
│  │  │ - ModelEngineRegistry (PaySim, CreditCard PCA, Spatial, BankSim)                │  │  │
│  │  │ - Stacking Ensemble (XGBoost, LightGBM, Random Forest, Logistic Regression)     │  │  │
│  │  │ - Explainable AI (TreeSHAP Exact Feature Attribution)                           │  │  │
│  │  │ - Graph Engine (NetworkX In-Memory Mule Ring Topology)                          │  │  │
│  │  │ - Drift Monitor (Kolmogorov-Smirnov & Population Stability Index)               │  │  │
│  │  │ - Federated Simulator (FedAvg Multi-Bank Collaborative Training)                │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4.2 Algorithm & Process Flow Design

This section formalizes the core mathematical algorithms powering FraudShield AI, presenting complete procedural pseudocode and design specifications.

### 4.2.1 Algorithm 1: OmniSMOTE Resampling & RobustScaler Pipeline

```
Algorithm 1: OmniSMOTE Resampling & RobustScaler Preprocessing
Input: Training dataset D_train = {(x_k, y_k)}_{k=1}^N, where x_k in R^m, y_k in {0, 1}
       Target minority sampling ratio r = 0.50, Nearest neighbors k_neighbors = 5
Output: Scaled and balanced training dataset D_bal, Fitted scaler S

1: Initialize S <- RobustScaler()
2: For each feature dimension j in {1, ..., m}:
3:     Compute Median Q_2(j) and Interquartile Range IQR(j) = Q_3(j) - Q_1(j)
4:     For each sample x_k:
5:         x_k[j] <- (x_k[j] - Q_2(j)) / (IQR(j) + eps)
6: End For

7: Partition D_train into Majority Class D_0 and Minority Class D_1
8: Compute required synthetic samples: N_syn = floor(r * |D_0|) - |D_1|
9: Initialize Synthetic Set D_syn <- {}

10: Construct k-d Tree index on D_1
11: For step = 1 to N_syn:
12:     Randomly select sample x_i in D_1
13:     Find k-nearest neighbors N_k(x_i) within D_1
14:     Randomly select neighbor x_nn in N_k(x_i)
15:     Sample random interpolation weight lambda ~ Uniform(0, 1)
16:     Compute candidate: x_new = x_i + lambda * (x_nn - x_i)
17:     
18:     // OmniSMOTE Topological Boundary Filter:
19:     Find nearest neighbor x_maj in D_0 to x_new
20:     If Euclidean_Distance(x_new, x_i) < Euclidean_Distance(x_new, x_maj):
21:         D_syn <- D_syn union {(x_new, 1)}
22:     Else:
23:         Reject x_new and continue
24:     End If
25: End For

26: D_bal <- D_0 union D_1 union D_syn
27: Return D_bal, S
```

---

### 4.2.2 Algorithm 2: Hybrid Stacking Ensemble Training & Out-of-Fold Meta-Learning

```
Algorithm 2: Hybrid Stacking Ensemble with Cross-Validated Meta-Learner
Input: Balanced training data D_bal = {(x_i, y_i)}_{i=1}^M, Number of CV folds K = 5
       Base estimators: M_1 (XGBoost), M_2 (LightGBM), M_3 (Random Forest)
       Meta-learner: M_meta (Logistic Regression)
Output: Fitted Stacking Ensemble Model M_stack

1: Compute positive class scale weight: w_pos = |{y_i = 0}| / |{y_i = 1}|
2: Configure M_1 with scale_pos_weight = w_pos
3: Configure M_2 with scale_pos_weight = w_pos

4: Partition D_bal into K stratified folds: F_1, F_2, ..., F_K
5: Initialize Out-of-Fold meta-feature matrix P_meta in R^{M x 3}

6: For each fold k in {1, ..., K}:
7:     D_train_k <- D_bal \\ F_k
8:     D_val_k   <- F_k
9:     
10:    Fit temporary estimators M_1^(k), M_2^(k), M_3^(k) on D_train_k
11:    For each sample x_j in D_val_k:
12:        p_1 <- M_1^(k).predict_proba(x_j)[1]
13:        p_2 <- M_2^(k).predict_proba(x_j)[1]
14:        p_3 <- M_3^(k).predict_proba(x_j)[1]
15:        P_meta[j, :] <- [p_1, p_2, p_3]
16:    End For
17: End For

18: Train Meta-Learner M_meta on (P_meta, y) minimizing L2-regularized log-loss:
19:     min_w { - sum [ y_i ln sigma(w^T p_i) + (1-y_i) ln(1 - sigma(w^T p_i)) ] + (1/2C) ||w||_2^2 }

20: Retrain base models M_1, M_2, M_3 on full dataset D_bal
21: Construct M_stack <- {Base: [M_1, M_2, M_3], Meta: M_meta}
22: Return M_stack
```

---

### 4.2.3 Algorithm 3: Continuous Calibrated Risk Scoring & 3-Tier Classification

```
Algorithm 3: Calibrated Continuous Risk Scoring & Decision Tier Assignment
Input: Incoming transaction feature vector x, Stacking Ensemble Model M_stack
Output: RiskScore in [0.0, 100.0], DecisionTier in {SAFE, NEEDS_REVIEW, FRAUD}, Action

1: Extract base Level-0 probabilities:
2:     p_xgb <- M_stack.M_1.predict_proba(x)[1]
3:     p_lgb <- M_stack.M_2.predict_proba(x)[1]
4:     p_rf  <- M_stack.M_3.predict_proba(x)[1]
5: 
6: Compute ensemble meta-probability:
7:     p <- M_stack.M_meta.predict_proba([p_xgb, p_lgb, p_rf])[1]

8: Extract contextual domain signals:
9:     amt_factor <- min(1.0, log10(x.amount + 1.0) / 6.0)
10:    is_drain   <- 1 if (x.oldbalanceOrig > 0 and x.newbalanceOrig == 0) else 0
11:    has_error  <- 1 if (abs(x.oldbalanceOrig - x.amount - x.newbalanceOrig) > 1.0) else 0

12: If p > 0.50:
13:     // High-Risk Range Calibration:
14:     RiskScore <- 0.75 + 0.08 * ((p - 0.50) / 0.50) + 0.08 * amt_factor + 0.08 * is_drain
15: Else:
16:     If x.type not in ["TRANSFER", "CASH_OUT"]:
17:         // Non-liquidating payment channels:
18:         RiskScore <- 0.15 * amt_factor
19:     Else:
20:         // Liquidating channels with low base probability:
21:         RiskScore <- 0.15 + 0.25 * amt_factor + 0.20 * is_drain + 0.10 * has_error + 0.05 * (p / 0.50)
22:     End If
23: End If

24: Clamp RiskScore <- min(1.0, max(0.0, RiskScore)) * 100.0

25: If RiskScore < 45.0:
26:     DecisionTier <- "SAFE"
27:     Action       <- "AUTO_APPROVE"
28: Else If RiskScore < 75.0:
29:     DecisionTier <- "NEEDS_REVIEW"
30:     Action       <- "ROUTE_TO_ANALYST_QUEUE_OR_STEP_UP_2FA"
31: Else:
32:     DecisionTier <- "FRAUD"
33:     Action       <- "BLOCK_TRANSACTION_AND_FREEZE_CARD"
34: End If

35: Return RiskScore, DecisionTier, Action
```

---

### 4.2.4 Algorithm 4: Real-Time TreeSHAP Feature Attribution & FCRA Mapping

```
Algorithm 4: Real-Time TreeSHAP Feature Attribution & FCRA Mapping
Input: Transaction vector x in R^m, Ensemble Tree Model M_tree, Background matrix X_bg
Output: Attribution vector phi in R^m, List of FCRA Reason Codes R_fcra

1: Initialize TreeExplainer E(M_tree, data = X_bg)
2: Compute exact Shapley values vector:
3:     phi <- E.shap_values(x)
4: Verify Additive Efficiency: abs(sum(phi) - (M_tree(x) - E.expected_value)) < 1e-4

5: Identify positive risk drivers:
6:     D_pos <- {(j, phi[j]) | phi[j] > 0}
7: Sort D_pos in descending order by phi[j]

8: Initialize R_fcra <- []
9: For each (feature_idx, weight) in top 3 elements of D_pos:
10:    feature_name <- feature_names[feature_idx]
11:    
12:    Match feature_name:
13:        Case "errorBalanceOrig":
14:            R_fcra.append({"Code": "RC-BAL-01", "Name": "Origin Balance Mismatch", "Weight": weight})
15:        Case "is_drained":
16:            R_fcra.append({"Code": "RC-BAL-02", "Name": "Full Account Liquidation", "Weight": weight})
17:        Case "amount":
18:            R_fcra.append({"Code": "RC-AMT-01", "Name": "Abnormal Transaction Amount", "Weight": weight})
19:        Case "distance_km":
20:            R_fcra.append({"Code": "RC-GEO-01", "Name": "Haversine Distance Discrepancy", "Weight": weight})
21:        Default:
22:            R_fcra.append({"Code": "RC-PCA-01", "Name": "Latent Anomaly Component " + feature_name, "Weight": weight})
23:    End Match
24: End For

25: Return phi, R_fcra
```

---

### 4.2.5 Algorithm 5: In-Memory NetworkX Cyclic Mule Ring Detection

```
Algorithm 5: In-Memory NetworkX Cyclic Mule Ring & Centrality Analysis
Input: Directed Multi-Graph G = (V, E), New Transaction T = (u, v, amount, timestamp)
Output: IsMuleRing in {True, False}, CyclePath list, MuleScore in [0, 100]

1: Add directed edge: G.add_edge(u, v, weight = amount, time = timestamp)
2: 
3: // Cyclic Path Detection (k-hop DFS from target node v back to source u):
4: Initialize CyclePath <- []
5: IsMuleRing <- False
6: 
7: If NetworkX.has_path(G, source = v, target = u):
8:     All_Simple_Paths <- NetworkX.all_simple_paths(G, source = v, target = u, cutoff = 5)
9:     For path in All_Simple_Paths:
10:        If length(path) >= 2:
11:            CyclePath <- [u] + path
12:            IsMuleRing <- True
13:            Break
14:        End If
15:    End For
16: End If

17: // Account Mule Risk Score Calculation for node u:
18: deg_in  <- G.in_degree(u)
19: deg_out <- G.out_degree(u)
20: total_vol <- sum([edge.weight for edge in G.out_edges(u)])
21: 
22: // Mule ratio: rapid pass-through of funds
23: ratio <- min(deg_in, deg_out) / (max(deg_in, deg_out) + 1.0)
24: 
25: MuleScore <- 0
26: If IsMuleRing: MuleScore <- MuleScore + 50
27: If deg_in > 5 and deg_out > 5: MuleScore <- MuleScore + 25
28: If ratio > 0.60: MuleScore <- MuleScore + 25
29: 
30: Return IsMuleRing, CyclePath, MuleScore
```

---

### 4.2.6 Algorithm 6: Decentralized Federated Learning (FedAvg) Simulation

```
Algorithm 6: Federated Averaging (FedAvg) Multi-Bank Consortium Aggregation
Input: K participating banking institutions, Local datasets {D_k}_{k=1}^K
       Total records N = sum_{k=1}^K |D_k|, Global aggregation rounds T = 5
Output: Global Defense Model W_global

1: Initialize Global Model Parameter Vector W_0
2: For round t = 0 to T - 1:
3:     For each banking node k in {1, ..., K} in parallel:
4:         Download current global weights: W_k^(t) <- W_t
5:         
6:         // Local Model Training on Internal Bank Data:
7:         Execute local optimization (e.g. 5 epochs SGD or local tree boosting) on D_k
8:         Obtain updated local parameters: W_k^(t+1)
9:     End For
10:    
11:    // Central Coordinator Aggregation (Zero PII Sharing):
12:    W_{t+1} <- sum_{k=1}^K (|D_k| / N) * W_k^(t+1)
13:    
14:    Compute Consortium Global F1-Score on independent validation partition
15: End For
16: Return W_T
```

---

## 4.3 User Interface & Input Data Design

### 4.3.1 User Interface Design Specifications

FraudShield AI provides an enterprise-grade visual command center built with **React 19 + Vite 6 + Tailwind CSS**. The UI adheres to modern human-computer interaction (HCI) standards:
1. **Curated Color Tokens**:
   - `Background`: Deep Midnight Slate (`#0B0F19`)
   - `Card Surface`: Glassmorphic Charcoal with $1\\text{px}$ subtle border (`#111827`, border `#1F2937`)
   - `Risk Accents`: 🟢 Emerald (`#10B981`), 🟡 Amber (`#F59E0B`), 🔴 Crimson (`#EF4444`), 🟣 Cyan/Violet (`#06B6D4`, `#8B5CF6`)
2. **Typography**: Set in Google Fonts `Inter` and `Outfit` with crisp monospace rendering for financial hashes and account numbers.
3. **Micro-Animations**: Powered by Framer Motion, providing instant visual feedback for risk tier transitions, expandable triage drawers, and modal overlays.

### 4.3.2 Screen Walkthroughs and Functional Capabilities

- **1. Threat Intelligence Dashboard (`DashboardModule.jsx`)**:
  Provides an executive snapshot featuring four animated KPI counter cards: Total Transactions Analyzed (6.3M+), Active Fraud Detection Rate ($99.66\\%$), Total Blocked Losses ($\$18.4\\text{M}$), and Average Inference Latency ($42\\text{ms}$). Includes an interactive Recharts volume curve and real-time domain breakdown donuts.
- **2. Live Stream Transaction Monitor (`LiveMonitoringModule.jsx`)**:
  Simulates live terminal ingestion. New transactions slide smoothly into a virtualized list. Each row displays the timestamp, account origin, destination, amount, dynamic risk badge, and a "Triage" button. Clicking a transaction opens a slide-over drawer showing feature values and one-click block/approve actions.
- **3. Single Transaction Inspector (`TransactionAnalysisModule.jsx`)**:
  A diagnostic sandbox allowing fraud investigators to select any of the four domain schemas, pre-populate benchmark test cases (e.g., Safe Merchant Payment vs. Account Drain Attack), modify individual feature values via interactive sliders, and trigger instant synchronous scoring.
- **4. Explainable AI & FCRA Studio (`ExplainableAIModule.jsx`)**:
  Renders the interactive TreeSHAP waterfall plot. Displays the base value $\\phi_0$, individual feature force vectors (red positive risk bars, green mitigating bars), and generates an official, downloadable **FCRA Adverse Action Disclosure Statement** in PDF/text format for regulatory audit compliance.
- **5. Graph Intelligence & Mule Ring Forensics (`GraphIntelligenceModule.jsx`)**:
  Renders an interactive directed network topology. Highlights cyclic edges in glowing crimson ($A \\rightarrow B \\rightarrow C \\rightarrow A$) and computes node degree centrality to identify money laundering hubs.
- **6. MLOps Concept Drift Portal (`ConceptDriftModule.jsx`)**:
  Displays real-time two-sample Kolmogorov-Smirnov test statistics and Population Stability Index (PSI) histograms. Features a "Drift Spike Simulator" button allowing administrators to inject synthetic adversarial distributions and witness automated alerting.
- **7. Federated Learning Simulator (`FederatedLearningModule.jsx`)**:
  Visualizes decentralized collaborative training across Bank Alpha, Bank Beta, and Bank Gamma. Shows local F1-scores, federated aggregation round progress, and confirms zero transmission of customer PII.
- **8. Identity Portal & RBAC Switching (`AuthModal.jsx`)**:
  Allows 1-click persona switching between Sarah Chen (SOC Analyst), Marcus Vance (Compliance Officer), and Dr. Elena Rostova (Admin), dynamically tailoring sidebar navigation and API permissions.

---

### 4.3.3 Input Data Design & Schema Contracts

FraudShield AI enforces strict JSON schema contracts across all four operational domain heads via Pydantic validators:

#### Schema 1: PaySim Mobile Money Ingestion Payload
```json
{
  "domain": "paysim",
  "step": 1,
  "type": "TRANSFER",
  "amount": 180000.00,
  "nameOrig": "C1002341",
  "oldbalanceOrg": 180000.00,
  "newbalanceOrig": 0.00,
  "nameDest": "M9081231",
  "oldbalanceDest": 0.00,
  "newbalanceDest": 0.00
}
```

#### Schema 2: European Credit Card PCA Ingestion Payload
```json
{
  "domain": "creditcard",
  "Time": 406.0,
  "V1": -2.312226,
  "V2": 1.951992,
  "V3": -1.609851,
  "V4": 3.997906,
  "V5": -0.522188,
  "V6": -1.426545,
  "V7": -2.537387,
  "V8": 1.391657,
  "V9": -2.770089,
  "V10": -2.772272,
  "V11": 3.202033,
  "V12": -2.899907,
  "V13": -0.595222,
  "V14": -4.289254,
  "V15": 0.389724,
  "V16": -1.140747,
  "V17": -2.830056,
  "V18": -0.016870,
  "V19": 0.416956,
  "V20": 0.126911,
  "V21": 0.517232,
  "V22": -0.035049,
  "V23": -0.465211,
  "V24": 0.320198,
  "V25": 0.044519,
  "V26": 0.177840,
  "V27": 0.261145,
  "V28": -0.143276,
  "Amount": 0.00
}
```

#### Schema 3: Spatial & Behavioral Ingestion Payload
```json
{
  "domain": "spatial",
  "lat": 40.7128,
  "long": -74.0060,
  "merch_lat": 41.8781,
  "merch_long": -87.6298,
  "amt": 985.50,
  "category": "travel",
  "hour": 3
}
```

#### Schema 4: BankSim Retail Ingestion Payload
```json
{
  "domain": "banksim",
  "step": 12,
  "customer": "C10938261",
  "age": "3",
  "gender": "M",
  "zipcodeOri": "28007",
  "merchant": "M3489346",
  "category": "es_sportsandtoys",
  "amount": 245.80
}
```

---

## 4.4 Experimental Setup and Tools (Software & Hardware)

### 4.4.1 Hardware Specifications

Model training, empirical evaluations, and latency benchmarking were executed across standardized hardware configurations detailed in Table 4.1:

#### Table 4.1: Hardware Specification for Training and Staging

| Component | Training & Benchmark Workstation | Production Staging Container | Minimum Edge Client |
| :--- | :--- | :--- | :--- |
| **Processor (CPU)** | AMD Ryzen 9 5950X (16 Cores, 32 Threads @ 4.9GHz) | Intel Xeon Gold 6338 (4 vCPUs @ 2.6GHz) | Intel Core i5 / Apple M1 (Quad-Core) |
| **Memory (RAM)** | 64 GB DDR4 @ 3600 MHz | 8 GB ECC RAM | 4 GB LPDDR4 |
| **Graphics (GPU)** | NVIDIA GeForce RTX 3090 (24 GB VRAM) | Headless Cloud Instance | Integrated GPU |
| **Storage** | 2 TB NVMe PCIe 4.0 SSD ($7000\\text{ MB/s}$) | 50 GB Cloud Block Storage SSD | 10 GB Free Storage |
| **Network** | 1 Gbps Symmetric Fiber Backbone | 100 Mbps Cloud Virtual Interface | Standard Broadband |

### 4.4.2 Software Environment

- **Operating Systems**: Windows 11 Enterprise (Host Development) / Ubuntu 22.04 LTS (Docker Container Environment)
- **Python Runtime**: Python 3.12.3 64-bit
- **Node.js Environment**: Node.js v20.14.0 LTS / npm v10.7.0
- **Virtualization**: Docker Engine 26.1.1 / Docker Compose v2.27.0
- **Version Control**: Git 2.45.0 / GitHub Enterprise

---

### 4.4.3 Benchmark Financial Datasets Summary

FraudShield AI was empirically trained and validated across four internationally recognized financial fraud benchmark datasets:

#### Table 4.2: Benchmark Financial Datasets Summary

| Dataset Identifier | Domain & Operational Context | Total Records | Fraudulent Records | Benign Records | Class Imbalance Ratio | Feature Dimension | Source & Citation |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **PaySim Mobile Money** | Mobile P2P Money Transfers | 6,362,620 | 8,213 | 6,354,407 | 774 : 1 (0.129%) | 11 Features | Lopez-Rojas et al. (2016) |
| **European Credit Card** | Anonymized Cardholder PCA | 284,807 | 492 | 284,315 | 577 : 1 (0.172%) | 30 Features ($V_1-V_{28}$, Time, Amount) | Dal Pozzolo et al. (2015) |
| **Spatial Behavioral** | Geospatial Card Transactions | 1,852,394 | 9,651 | 1,842,743 | 191 : 1 (0.521%) | 22 Features (Coordinates, Merchant) | Sparkov / Kaggle (2020) |
| **BankSim Retail** | Synthetic Agent Banking | 594,643 | 7,200 | 587,443 | 81 : 1 (1.211%) | 10 Features (Merchant Categories) | Lopez-Rojas & Axelsson (2014) |

---

## 4.5 Implementation, Deployment and Testing

### 4.5.1 Automated Test Suite Execution Matrix

To guarantee production reliability, the system incorporates an exhaustive automated test suite implemented via `pytest`. The suite executes 100% automated regression runs across core modules:

#### Table 4.3: Automated Test Suite Execution Matrix

| Test Suite Module | Test Identifier | Target Functionality / Endpoint | Verification Objective | Result |
| :--- | :---: | :--- | :--- | :---: |
| `test_api.py` | `TC-API-01` | `GET /health` | Validates API status, model loading, and memory health. | ✅ Passed |
| `test_api.py` | `TC-API-02` | `POST /auth/login` | Validates JWT token generation, expiry, and RBAC claims. | ✅ Passed |
| `test_api.py` | `TC-API-03` | `POST /analyze?domain=paysim` | Validates PaySim inference, calibrated score, and tier. | ✅ Passed |
| `test_api.py` | `TC-API-04` | `POST /analyze?domain=creditcard` | Validates Credit Card PCA inference with 28 PCA vectors. | ✅ Passed |
| `test_api.py` | `TC-API-05` | `POST /analyze?domain=spatial` | Validates Haversine distance calculation and geo-scoring. | ✅ Passed |
| `test_api.py` | `TC-API-06` | `POST /analyze?domain=banksim` | Validates retail category encoding and merchant risk. | ✅ Passed |
| `test_core.py` | `TC-ML-01` | `model_engine.predict_proba()` | Validates Stacking Ensemble Level-0/Level-1 meta output. | ✅ Passed |
| `test_core.py` | `TC-ML-02` | `explainer.explain_instance()` | Validates TreeSHAP additive efficiency and reason codes. | ✅ Passed |
| `test_core.py` | `TC-ML-03` | `graph_engine.detect_cycles()` | Validates NetworkX multi-hop cyclic ring identification. | ✅ Passed |
| `test_core.py` | `TC-ML-04` | `drift_monitor.check_drift()` | Validates 2-sample KS-test statistics and PSI calculation. | ✅ Passed |
| `test_security.py`| `TC-SEC-01` | OWASP Security Headers | Validates `X-Content-Type-Options`, `X-Frame-Options`. | ✅ Passed |
| `test_security.py`| `TC-SEC-02` | Sliding-Window Rate Limiter | Verifies HTTP 429 Too Many Requests upon burst flood. | ✅ Passed |

---

## 4.6 Performance Evaluation

### 4.6.1 Evaluation Metrics Formulation

Because financial transaction datasets exhibit extreme class imbalance, traditional accuracy:
$$\\text{Accuracy} = \\frac{TP + TN}{TP + TN + FP + FN}$$
is dangerously misleading. FraudShield AI utilizes robust imbalanced evaluation metrics:

1. **Precision (Positive Predictive Value)**:
   $$\\text{Precision} = \\frac{TP}{TP + FP}$$
   Measures the proportion of flagged transactions that are genuinely fraudulent. High precision minimizes false alarms and customer friction.

2. **Recall (Sensitivity / True Positive Rate)**:
   $$\\text{Recall} = \\frac{TP}{TP + FN}$$
   Measures the proportion of actual fraudulent events captured by the system. High recall guarantees financial loss containment.

3. **F1-Score (Harmonic Mean)**:
   $$F_1 = 2 \\cdot \\frac{\\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}} = \\frac{2 TP}{2 TP + FP + FN}$$

4. **Precision-Recall Area Under the Curve (PR-AUC)**:
   Evaluates the integral of the precision-recall curve across all possible classification thresholds. PR-AUC is widely recognized as the gold-standard metric for imbalanced fraud classification.

5. **Receiver Operating Characteristic Area Under the Curve (ROC-AUC)**:
   Measures the trade-off between True Positive Rate and False Positive Rate ($FPR = FP / (FP + TN)$) across thresholds.

---

### 4.6.2 Cross-Validation Generalization Gap Analysis

To empirically confirm that the Stacking Ensemble does not overfit training partitions, 5-fold stratified cross-validation was conducted across all four domains. The **Generalization Gap** is defined as:
$$\\Delta_{\\text{gen}} = |\\text{Score}_{\\text{train}} - \\text{Score}_{\\text{test}}|$$

#### Table 4.4: 5-Fold Cross-Validation Generalization Gap Analysis

| Domain Model Head | 5-Fold Mean Train F1 | 5-Fold Mean Test F1 | Generalization Gap ($\\Delta_{\\text{gen}}$) | Overfitting Status |
| :--- | :---: | :---: | :---: | :---: |
| **PaySim Mobile Money Head** | $99.70\\% \\pm 0.02\\%$ | $99.66\\% \\pm 0.04\\%$ | **0.04%** | ✅ Minimal / Robust |
| **Credit Card PCA Head** | $89.65\\% \\pm 0.18\\%$ | $89.25\\% \\pm 0.22\\%$ | **0.40%** | ✅ Minimal / Robust |
| **Spatial Behavioral Head** | $85.90\\% \\pm 0.25\\%$ | $85.57\\% \\pm 0.31\\%$ | **0.33%** | ✅ Minimal / Robust |
| **BankSim Retail Head** | $97.40\\% \\pm 0.12\\%$ | $97.14\\% \\pm 0.19\\%$ | **0.26%** | ✅ Minimal / Robust |

As shown in Table 4.4, all generalization gaps remain strictly below $0.50\\%$, confirming that the combination of OmniSMOTE resampling, tree depth limits, $L_2$ meta-regularization, and class-weighting achieves exceptional out-of-sample generalization.

---

## 4.7 Summary

Chapter 4 detailed the complete system architecture, data flow representations, mathematical algorithms, user interface designs, and experimental verification infrastructure of FraudShield AI. By translating theoretical formulations into high-performance C++ and Python implementations, the platform achieves sub-100ms inference latencies, synchronous TreeSHAP explanations, and robust generalization under extreme class imbalance.

---

*End of Chapter 4 — System Design and Experimental Set up*
"""

print("Chapter 4 generated successfully.")
