import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Check, 
  ShieldAlert, 
  AlertTriangle, 
  Shield, 
  X,
  ArrowUpRight,
  Activity,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const RECENT_TRANSACTIONS = [
  {
    id: 'TXN782910',
    user: 'Rahul Verma',
    amount: '₹ 85,000',
    riskScore: 89,
    decision: 'BLOCKED',
    time: '10:30:21 AM',
    type: 'TRANSFER',
    signals: { ml: 0.89, anomaly: 0.92, graph: 0.88, behavioral: 0.75, rules: 0.90 },
    reason: 'Rapid velocity jump & Mule Ring connection DEV_MULE_RING_X'
  },
  {
    id: 'TXN782909',
    user: 'Sneha Iyer',
    amount: '₹ 12,450',
    riskScore: 45,
    decision: 'STEP-UP',
    time: '10:30:18 AM',
    type: 'CASH_OUT',
    signals: { ml: 0.45, anomaly: 0.52, graph: 0.20, behavioral: 0.60, rules: 0.30 },
    reason: 'New device login from IP outside usual geofence'
  },
  {
    id: 'TXN782908',
    user: 'Arjun Singh',
    amount: '₹ 2,350',
    riskScore: 18,
    decision: 'APPROVED',
    time: '10:30:14 AM',
    type: 'PAYMENT',
    signals: { ml: 0.18, anomaly: 0.12, graph: 0.05, behavioral: 0.15, rules: 0.10 },
    reason: 'Routine merchant transaction matching historic pattern'
  },
  {
    id: 'TXN782907',
    user: 'Neha Kapoor',
    amount: '₹ 99,999',
    riskScore: 91,
    decision: 'BLOCKED',
    time: '10:30:10 AM',
    type: 'TRANSFER',
    signals: { ml: 0.91, anomaly: 0.95, graph: 0.94, behavioral: 0.82, rules: 0.95 },
    reason: 'Account draining transfer immediately following password reset'
  },
  {
    id: 'TXN782906',
    user: 'Vikram Desai',
    amount: '₹ 1,250',
    riskScore: 12,
    decision: 'APPROVED',
    time: '10:30:08 AM',
    type: 'PAYMENT',
    signals: { ml: 0.12, anomaly: 0.08, graph: 0.02, behavioral: 0.10, rules: 0.05 },
    reason: 'Verified contactless retail checkout'
  },
];

const MULTI_SIGNALS = [
  { label: 'ML Stacking Ensemble', score: 0.89, color: '#2563EB' },
  { label: 'Anomaly Isolation Forest', score: 0.68, color: '#0284C7' },
  { label: 'NetworkX Collusion Graph', score: 0.81, color: '#10B981' },
  { label: 'Behavioral Velocity Check', score: 0.42, color: '#F59E0B' },
  { label: 'Static Compliance Rules', score: 0.35, color: '#EF4444' },
];

const RISK_BREAKDOWN = [
  { label: 'Stacking Ensemble (XGB+LGBM+RF)', percent: 40, color: '#2563EB', dotColor: 'bg-blue-600' },
  { label: 'RobustScaler Anomaly', percent: 20, color: '#0284C7', dotColor: 'bg-sky-600' },
  { label: 'NetworkX Graph Collusion', percent: 20, color: '#10B981', dotColor: 'bg-emerald-600' },
  { label: 'Behavioral Velocity Score', percent: 10, color: '#F59E0B', dotColor: 'bg-amber-500' },
  { label: 'Compliance Rule Violations', percent: 10, color: '#EF4444', dotColor: 'bg-rose-500' },
];

const SYSTEM_ACTIVITIES = [
  {
    id: 1,
    title: 'High-risk transfer intercepted ($85,000)',
    time: '10:30:21 AM',
    color: 'bg-rose-500',
    ring: 'ring-rose-100',
    type: 'alert'
  },
  {
    id: 2,
    title: 'Behavioral profile baseline recalibrated',
    time: '10:29:58 AM',
    color: 'bg-emerald-500',
    ring: 'ring-emerald-100',
    type: 'behavior'
  },
  {
    id: 3,
    title: 'Concept drift KS-test passed (PSI < 0.05)',
    time: '10:28:45 AM',
    color: 'bg-blue-500',
    ring: 'ring-blue-100',
    type: 'drift'
  },
  {
    id: 4,
    title: 'Federated model weights synchronized',
    time: '10:27:30 AM',
    color: 'bg-indigo-500',
    ring: 'ring-indigo-100',
    type: 'federated'
  },
];

export const DashboardModule = ({ onNavigateTab, searchQuery = '' }) => {
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [riskGaugeValue, setRiskGaugeValue] = useState(72);

  const filteredTransactions = RECENT_TRANSACTIONS.filter((txn) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      txn.id.toLowerCase().includes(q) ||
      txn.user.toLowerCase().includes(q) ||
      txn.amount.toLowerCase().includes(q) ||
      txn.decision.toLowerCase().includes(q)
    );
  });

  const needleAngle = -90 + (riskGaugeValue / 100) * 180;

  return (
    <div className="space-y-6">
      
      {/* 1. CONTINUOUS TELEMETRY STRIP (All 4 KPIs blend into 1 seamless panel) */}
      <div className="surface-card p-6 rounded-2xl border border-black/[0.05] grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.05]">
        
        {/* Total Transactions */}
        <div className="flex items-center gap-4 pt-2 sm:pt-0 sm:pl-2">
          <div className="w-11 h-11 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Total Ingested
            </div>
            <div className="text-2xl font-bold text-zinc-950 tracking-tight font-mono">
              1,248,492
            </div>
            <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
              <span>↑</span> 12.5% vs last 24h
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="flex items-center gap-4 pt-2 sm:pt-0 sm:pl-6">
          <div className="w-11 h-11 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Clean &amp; Authorized
            </div>
            <div className="text-2xl font-bold text-zinc-950 tracking-tight font-mono">
              1,184,230
            </div>
            <div className="text-[11px] font-medium text-zinc-500 mt-0.5">
              94.85% Auto-cleared
            </div>
          </div>
        </div>

        {/* Step-up Verify */}
        <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-6">
          <div className="w-11 h-11 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
            <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Step-up Challenge
            </div>
            <div className="text-2xl font-bold text-zinc-950 tracking-tight font-mono">
              45,231
            </div>
            <div className="text-[11px] font-medium text-amber-700 mt-0.5">
              3.62% MFA Required
            </div>
          </div>
        </div>

        {/* Blocked / Alerts */}
        <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-6">
          <div className="w-11 h-11 rounded-xl bg-rose-50/80 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Blocked / Isolated
            </div>
            <div className="text-2xl font-bold text-rose-600 tracking-tight font-mono">
              19,031
            </div>
            <div className="text-[11px] font-medium text-rose-700 mt-0.5">
              1.53% Fraud Flagged
            </div>
          </div>
        </div>

      </div>

      {/* 2. MIDDLE WORKSPACE: OVERALL RISK ENGINE & INGESTION STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Overall Risk Gauge Card */}
        <div className="lg:col-span-4 surface-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
                Meta-Learner Probability Gauge
              </h2>
              <p className="text-[11px] text-zinc-400">Calibrated Stacking Output</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/[0.04] text-zinc-600">
              FASTAPI :8008
            </span>
          </div>

          <div className="my-5 relative flex flex-col items-center justify-center">
            <div className="relative w-64 h-36 flex items-end justify-center overflow-hidden">
              <svg viewBox="0 0 200 120" className="w-full h-full">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="40%" stopColor="#F59E0B" />
                    <stop offset="75%" stopColor="#F97316" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                  <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.12"/>
                  </filter>
                </defs>

                <path
                  d="M 20 105 A 80 80 0 0 1 180 105"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.05)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                <path
                  d="M 20 105 A 80 80 0 0 1 180 105"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                <circle cx="100" cy="105" r="7" fill="#1E293B" />
                <circle cx="100" cy="105" r="3" fill="#FFFFFF" />

                <g transform={`rotate(${needleAngle}, 100, 105)`}>
                  <line
                    x1="100"
                    y1="105"
                    x2="100"
                    y2="36"
                    stroke="#1E293B"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#needleShadow)"
                  />
                  <polygon
                    points="97,42 103,42 100,32"
                    fill="#1E293B"
                  />
                </g>
              </svg>
            </div>

            <div className="text-center mt-2">
              <div className="text-3xl font-extrabold text-zinc-950 font-mono tracking-tight">
                {riskGaugeValue}
                <span className="text-zinc-400 text-lg font-normal"> /100</span>
              </div>
              <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                riskGaugeValue >= 70 ? 'text-rose-600' : riskGaugeValue >= 30 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {riskGaugeValue >= 70 ? 'High Risk Threat' : riskGaugeValue >= 30 ? 'Elevated Monitoring' : 'Clean Transaction'}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between text-xs text-zinc-400">
            <span className="text-[11px]">Simulate Diagnostic Score:</span>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setRiskGaugeValue(18)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all ${
                  riskGaugeValue < 30 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-black/[0.04] text-zinc-600 hover:bg-black/[0.08]'
                }`}
              >
                Safe
              </button>
              <button 
                onClick={() => setRiskGaugeValue(45)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all ${
                  riskGaugeValue >= 30 && riskGaugeValue < 70 ? 'bg-amber-500 text-white shadow-xs' : 'bg-black/[0.04] text-zinc-600 hover:bg-black/[0.08]'
                }`}
              >
                Medium
              </button>
              <button 
                onClick={() => setRiskGaugeValue(89)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all ${
                  riskGaugeValue >= 70 ? 'bg-rose-600 text-white shadow-xs' : 'bg-black/[0.04] text-zinc-600 hover:bg-black/[0.08]'
                }`}
              >
                High
              </button>
            </div>
          </div>
        </div>

        {/* Right: Ingestion Stream Table */}
        <div className="lg:col-span-8 surface-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-black/[0.05] pb-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
                Live Transaction Stream &amp; Decision Logs
              </h2>
              <p className="text-[11px] text-zinc-400">Sub-100ms Inference &amp; Dynamic Anomaly Scoring</p>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('transactions')}
              className="text-xs font-semibold text-zinc-900 hover:text-blue-600 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <span>Full Diagnostic Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black/[0.05] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="pb-2.5 font-semibold">Transaction ID</th>
                  <th className="pb-2.5 font-semibold">Account Entity</th>
                  <th className="pb-2.5 font-semibold">Volume Amount</th>
                  <th className="pb-2.5 font-semibold text-center">Stacking Score</th>
                  <th className="pb-2.5 font-semibold">Risk Decision</th>
                  <th className="pb-2.5 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-zinc-700">
                {filteredTransactions.map((tx) => {
                  let scoreBadge = 'text-emerald-700 bg-emerald-50 border border-emerald-200/60';
                  let decisionColor = 'text-emerald-600 font-bold';

                  if (tx.riskScore >= 70) {
                    scoreBadge = 'text-rose-700 bg-rose-50 border border-rose-200/60';
                    decisionColor = 'text-rose-600 font-bold';
                  } else if (tx.riskScore >= 30) {
                    scoreBadge = 'text-amber-700 bg-amber-50 border border-amber-200/60';
                    decisionColor = 'text-amber-600 font-bold';
                  }

                  return (
                    <tr 
                      key={tx.id}
                      onClick={() => setSelectedTxn(tx)}
                      className="hover:bg-black/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 font-semibold text-zinc-900 font-mono text-[11px]">
                        {tx.id}
                      </td>
                      <td className="py-3 text-zinc-600">
                        {tx.user}
                      </td>
                      <td className="py-3 font-semibold text-zinc-900 font-mono">
                        {tx.amount}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${scoreBadge}`}>
                          {tx.riskScore}/100
                        </span>
                      </td>
                      <td className={`py-3 text-xs tracking-tight ${decisionColor}`}>
                        {tx.decision}
                      </td>
                      <td className="py-3 text-right text-zinc-400 font-mono text-[11px]">
                        {tx.time}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-black/[0.04] text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Showing {filteredTransactions.length} of 50 active transaction streams</span>
            <span className="text-blue-600 font-medium cursor-pointer" onClick={() => onNavigateTab && onNavigateTab('transactions')}>
              Click row to inspect SHAP/LIME explanation →
            </span>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM ROW: THREE BLENDED TELEMETRY SURFACES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Breakdown */}
        <div className="surface-card p-6">
          <div className="border-b border-black/[0.05] pb-3 mb-4">
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
              Ensemble Model Weighting
            </h2>
            <p className="text-[11px] text-zinc-400">Meta-Learner Inductive Bias</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="11" strokeDasharray="95.5 143.26" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#0284C7" strokeWidth="11" strokeDasharray="47.75 191" strokeDashoffset="-95.5" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="11" strokeDasharray="47.75 191" strokeDashoffset="-143.25" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="11" strokeDasharray="23.87 214.89" strokeDashoffset="-191" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="11" strokeDasharray="23.87 214.89" strokeDashoffset="-214.87" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-white shadow-xs flex items-center justify-center border border-black/[0.05]">
                  <Layers className="w-4 h-4 text-zinc-900" />
                </div>
              </div>
            </div>

            <div className="space-y-2 flex-1 text-xs">
              {RISK_BREAKDOWN.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                    <span className="text-zinc-600 text-xs">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900 text-xs">
                    {item.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Signal Vector Matrix */}
        <div className="surface-card p-6 flex flex-col justify-between">
          <div className="border-b border-black/[0.05] pb-3 mb-4">
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
              Multi-Signal Telemetry Matrix
            </h2>
            <p className="text-[11px] text-zinc-400">Layered Threat Scoring Vectors</p>
          </div>

          <div className="space-y-3">
            {MULTI_SIGNALS.map((sig, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-600">
                    {sig.label}
                  </span>
                  <span className="font-mono font-bold text-zinc-900 text-xs">
                    {sig.score.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sig.score * 100}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: sig.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Stream */}
        <div className="surface-card p-6 flex flex-col justify-between">
          <div className="border-b border-black/[0.05] pb-3 mb-4">
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
              Autonomous Defense Stream
            </h2>
            <p className="text-[11px] text-zinc-400">SOC Interceptions &amp; Retraining Events</p>
          </div>

          <div className="space-y-3.5">
            {SYSTEM_ACTIVITIES.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className={`mt-1 w-2.5 h-2.5 rounded-full ${act.color} ring-4 ${act.ring} shrink-0`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-zinc-800 leading-snug">
                    {act.title}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    {act.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Transaction Details Modal (Glassmorphic) */}
      <AnimatePresence>
        {selectedTxn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              className="bg-white/95 backdrop-blur-2xl rounded-2xl max-w-lg w-full p-6 border border-black/[0.08] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
                <div>
                  <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                    <span>Transaction Diagnostic</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/5 text-zinc-800 font-semibold">
                      {selectedTxn.id}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">User: {selectedTxn.user} • {selectedTxn.time}</p>
                </div>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-black/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.05]">
                  <div className="text-zinc-400 text-[11px] font-mono uppercase">Amount Evaluated</div>
                  <div className="text-lg font-bold text-zinc-950 font-mono mt-1">{selectedTxn.amount}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.05]">
                  <div className="text-zinc-400 text-[11px] font-mono uppercase">Stacking Meta-Decision</div>
                  <div className={`text-lg font-bold mt-1 ${
                    selectedTxn.decision === 'BLOCKED' ? 'text-rose-600' : selectedTxn.decision === 'STEP-UP' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {selectedTxn.decision} ({selectedTxn.riskScore}/100)
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.05] text-xs">
                <div className="font-semibold text-zinc-800 mb-1">Primary Feature Attribution Flag</div>
                <p className="text-zinc-600 leading-relaxed">{selectedTxn.reason}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.05]">
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-black/5 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedTxn(null);
                    onNavigateTab && onNavigateTab('analysis');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-black hover:bg-zinc-800 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>Launch in XAI Inspector</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
