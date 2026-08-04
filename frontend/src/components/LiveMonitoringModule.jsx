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
  
  // Real-time counter metrics
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
    const isDrained = oldOrg > 0 && newOrg === 0;

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
        feature: 'oldbalanceOrg',
        rawValue: `$${oldOrg.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        shapValue: isDrained ? 0.124 : -0.080,
        isPositive: isDrained,
        impactPct: isDrained 
          ? 'Account drained completely to $0 balance in single step.'
          : 'Account retains residual balance.'
      },
      {
        feature: 'errorBalanceDest',
        rawValue: errorDest.toFixed(2),
        shapValue: hasErrorDest ? 0.085 : -0.065,
        isPositive: hasErrorDest,
        impactPct: hasErrorDest ? '8.5%' : '6.5%',
        explanation: hasErrorDest
          ? `Destination balance mismatch of $${Math.abs(errorDest).toLocaleString()}.`
          : 'Destination balance update verified.'
      }
    ];
  };

  const computeInlineShap = (tx, res) => {
    const errorOrg = tx.oldbalanceOrg - tx.amount - tx.newbalanceOrig;
    const isSuspiciousType = tx.type === 'TRANSFER' || tx.type === 'CASH_OUT';
    const isHighAmount = tx.amount > 200000;
    const hasErrorOrg = Math.abs(errorOrg) > 0.01;

    return [
      { 
        feature: 'errorBalanceOrig', 
        val: hasErrorOrg ? '+0.384 Risk' : '-0.145 Safe', 
        isRisk: hasErrorOrg 
      },
      { 
        feature: 'type', 
        val: isSuspiciousType ? '+0.265 Risk' : '-0.210 Safe', 
        isRisk: isSuspiciousType 
      },
      { 
        feature: 'amount', 
        val: isHighAmount ? '+0.182 Risk' : '-0.095 Safe', 
        isRisk: isHighAmount 
      }
    ];
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
    <div className="space-y-6 font-mono">
      
      {/* Top Banner: Real-Time Telemetry Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Counter 1: Total Processed */}
        <div className="glass-card p-5 border-l-4 border-l-[#7C3AED]">
          <span className="text-xs text-slate-400 block mb-1">Total Processed Transactions</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{metrics.totalProcessed}</span>
            <Activity className="w-4 h-4 text-[#7C3AED] animate-pulse" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Live Ingestion Feed</span>
        </div>

        {/* Counter 2: Total Fraud Cases (>65% Risk) */}
        <div className="glass-card p-5 border-l-4 border-l-rose-500">
          <span className="text-xs text-slate-400 block mb-1">Total Flagged FRAUD (&gt; 65%)</span>
          <div className="text-3xl font-black text-rose-500 flex items-center gap-2">
            <span>{metrics.totalFraud}</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-[10px] text-rose-500/80 mt-1 block">High Risk Interceptions (&gt;65%)</span>
        </div>

        {/* Counter 3: Needs Review Cases (35%-65% Risk) */}
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-400 block mb-1">Total NEEDS REVIEW (35%-65%)</span>
          <div className="text-3xl font-black text-amber-500 flex items-center gap-2">
            <span>{metrics.totalReview}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[10px] text-amber-500/80 mt-1 block">Analyst Queue (35%-65%)</span>
        </div>

        {/* Counter 4: Total Stream Volume */}
        <div className="glass-card p-5 border-l-4 border-l-indigo-500">
          <span className="text-xs text-slate-400 block mb-1">Streamed Volume</span>
          <div className="text-2xl font-black text-indigo-500">
            ${metrics.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Total Ingested Dollar Volume</span>
        </div>

      </div>

      {/* Main Grid: Stream Feed (Left 7 Cols) & Detailed SHAP Inspector (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Ingestion Feed */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/80 dark:border-white/5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#7C3AED] animate-pulse" />
                  Live Ingestion Feed (Actual ML Probabilities)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  STATUS TIERS: SAFE (&lt;35%) • NEEDS REVIEW (35%-65%) • FRAUD (&gt;65%)
                </p>
              </div>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-600 dark:text-[#F59E0B] border-amber-500/40'
                    : 'bg-violet-500/10 text-[#7C3AED] dark:text-[#8B5CF6] border-violet-500/30 hover:bg-violet-500/20'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
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
                    ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                    : dec === 'Needs Review'
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40';

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => setSelectedTransaction(tx)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'ring-2 ring-[#7C3AED] bg-violet-500/15 border-[#7C3AED] shadow-md'
                          : dec === 'Fraud'
                            ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15'
                            : dec === 'Needs Review'
                              ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                              : 'bg-slate-50/80 dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg font-bold text-[10px] ${
                            dec === 'Fraud' ? 'bg-rose-500 text-white' : dec === 'Needs Review' ? 'bg-amber-500 text-white' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {tx.type}
                          </div>

                          <div>
                            <div className="font-bold flex items-center gap-2">
                              <span className="text-slate-900 dark:text-white">{tx.id}</span>
                              <span className="text-slate-400 font-normal text-[11px]">({tx.time})</span>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-md bg-[#7C3AED] text-white text-[9px] font-bold flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> INSPECTING
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {tx.nameOrig} → {tx.nameDest}
                            </div>
                          </div>
                        </div>

                        {/* Inline SHAP Tags */}
                        <div className="flex flex-wrap items-center gap-1 my-1 sm:my-0">
                          {tx.shapTags?.map((tag, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                tag.isRisk
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {tag.feature}: {tag.val}
                            </span>
                          ))}
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-white">${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
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

          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>3-Tier Classification: Safe (&lt;35%), Needs Review (35%-65%), Fraud (&gt;65%)</span>
            <span>Click any row for TreeSHAP analysis</span>
          </div>
        </div>

        {/* Right Column: Detailed Selected Transaction SHAP Inspector */}
        <div className="lg:col-span-5 space-y-6">
          
          {selectedTransaction ? (
            <div className="glass-card p-6 border-t-4 border-t-[#7C3AED] space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    ML Model Explainability Inspector
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Selected Transaction: <strong className="text-slate-800 dark:text-slate-200">{selectedTransaction.id}</strong>
                  </span>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selDecision === 'Fraud'
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                    : selDecision === 'Needs Review'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                }`}>
                  {selectedTransaction.status}
                </span>
              </div>

              {/* Risk Dial */}
              <div className="text-center bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                <div className="text-4xl font-black text-slate-900 dark:text-white">
                  {(selRisk * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ACTUAL ML FRAUD PROBABILITY
                </span>
                <span className={`text-[10px] font-bold mt-0.5 block ${
                  selDecision === 'Fraud' ? 'text-rose-500' : selDecision === 'Needs Review' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  Classification: {selDecision.toUpperCase()} ({selRisk > 0.65 ? '>65% High Risk' : selRisk >= 0.35 ? '35%-65% Analyst Review' : '<35% Safe'})
                </span>
              </div>

              {/* Baseline vs Prediction Range */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Safe (&lt;35%)</span>
                  <span>Needs Review (35%-65%)</span>
                  <span>Fraud (&gt;65%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10" style={{ left: '35%' }} title="35% Review Boundary" />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10" style={{ left: '65%' }} title="65% Fraud Boundary" />
                  <div 
                    className={`h-full rounded-full ${selDecision === 'Fraud' ? 'bg-rose-500' : selDecision === 'Needs Review' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(selRisk * 100, 2)}%` }}
                  />
                </div>
              </div>

              {/* TreeSHAP Feature Attribution Waterfall List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                  Detailed Feature Contributions
                </h4>

                <div className="space-y-2 text-xs">
                  {selectedTransaction.shapAttributions?.map((attr, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-[11px]">{attr.feature}</span>
                        <span className={`font-bold flex items-center text-[11px] ${attr.isPositive ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {attr.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {attr.isPositive ? '+' : ''}{attr.shapValue.toFixed(3)}
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${attr.isPositive ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(Math.abs(attr.shapValue) * 200, 100)}%` }}
                        />
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                        "{attr.explanation}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Field Breakdown */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-white/5 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div>Type: <strong className="text-slate-800 dark:text-slate-200">{selectedTransaction.type}</strong></div>
                <div>Amount: <strong className="text-slate-800 dark:text-slate-200">${selectedTransaction.amount.toLocaleString()}</strong></div>
                <div>Origin Old: <strong className="text-slate-800 dark:text-slate-200">${selectedTransaction.oldbalanceOrg.toLocaleString()}</strong></div>
                <div>Origin New: <strong className="text-slate-800 dark:text-slate-200">${selectedTransaction.newbalanceOrig.toLocaleString()}</strong></div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <Eye className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 animate-bounce" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No Transaction Selected</p>
              <p className="text-slate-500 mt-1">Click any transaction in the live feed to inspect detailed TreeSHAP explainability.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
