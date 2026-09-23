export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8008';

export function getAuthHeaders() {
  const token = localStorage.getItem('fs_access_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchWithAuth(url, options = {}) {
  const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const headers = {
    ...options.headers,
    ...getAuthHeaders()
  };
  return fetch(finalUrl, { ...options, headers });
}


export const DATASET_METADATA = {
  paysim: {
    id: 'paysim',
    name: 'PaySim Mobile Money & P2P',
    kaggleSlug: 'ealaxi/paysim1',
    recordCount: '6,362,620',
    fraudCount: '8,213',
    fraudRate: '0.13%',
    baselineF1: '99.40%',
    optimizedF1: '99.66%',
    precision: '100.0%',
    recall: '99.33%',
    threshold: '0.7500',
    riskDrivers: ['errorBalanceOrig', 'errorBalanceDest', 'type (TRANSFER/CASH_OUT)', 'is_high_amount_transfer'],
    description: 'Simulated P2P mobile money transaction dataset derived from real African mobile money logs.'
  },
  creditcard: {
    id: 'creditcard',
    name: 'European Credit Card PCA',
    kaggleSlug: 'mlg-ulb/creditcardfraud',
    recordCount: '284,807',
    fraudCount: '492',
    fraudRate: '0.17%',
    baselineF1: '80.85%',
    optimizedF1: '89.25%',
    precision: '94.32%',
    recall: '84.69%',
    threshold: '0.7500',
    riskDrivers: ['V14 (PCA Anomaly)', 'V17 (PCA Anomaly)', 'V12 (PCA Vector)', 'Amount ($)'],
    description: 'Anonymized European cardholder transactions featuring 28 mathematical PCA transformation vectors.'
  },
  spatial: {
    id: 'spatial',
    name: 'Spatial & Behavioral Credit Card',
    kaggleSlug: 'kartik2112/fraud-detection',
    recordCount: '1,852,394',
    fraudCount: '9,651',
    fraudRate: '0.52%',
    baselineF1: '81.10%',
    optimizedF1: '85.57%',
    precision: '90.53%',
    recall: '81.12%',
    threshold: '0.7500',
    riskDrivers: ['distance_km (Haversine)', 'amt ($)', 'hour_of_day', 'category'],
    description: 'Geographical credit card dataset analyzing Haversine distance between cardholder and merchant.'
  },
  banksim: {
    id: 'banksim',
    name: 'BankSim Retail Merchant Banking',
    kaggleSlug: 'ealaxi/banksim1',
    recordCount: '1,000',
    fraudCount: '86',
    fraudRate: '8.60%',
    baselineF1: '94.12%',
    optimizedF1: '97.14%',
    precision: '94.44%',
    recall: '100.0%',
    threshold: '0.7500',
    riskDrivers: ['es_tech (Tech Merchant)', 'es_hotelservices (Hotel Merchant)', 'es_sportsandtoys', 'amount ($)'],
    description: 'Agent-based retail banking simulator tracking customer merchant categories and spending patterns.'
  }
};

export const PAYSIM_LEGIT_SAMPLES = [
  { step: 1, type: 'PAYMENT', amount: 98.50, nameOrig: 'C1231006815', oldbalanceOrg: 1700.0, newbalanceOrig: 1601.50, nameDest: 'M1979787155', oldbalanceDest: 0.0, newbalanceDest: 0.0, isFraud: 0 },
  { step: 2, type: 'PAYMENT', amount: 32.10, nameOrig: 'C1028433774', oldbalanceOrg: 12000.0, newbalanceOrig: 11967.90, nameDest: 'M2007079779', oldbalanceDest: 0.0, newbalanceDest: 0.0, isFraud: 0 },
  { step: 3, type: 'CASH_IN', amount: 1500.0, nameOrig: 'C1566137702', oldbalanceOrg: 2500.0, newbalanceOrig: 4000.0, nameDest: 'C974983454', oldbalanceDest: 45000.0, newbalanceDest: 43500.0, isFraud: 0 },
  { step: 4, type: 'DEBIT', amount: 45.00, nameOrig: 'C2033524523', oldbalanceOrg: 4500.0, newbalanceOrig: 4455.0, nameDest: 'C38997010', oldbalanceDest: 1200.0, newbalanceDest: 1245.0, isFraud: 0 },
  { step: 5, type: 'TRANSFER', amount: 280.0, nameOrig: 'C1666544295', oldbalanceOrg: 1200.0, newbalanceOrig: 920.0, nameDest: 'C1823043282', oldbalanceDest: 500.0, newbalanceDest: 780.0, isFraud: 0 },
  { step: 6, type: 'PAYMENT', amount: 14.80, nameOrig: 'C1305486145', oldbalanceOrg: 560.0, newbalanceOrig: 545.20, nameDest: 'M4948455', oldbalanceDest: 0.0, newbalanceDest: 0.0, isFraud: 0 }
];

export const PAYSIM_FRAUD_SAMPLES = [
  { step: 1, type: 'TRANSFER', amount: 160537.86, nameOrig: 'C1300802870', oldbalanceOrg: 160537.86, newbalanceOrig: 0.0, nameDest: 'C1538398422', oldbalanceDest: 0.0, newbalanceDest: 0.0, isFraud: 1 },
  { step: 3, type: 'CASH_OUT', amount: 246853.57, nameOrig: 'C1141347701', oldbalanceOrg: 246853.57, newbalanceOrig: 0.0, nameDest: 'C1565118802', oldbalanceDest: 474823.39, newbalanceDest: 721676.96, isFraud: 1 },
  { step: 4, type: 'TRANSFER', amount: 522334.78, nameOrig: 'C2033524523', oldbalanceOrg: 522334.78, newbalanceOrig: 0.0, nameDest: 'C38997010', oldbalanceDest: 0.0, newbalanceDest: 0.0, isFraud: 1 }
];

export const PAYSIM_SAMPLES = [...PAYSIM_LEGIT_SAMPLES, ...PAYSIM_FRAUD_SAMPLES];

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend server unreachable at http://localhost:8008, using fallback model engine.', err);
  }
  return { status: 'offline', model_loaded: false };
}

export async function fetchRandomTransaction(fraudRate = 0.015) {
  try {
    const res = await fetch(`${API_BASE_URL}/transaction/random?fraud_rate=${fraudRate}`, { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API unreachable for random transaction, selecting sample PaySim record with class imbalance.');
  }
  
  // Real-world imbalanced client fallback
  const isFraud = Math.random() < fraudRate;
  const pool = isFraud ? PAYSIM_FRAUD_SAMPLES : PAYSIM_LEGIT_SAMPLES;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

function calculateCalibratedRisk(p, transactionDict) {
  const amount = parseFloat(transactionDict.amount || transactionDict.amt || 0.0);
  const oldBal = parseFloat(transactionDict.oldbalanceOrg || 0.0);
  const newBal = parseFloat(transactionDict.newbalanceOrig || 0.0);
  const txType = String(transactionDict.type || "").toUpperCase();
  const errorOrig = oldBal - amount - newBal;
  
  const amountLog = Math.log10(amount + 1);
  const amountFactor = Math.min(1.0, amountLog / 6.0); // maxes out at 1,000,000
  
  const decision = p > 0.5 ? "Block" : "Allow";
  
  if (decision === "Block") {
    const base = 0.75;
    const confFactor = 0.08 * ((p - 0.5) / 0.5);
    const amtContribution = 0.08 * amountFactor;
    const balContribution = (oldBal > 0 && newBal === 0) ? 0.08 : 0.0;
    const score = base + confFactor + amtContribution + balContribution;
    return Math.max(0.75, Math.min(0.99, score));
  } else {
    if (!["TRANSFER", "CASH_OUT"].includes(txType)) {
      const score = 0.15 * amountFactor;
      return Math.max(0.01, Math.min(0.44, score));
    } else {
      const base = 0.15;
      const amtContribution = 0.25 * amountFactor;
      const balContribution = (oldBal > 0 && newBal === 0) ? 0.20 : 0.0;
      const discContribution = Math.abs(errorOrig) > 0.01 ? 0.10 : 0.0;
      const modelContribution = 0.05 * (p / 0.5);
      const score = base + amtContribution + balContribution + discContribution + modelContribution;
      return Math.max(0.15, Math.min(0.74, score));
    }
  }
}


export async function analyzeTransaction(transaction, domain = 'paysim') {
  try {
    const res = await fetch(`${API_BASE_URL}/analyze?domain=${domain}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Backend API un-reachable for ${domain} analysis, executing local fallback evaluation.`);
  }

  // Fallback prediction using calibrated risk score calculation
  const amount = parseFloat(transaction.amount || transaction.amt) || 0;
  const oldbalanceOrg = parseFloat(transaction.oldbalanceOrg) || 0;
  const newbalanceOrig = parseFloat(transaction.newbalanceOrig) || 0;
  const type = transaction.type;

  const errorBalanceOrig = oldbalanceOrg - amount - newbalanceOrig;
  const isHighAmount = amount > 200000;
  const isSuspiciousType = type === 'TRANSFER' || type === 'CASH_OUT';
  const isDrained = oldbalanceOrg > 0 && newbalanceOrig === 0;

  const rawP = (isSuspiciousType && (isDrained || Math.abs(errorBalanceOrig) > 0.01)) ? 0.99 : 0.05;
  const riskScore = Math.round(calculateCalibratedRisk(rawP, transaction) * 10000) / 10000;

  let decision = 'Safe';
  let status = 'SAFE';

  if (riskScore >= 0.75) {
    decision = 'Fraud';
    status = 'FRAUD';
  } else if (riskScore >= 0.45) {
    decision = 'Needs Review';
    status = 'NEEDS_REVIEW';
  }

  return {
    domain,
    raw_prob: rawP,
    risk_score: riskScore,
    decision,
    status,
    is_fraud: decision === 'Fraud',
    explanations: [
      { feature: 'errorBalanceOrig', shap_value: Math.abs(errorBalanceOrig) > 0 ? 0.384 : -0.145 },
      { feature: 'amount', shap_value: isHighAmount ? 0.182 : -0.095 },
      { feature: 'type', shap_value: isSuspiciousType ? 0.265 : -0.210 },
      { feature: 'oldbalanceOrg', shap_value: isDrained ? 0.124 : -0.080 }
    ]
  };
}
