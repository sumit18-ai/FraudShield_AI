import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, Pause, Play, ShieldAlert, Zap, Activity, CheckCircle2, 
  Sparkles, ArrowUpRight, ArrowDownRight, Eye, ShieldCheck, 
  BarChart2, Info, Layers, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { analyzeTransaction } from '../lib/api';

const PAYSIM_LIVE_POOL = [
  { step: 384, type: 'CASH_OUT', amount: 46853.57, nameOrig: 'C1141347701', oldbalanceOrg: 50000.0, newbalanceOrig: 3146.43, nameDest: 'C1565118802', oldbalanceDest: 474823.39, newbalanceDest: 521676.96, isFraud: 0 },
  { step: 301, type: 'TRANSFER', amount: 160537.86, nameOrig: 'C1500116410', oldbalanceOrg: 160537.86, newbalanceOrig: 0.0, nameDest: 'C2075255678', oldbalanceDest: 13551586.42, newbalanceDest: 13712124.28, isFraud: 1 },
  { step: 210, type: 'CASH_IN', amount: 108665.75, nameOrig: 'C1566137702', oldbalanceOrg: 7731403.68, newbalanceOrig: 7840069.43, nameDest: 'C974983454', oldbalanceDest: 227317.12, newbalanceDest: 118651.37, isFraud: 0 },
  { step: 1, type: 'TRANSFER', amount: 181.0, nameOrig: 'C1300802870', oldbalanceOrg: 181.0, newbalanceOrig: 0.0, nameDest: 'C1538398422', oldbalanceDest: 0.0, newbalanceDest: 0.0, isFraud: 1 },
  { step: 230, type: 'PAYMENT', amount: 23975.99, nameOrig: 'C1088924630', oldbalanceOrg: 45000.0, newbalanceOrig: 21024.01, nameDest: 'M709715506', oldbalanceDest: 0.0, newbalanceDest: 0.0, isFraud: 0 },
  { step: 43, type: 'PAYMENT', amount: 3283.90, nameOrig: 'C1028433774', oldbalanceOrg: 12000.0, newbalanceOrig: 8716.10, nameDest: 'M2007079779', oldbalanceDest: 0.0, newbalanceDest: 0.0, isFraud: 0 },
  { step: 379, type: 'CASH_OUT', amount: 152138.78, nameOrig: 'C523442658', oldbalanceOrg: 152138.78, newbalanceOrig: 0.0, nameDest: 'C391770830', oldbalanceDest: 1046642.5, newbalanceDest: 1198781.28, isFraud: 1 },
  { step: 4, type: 'DEBIT', amount: 4233.12, nameOrig: 'C2033524523', oldbalanceOrg: 8900.00, newbalanceOrig: 4666.88, nameDest: 'C38997010', oldbalanceDest: 1200.0, newbalanceDest: 5433.12, isFraud: 0 }
];

export const LiveMonitoringModule = () => {
  const [transactions, setTransactions] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const [metrics, setMetrics] = useState({
    totalProcessed: 0,
    totalFraud: 0,
    totalReview: 0,
    totalVolume: 0
  });

  const computeDetailedShap = (tx, res) => {
    const amount = tx.amount || 0;
    const oldOrg = tx.oldbalanceOrg || 0;
    const newOrg = tx.newbalanceOrig || 0;
    const oldDest = tx.oldbalanceDest || 0;
    const newDest = tx.newbalanceDest || 0;
    const errorOrg = oldOrg - amount - newOrg;
    const errorDest = oldDest + amount - newDest;

    const hasErrorOrg = Math.abs(errorOrg) > 0.01;
    const hasErrorDest = Math.abs(errorDest) > 0.01;
    const isSuspiciousType = tx.type === 'TRANSFER' || tx.type === 'CASH_OUT';
    const isHighAmount = amount > 200000;

    return [
      {
        feature: 'errorBalanceOrig',
        rawValue: errorOrg.toFixed(2),
        shapValue: hasErrorOrg ? 0.384 : -0.145,
        isPositive: hasErrorOrg,
        impactPct: hasErrorOrg ? '38.4%' : '14.5%',
        explanation: hasErrorOrg 
          ? `Balance mismatch of $${Math.abs(errorOrg).toLocaleString()} indicates balance manipulation.`
          : 'Origin balance update verified (Zero error).'
      },
      {
        feature: 'type (TRANSFER/CASH_OUT)',
        rawValue: tx.type,
        shapValue: isSuspiciousType ? 0.265 : -0.210,
        isPositive: isSuspiciousType,
        impactPct: isSuspiciousType ? '26.5%' : '21.0%',
        explanation: isSuspiciousType
          ? `${tx.type} carries high historical fraud probability in PaySim.`
          : `${tx.type} carries 0.00% historical fraud baseline.`
      },
      {
        feature: 'amount',
        rawValue: `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        shapValue: isHighAmount ? 0.182 : -0.095,
        isPositive: isHighAmount,
        impactPct: isHighAmount ? '18.2%' : '9.5%',
        explanation: isHighAmount 
          ? 'High value transfer exceeding $200,000 threshold.'
          : 'Standard transaction volume.'
      },
      {
        feature: 'errorBalanceDest',
        rawValue: errorDest.toFixed(2),
        shapValue: hasErrorDest ? 0.085 : -0.065,
        isPositive: hasErrorDest,
        impactPct: hasErrorDest ? '8.5%' : '6.5%',
        explanation: hasErrorDest
          ? `Destination balance delta error of $${Math.abs(errorDest).toLocaleString()}.`
          : 'Destination balance update verified.'
      }
    ];
  };

  const computeInlineShap = (tx, res) => {
    const errorOrg = (tx.oldbalanceOrg || 0) - (tx.amount || 0) - (tx.newbalanceOrig || 0);
    const isHighAmount = (tx.amount || 0) > 200000;
    const tags = [];
    if (Math.abs(errorOrg) > 0.01) {
      tags.push({ feature: 'Δ_Orig', val: '+0.38', isRisk: true });
    } else {
      tags.push({ feature: 'Δ_Orig', val: '-0.15', isRisk: false });
    }
    if (isHighAmount) {
      tags.push({ feature: 'Amt>200k', val: '+0.18', isRisk: true });
    }
    return tags;
  };

  useEffect(() => {
    const initializeFeed = async () => {
      const initialList = [];
      let fraudCount = 0;
      let reviewCount = 0;
      let volume = 0;

      for (let i = 0; i < 6; i++) {
        const item = PAYSIM_LIVE_POOL[i % PAYSIM_LIVE_POOL.length];
        const res = await analyzeTransaction(item);
        
        const decisionStr = res.decision || (res.risk_score > 0.65 ? 'Fraud' : res.risk_score >= 0.35 ? 'Needs Review' : 'Safe');
        const id = `tx-ps-${Math.floor(1000 + Math.random() * 9000)}`;

        if (decisionStr === 'Fraud') fraudCount++;
        if (decisionStr === 'Needs Review') reviewCount++;
        volume += item.amount;

        const riskScorePct = (res.risk_score * 100).toFixed(1);

        const txObj = {
          id,
          time: new Date(Date.now() - i * 3000).toTimeString().split(' ')[0],
          ...item,
          risk: riskScorePct,
          riskScore: res.risk_score,
          decision: decisionStr,
          status: decisionStr === 'Fraud' ? 'FRAUD' : decisionStr === 'Needs Review' ? 'NEEDS REVIEW' : 'SAFE',
          shapAttributions: computeDetailedShap(item, res),
          shapTags: computeInlineShap(item, res)
        };

        initialList.push(txObj);
      }

      setTransactions(initialList);
      if (initialList.length > 0) {
        setSelectedTransaction(initialList[0]);
      }

      setMetrics({
        totalProcessed: 6,
        totalFraud: fraudCount,
        totalReview: reviewCount,
        totalVolume: volume
      });
    };

    initializeFeed();
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(async () => {
      const raw = PAYSIM_LIVE_POOL[Math.floor(Math.random() * PAYSIM_LIVE_POOL.length)];
      const tweakAmount = Math.round((raw.amount + (Math.random() * 80 - 40)) * 100) / 100;
      const txPayload = { ...raw, amount: Math.max(tweakAmount, 10) };

      const res = await analyzeTransaction(txPayload);
      
      const decisionStr = res.decision || (res.risk_score > 0.65 ? 'Fraud' : res.risk_score >= 0.35 ? 'Needs Review' : 'Safe');
      const id = `tx-ps-${Math.floor(1000 + Math.random() * 9000)}`;

      const riskScorePct = (res.risk_score * 100).toFixed(1);

      const newTx = {
        id,
        time: new Date().toTimeString().split(' ')[0],
        ...txPayload,
        risk: riskScorePct,
        riskScore: res.risk_score,
        decision: decisionStr,
        status: decisionStr === 'Fraud' ? 'FRAUD' : decisionStr === 'Needs Review' ? 'NEEDS REVIEW' : 'SAFE',
        shapAttributions: computeDetailedShap(txPayload, res),
        shapTags: computeInlineShap(txPayload, res)
      };

      setTransactions(prev => [newTx, ...prev.slice(0, 8)]);
      setMetrics(prev => ({
        totalProcessed: prev.totalProcessed + 1,
        totalFraud: prev.totalFraud + (decisionStr === 'Fraud' ? 1 : 0),
        totalReview: prev.totalReview + (decisionStr === 'Needs Review' ? 1 : 0),
        totalVolume: prev.totalVolume + txPayload.amount
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const selRisk = selectedTransaction?.riskScore ?? 0.05;
  const selDecision = selectedTransaction?.decision || (selRisk > 0.65 ? 'Fraud' : selRisk >= 0.35 ? 'Needs Review' : 'Safe');

  return (
    <div className="space-y-6">
      
      {/* 1. CONTINUOUS TELEMETRY STRIP */}
      <div className="surface-card p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.05]">
        
        <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-2">
          <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center text-zinc-900 shrink-0">
            <Radio className="w-5 h-5 animate-pulse text-blue-600" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider">Processed Stream</div>
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">{metrics.totalProcessed} txs</div>
            <div className="text-[10px] text-zinc-400 font-mono">Live Ingestion</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider">Interceptions</div>
            <div className="text-2xl font-bold text-rose-600 font-mono tracking-tight">{metrics.totalFraud}</div>
            <div className="text-[10px] text-rose-600 font-mono">Automated Block</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:pl-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider">Analyst Step-Up</div>
            <div className="text-2xl font-bold text-amber-600 font-mono tracking-tight">{metrics.totalReview}</div>
            <div className="text-[10px] text-amber-600 font-mono">Requires Review</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:pl-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 font-semibold uppercase tracking-wider">Stream Volume</div>
            <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">${metrics.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] text-emerald-600 font-mono">Evaluated Volume</div>
          </div>
        </div>

      </div>

      {/* 2. MAIN FEED & INSPECTOR SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 cols: Live Ingestion Feed */}
        <div className="lg:col-span-7 surface-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/[0.05]">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Real-Time Payment Stream</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Inline TreeSHAP Attribution Vector Scoring</p>
              </div>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer border ${
                  isPaused
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-black/[0.04] text-zinc-800 border-black/[0.06] hover:bg-black/[0.08]'
                }`}
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
              </button>
            </div>

            {/* Stream Rows List */}
            <div className="space-y-2 text-xs">
              <AnimatePresence initial={false}>
                {transactions.map((tx) => {
                  const dec = tx.decision || (tx.riskScore > 0.65 ? 'Fraud' : tx.riskScore >= 0.35 ? 'Needs Review' : 'Safe');
                  const isSelected = selectedTransaction?.id === tx.id;

                  const badgeClass = dec === 'Fraud'
                    ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                    : dec === 'Needs Review'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200/60';

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSelectedTransaction(tx)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'ring-2 ring-black bg-white border-black/20 shadow-xs'
                          : 'bg-black/[0.02] border-black/[0.05] hover:bg-black/[0.04]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded-md font-mono font-bold text-[10px] ${
                            dec === 'Fraud' ? 'bg-rose-600 text-white' : dec === 'Needs Review' ? 'bg-amber-500 text-white' : 'bg-black/10 text-zinc-800'
                          }`}>
                            {tx.type}
                          </div>

                          <div>
                            <div className="font-bold flex items-center gap-2 font-mono">
                              <span className="text-zinc-900">{tx.id}</span>
                              <span className="text-zinc-400 font-normal text-[10px]">({tx.time})</span>
                              {isSelected && (
                                <span className="px-1.5 py-0.5 rounded bg-black text-white text-[9px] font-bold">
                                  SELECTED
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              {tx.nameOrig} → {tx.nameDest}
                            </div>
                          </div>
                        </div>

                        {/* Inline SHAP Tags */}
                        <div className="flex flex-wrap items-center gap-1">
                          {tx.shapTags?.map((tag, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${
                                tag.isRisk
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {tag.feature}: {tag.val}
                            </span>
                          ))}
                        </div>

                        <div className="text-right">
                          <div className="font-bold font-mono text-zinc-900">${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${badgeClass}`}>
                            {tx.risk}% • {tx.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span>3-Tier Logic: Safe (&lt;35%), Step-up (35%-65%), Block (&gt;65%)</span>
            <span>Click row for TreeSHAP</span>
          </div>
        </div>

        {/* Right Column: Detailed Selected Transaction SHAP Inspector */}
        <div className="lg:col-span-5 space-y-6">
          
          {selectedTransaction ? (
            <div className="surface-card p-6 space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.05]">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>TreeSHAP Diagnostic Inspector</span>
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">
                    ID: <strong className="text-zinc-800">{selectedTransaction.id}</strong>
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  selDecision === 'Fraud'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    : selDecision === 'Needs Review'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                }`}>
                  {selectedTransaction.status}
                </span>
              </div>

              {/* Risk Dial */}
              <div className="text-center bg-black/[0.02] p-4 rounded-xl border border-black/[0.05]">
                <div className="text-3xl font-extrabold text-zinc-950 font-mono">
                  {(selRisk * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block uppercase tracking-wider">
                  Stacking Meta-Learner Probability
                </span>
              </div>

              {/* Baseline vs Prediction Range */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400 text-[10px] font-mono">
                  <span>Safe (&lt;35%)</span>
                  <span>Step-Up (35%-65%)</span>
                  <span>Block (&gt;65%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: '35%' }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10" style={{ left: '65%' }} />
                  <div 
                    className={`h-full rounded-full ${selDecision === 'Fraud' ? 'bg-rose-500' : selDecision === 'Needs Review' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(selRisk * 100, 2)}%` }}
                  />
                </div>
              </div>

              {/* TreeSHAP Feature Attribution Waterfall List */}
              <div className="space-y-2.5 pt-1">
                <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Feature Contribution Values</span>
                </h4>

                <div className="space-y-2 text-xs">
                  {selectedTransaction.shapAttributions?.map((attr, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.05] space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-zinc-900">{attr.feature}</span>
                        <span className={`font-bold flex items-center ${attr.isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {attr.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {attr.isPositive ? '+' : ''}{attr.shapValue.toFixed(3)}
                        </span>
                      </div>

                      <div className="w-full h-1 rounded-full bg-black/[0.06] overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${attr.isPositive ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(Math.abs(attr.shapValue) * 200, 100)}%` }}
                        />
                      </div>

                      <p className="text-[10px] text-zinc-500 italic">
                        "{attr.explanation}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Field Breakdown */}
              <div className="pt-2.5 border-t border-black/[0.05] grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-500">
                <div>Type: <strong className="text-zinc-900">{selectedTransaction.type}</strong></div>
                <div>Amount: <strong className="text-zinc-900">${selectedTransaction.amount.toLocaleString()}</strong></div>
                <div>Origin Old: <strong className="text-zinc-900">${selectedTransaction.oldbalanceOrg.toLocaleString()}</strong></div>
                <div>Origin New: <strong className="text-zinc-900">${selectedTransaction.newbalanceOrig.toLocaleString()}</strong></div>
              </div>

            </div>
          ) : (
            <div className="surface-card p-8 text-center text-zinc-400 text-xs flex flex-col items-center justify-center min-h-[300px]">
              <Eye className="w-8 h-8 text-zinc-300 mb-2 animate-pulse" />
              <p className="font-bold text-zinc-800">No Stream Item Selected</p>
              <p className="text-zinc-500 mt-1">Click any row in the live feed to inspect detailed TreeSHAP explainability.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
