const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8008';

// Fallback sample PaySim CSV records in case backend is starting up
const PAYSIM_SAMPLES = [
  {
    step: 1,
    type: 'CASH_OUT',
    amount: 181.0,
    nameOrig: 'C1388419439',
    oldbalanceOrg: 181.0,
    newbalanceOrig: 0.0,
    nameDest: 'C693256215',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
    isFraud: 1
  },
  {
    step: 1,
    type: 'TRANSFER',
    amount: 181.0,
    nameOrig: 'C1300802870',
    oldbalanceOrg: 181.0,
    newbalanceOrig: 0.0,
    nameDest: 'C1538398422',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
    isFraud: 1
  },
  {
    step: 2,
    type: 'PAYMENT',
    amount: 9839.64,
    nameOrig: 'C1231006815',
    oldbalanceOrg: 170136.0,
    newbalanceOrig: 160296.36,
    nameDest: 'M1979787155',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
    isFraud: 0
  },
  {
    step: 3,
    type: 'CASH_OUT',
    amount: 246853.57,
    nameOrig: 'C1141347701',
    oldbalanceOrg: 0.0,
    newbalanceOrig: 0.0,
    nameDest: 'C1565118802',
    oldbalanceDest: 474823.39,
    newbalanceDest: 721676.97,
    isFraud: 0
  },
  {
    step: 4,
    type: 'TRANSFER',
    amount: 522334.78,
    nameOrig: 'C2033524523',
    oldbalanceOrg: 522334.78,
    newbalanceOrig: 0.0,
    nameDest: 'C38997010',
    oldbalanceDest: 0.0,
    newbalanceDest: 0.0,
    isFraud: 1
  }
];

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

export async function fetchRandomTransaction() {
  try {
    const res = await fetch(`${API_BASE_URL}/transaction/random`, { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API un-reachable for random transaction, selecting sample PaySim CSV record.');
  }
  
  // Local fallback from PaySim sample dataset
  const randomIndex = Math.floor(Math.random() * PAYSIM_SAMPLES.length);
  return PAYSIM_SAMPLES[randomIndex];
}

export async function analyzeTransaction(transaction) {
  try {
    const res = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API un-reachable for analysis, executing local PaySim feature evaluation.');
  }

  // Local fallback model prediction based on PaySim feature engineering logic
  const amount = parseFloat(transaction.amount) || 0;
  const oldbalanceOrg = parseFloat(transaction.oldbalanceOrg) || 0;
  const newbalanceOrig = parseFloat(transaction.newbalanceOrig) || 0;
  const oldbalanceDest = parseFloat(transaction.oldbalanceDest) || 0;
  const newbalanceDest = parseFloat(transaction.newbalanceDest) || 0;
  const type = transaction.type;

  const errorBalanceOrig = oldbalanceOrg - amount - newbalanceOrig;
  const errorBalanceDest = oldbalanceDest + amount - newbalanceDest;
  const isHighAmount = amount > 200000;
  const isSuspiciousType = type === 'TRANSFER' || type === 'CASH_OUT';

  let riskScore = 0.05;

  if (isSuspiciousType) {
    if (oldbalanceOrg > 0 && newbalanceOrig === 0 && Math.abs(oldbalanceOrg - amount) < 1.0) {
      riskScore += 0.75; // Account emptied out completely
    }
    if (Math.abs(errorBalanceOrig) > 0.01) {
      riskScore += 0.15;
    }
    if (isHighAmount) {
      riskScore += 0.10;
    }
  } else {
    riskScore = 0.02;
  }

  riskScore = Math.min(Math.max(riskScore, 0.01), 0.99);
  const decision = riskScore >= 0.5 ? 'Block' : 'Allow';

  return {
    risk_score: Math.round(riskScore * 10000) / 10000,
    decision,
    is_fraud: decision === 'Block',
    explanations: [
      { feature: 'errorBalanceOrig', shap_value: Math.abs(errorBalanceOrig) > 0 ? 0.38 : 0.02 },
      { feature: 'amount', shap_value: isHighAmount ? 0.29 : 0.05 },
      { feature: 'type', shap_value: isSuspiciousType ? 0.22 : -0.15 },
      { feature: 'oldbalanceOrg', shap_value: oldbalanceOrg > 0 ? 0.11 : 0.01 }
    ]
  };
}
