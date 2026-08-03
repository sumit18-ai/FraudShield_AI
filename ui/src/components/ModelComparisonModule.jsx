import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Sliders, ShieldCheck, Cpu, DollarSign, AlertTriangle, Layers } from 'lucide-react';

const MODELS = [
  {
    name: 'XGBoost v4.2',
    tag: 'PRODUCTION ACTIVE',
    color: 'violet',
    f1: 0.984,
    precision: 99.2,
    recall: 97.8,
    latency: '3.8 ms',
    fpr: '0.08%',
    auc: 0.994,
  },
  {
    name: 'Random Forest v2.1',
    tag: 'LEGACY BASELINE',
    color: 'amber',
    f1: 0.921,
    precision: 94.5,
    recall: 89.8,
    latency: '8.2 ms',
    fpr: '0.45%',
    auc: 0.942,
  },
  {
    name: 'FraudNet Deep V1',
    tag: 'EXPERIMENTAL',
    color: 'cyan',
    f1: 0.976,
    precision: 98.1,
    recall: 97.1,
    latency: '14.5 ms',
    fpr: '0.14%',
    auc: 0.988,
  },
];

export const ModelComparisonModule = () => {
  const [threshold, setThreshold] = useState(0.50);

  const tp = Math.floor(14200 * (1 - Math.pow(threshold, 2) * 0.15));
  const fp = Math.floor(850 * Math.pow(1 - threshold, 1.8));
  const tn = Math.floor(485000 * threshold);
  const fn = Math.floor(320 * (1 + Math.pow(threshold, 2) * 2.5));

  const savedDollars = ((tp * 105) / 1000000).toFixed(2);
  const frictionRate = ((fp / (tn + fp)) * 100).toFixed(2);

  return (
    <div className="space-y-8">
      
      {/* Top Section: Model Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MODELS.map((model) => (
          <div
            key={model.name}
            className={`glass-card p-6 border ${
              model.color === 'violet'
                ? 'border-violet-500/40 shadow-[0_0_25px_rgba(124,58,237,0.15)] bg-slate-900/10 dark:bg-[#101726]'
                : 'border-slate-200/80 dark:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">{model.name}</h4>
                <span className="text-[9px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-violet-500/15 text-[#7C3AED] dark:text-violet-300 border border-violet-500/30">
                  {model.tag}
                </span>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">AUC ROC</div>
                <div className="text-lg font-bold text-[#7C3AED] dark:text-violet-400">{model.auc}</div>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200/80 dark:border-white/5">
                <span className="text-slate-500 dark:text-[#94A3B8]">F1 SCORE</span>
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{model.f1}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/80 dark:border-white/5">
                <span className="text-slate-500 dark:text-[#94A3B8]">PRECISION</span>
                <span className="font-bold text-emerald-600 dark:text-[#22C55E]">{model.precision}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/80 dark:border-white/5">
                <span className="text-slate-500 dark:text-[#94A3B8]">RECALL</span>
                <span className="font-bold text-cyan-600 dark:text-[#06B6D4]">{model.recall}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/80 dark:border-white/5">
                <span className="text-slate-500 dark:text-[#94A3B8]">INFERENCE TIME</span>
                <span className="font-bold text-slate-700 dark:text-[#CBD5E1]">{model.latency}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 dark:text-[#94A3B8]">FALSE POSITIVE RATE</span>
                <span className="font-bold text-amber-600 dark:text-[#F97316]">{model.fpr}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Section: Interactive ROC Curves & Threshold Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 7 cols: ROC Curve Plot */}
        <div className="lg:col-span-7 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-[#7C3AED]" />
                INTERACTIVE ROC CURVE & SIMULATOR
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono mt-0.5">
                TRUE POSITIVE RATE VS FALSE POSITIVE RATE ACROSS THRESHOLDS
              </p>
            </div>
          </div>

          {/* SVG ROC Plot */}
          <div className="relative w-full h-72 bg-slate-100/90 dark:bg-[#090D18] rounded-2xl border border-slate-200/80 dark:border-violet-500/20 p-4">
            <svg className="w-full h-full" viewBox="0 0 300 200">
              <line x1="40" y1="20" x2="40" y2="170" stroke="rgba(124, 58, 237, 0.2)" strokeWidth="1" />
              <line x1="40" y1="170" x2="280" y2="170" stroke="rgba(124, 58, 237, 0.2)" strokeWidth="1" />
              
              <line x1="40" y1="170" x2="280" y2="20" stroke="rgba(148, 163, 184, 0.4)" strokeDasharray="4 4" />

              {/* XGBoost ROC Curve */}
              <path
                d="M 40 170 Q 45 35 280 20"
                fill="none"
                stroke="#7C3AED"
                strokeWidth="3"
              />

              {/* Random Forest ROC Curve */}
              <path
                d="M 40 170 Q 80 80 280 20"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2"
                strokeDasharray="5 5"
              />

              {/* Active Threshold Indicator Point on ROC */}
              <circle
                cx={40 + threshold * 240}
                cy={170 - (1 - Math.pow(1 - threshold, 2)) * 150}
                r="6"
                fill="#EF4444"
                className="animate-ping"
              />
              <circle
                cx={40 + threshold * 240}
                cy={170 - (1 - Math.pow(1 - threshold, 2)) * 150}
                r="5"
                fill="#EF4444"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Axis Labels */}
              <text x="140" y="195" fill="#94A3B8" fontSize="9" fontFamily="monospace">
                FALSE POSITIVE RATE (FPR)
              </text>
              <text x="5" y="100" fill="#94A3B8" fontSize="9" fontFamily="monospace" transform="rotate(-90 15 100)">
                TRUE POSITIVE RATE (TPR)
              </text>
            </svg>
          </div>

          {/* Interactive Threshold Slider */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-100/80 dark:bg-[#101726] border border-slate-200/80 dark:border-violet-500/20 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-[#CBD5E1] font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#7C3AED]" />
                DECISION THRESHOLD CUTOFF
              </span>
              <span className="text-[#7C3AED] dark:text-violet-300 font-extrabold text-sm">{threshold.toFixed(2)}</span>
            </div>

            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
            />
          </div>
        </div>

        {/* Right 5 cols: Live Confusion Matrix & Financial Simulator */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Real-time Confusion Matrix */}
          <div className="glass-card p-6">
            <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7C3AED]" />
              DYNAMIC CONFUSION MATRIX
            </h4>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                <div className="text-[10px] text-emerald-600 dark:text-[#22C55E] uppercase font-bold">TRUE POSITIVE (TP)</div>
                <div className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">{tp.toLocaleString()}</div>
                <div className="text-[9px] text-slate-500 dark:text-[#94A3B8]">CORRECTLY BLOCKED</div>
              </div>

              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-1">
                <div className="text-[10px] text-red-600 dark:text-[#EF4444] uppercase font-bold">FALSE POSITIVE (FP)</div>
                <div className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">{fp.toLocaleString()}</div>
                <div className="text-[9px] text-slate-500 dark:text-[#94A3B8]">FALSE FRICTION</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
                <div className="text-[10px] text-amber-600 dark:text-[#F97316] uppercase font-bold">FALSE NEGATIVE (FN)</div>
                <div className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">{fn.toLocaleString()}</div>
                <div className="text-[9px] text-slate-500 dark:text-[#94A3B8]">MISSED FRAUD</div>
              </div>

              <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-center space-y-1">
                <div className="text-[10px] text-[#7C3AED] dark:text-violet-300 uppercase font-bold">TRUE NEGATIVE (TN)</div>
                <div className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">{tn.toLocaleString()}</div>
                <div className="text-[9px] text-slate-500 dark:text-[#94A3B8]">CLEARED LEGIT</div>
              </div>
            </div>
          </div>

          {/* Business Financial Impact Simulator */}
          <div className="glass-card p-6 border-violet-500/30 bg-slate-900 dark:bg-[#090D18] text-white space-y-3 font-mono">
            <div className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center justify-between">
              <span>FINANCIAL TRADE-OFF IMPACT</span>
              <DollarSign className="w-4 h-4 text-[#22C55E]" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 dark:bg-[#101726] border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">EST. SAVED FRAUD CAPITAL</span>
                <span className="text-[#22C55E] font-bold">${savedDollars}M</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">LEGITIMATE USER FRICTION</span>
                <span className="text-[#F97316] font-bold">{frictionRate}%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
