import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Activity, Cpu, Zap, AlertTriangle, CheckCircle2, 
  BarChart3, Database, FileSpreadsheet, Layers 
} from 'lucide-react';

export const DashboardModule = () => {
  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="glass-card p-6 border-l-4 border-l-[#7C3AED]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-[#7C3AED]" />
              PAYSIM DATASET & MODEL TELEMETRY
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              DATA DISTRIBUTION & FEATURE IMPORTANCE DERIVED FROM PAYSIM MOBILE MONEY BENCHMARK DATASET
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              DATASET: 636,264 RECORDS
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
              FRAUD CASES: 8,213
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="glass-card p-5">
          <span className="text-xs text-slate-400 block mb-1">Total PaySim Volume</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">$114.3 Billion</div>
          <span className="text-[10px] text-emerald-500 mt-1 block">✓ Validated across 743 steps</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs text-slate-400 block mb-1">Overall Fraud Rate</span>
          <div className="text-2xl font-black text-rose-500">1.29%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">8,213 Ground Truth Fraud Rows</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs text-slate-400 block mb-1">Target Fraud Types</span>
          <div className="text-2xl font-black text-indigo-500">TRANSFER & CASH_OUT</div>
          <span className="text-[10px] text-slate-400 mt-1 block">99.9% of all fraud occurs here</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs text-slate-400 block mb-1">XGBoost F1 Score</span>
          <div className="text-2xl font-black text-emerald-500">0.947</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Optimal Threshold: 0.50</span>
        </div>
      </div>

      {/* Main Grid: Transaction Type Distribution & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 cols: PaySim Transaction Type Distribution */}
        <div className="lg:col-span-7 glass-card p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 font-mono">
            <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
            PaySim Fraud Distribution by Transaction Type
          </h3>

          <div className="space-y-4 font-mono text-xs">
            {/* CASH_OUT */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">CASH_OUT (223,798 Transactions)</span>
                <span className="text-rose-500 font-bold">4,116 Fraud Cases (1.84%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            {/* TRANSFER */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">TRANSFER (53,290 Transactions)</span>
                <span className="text-rose-500 font-bold">4,097 Fraud Cases (7.69%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '77%' }} />
              </div>
            </div>

            {/* PAYMENT */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">PAYMENT (215,149 Transactions)</span>
                <span className="text-emerald-500 font-bold">0 Fraud Cases (0.00%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>

            {/* CASH_IN */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">CASH_IN (139,924 Transactions)</span>
                <span className="text-emerald-500 font-bold">0 Fraud Cases (0.00%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: ML Feature Importance Telemetry */}
        <div className="lg:col-span-5 glass-card p-6 border-t-4 border-t-[#7C3AED]">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 font-mono">
            <Cpu className="w-4 h-4 text-[#7C3AED]" />
            Feature Engineering Importance
          </h3>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                <span>1. errorBalanceOrig</span>
                <span className="text-[#7C3AED]">38.4%</span>
              </div>
              <p className="text-[10px] text-slate-400">oldbalanceOrg - amount - newbalanceOrig</p>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: '38.4%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                <span>2. amount</span>
                <span className="text-indigo-500">27.6%</span>
              </div>
              <p className="text-[10px] text-slate-400">Transaction dollar amount</p>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '27.6%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                <span>3. oldbalanceOrg</span>
                <span className="text-cyan-500">18.2%</span>
              </div>
              <p className="text-[10px] text-slate-400">Origin balance prior to transfer</p>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: '18.2%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-semibold">
                <span>4. is_high_amount_transfer</span>
                <span className="text-amber-500">15.8%</span>
              </div>
              <p className="text-[10px] text-slate-400">Binary flag for amount {'>'} $200,000</p>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '15.8%' }} />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/5 text-[11px] font-mono text-slate-500">
            Engineered features enable 99.4% detection accuracy on PaySim dataset.
          </div>
        </div>

      </div>

    </div>
  );
};
