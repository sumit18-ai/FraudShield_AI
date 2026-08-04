import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GitCompare, Layers, Cpu, CheckCircle2, Zap, ShieldCheck, 
  BarChart3, Sliders, ArrowUpRight, Award, Activity, Database 
} from 'lucide-react';
import { DATASET_METADATA } from '../lib/api';

const DATASET_BENCHMARKS = {
  paysim: [
    { name: 'Stacking Ensemble (XGB + LGBM + RF)', prAuc: 1.000, rocAuc: 1.000, f1Score: 0.9966, precision: 1.000, recall: 0.9933, latencyMs: 1.8, status: 'PRODUCTION DEPLOYED', isWinner: true },
    { name: 'XGBoost (Extreme Gradient Boosting)', prAuc: 0.998, rocAuc: 0.999, f1Score: 0.9940, precision: 0.9950, recall: 0.9930, latencyMs: 0.9, status: 'CANDIDATE', isWinner: false },
    { name: 'LightGBM (Fast Gradient Boosting)', prAuc: 0.995, rocAuc: 0.998, f1Score: 0.9918, precision: 0.9920, recall: 0.9916, latencyMs: 0.4, status: 'CANDIDATE', isWinner: false },
    { name: 'Random Forest Baseline', prAuc: 0.981, rocAuc: 0.989, f1Score: 0.9850, precision: 0.9860, recall: 0.9840, latencyMs: 2.4, status: 'BENCHMARK', isWinner: false }
  ],
  creditcard: [
    { name: 'Stacking Ensemble + Class Weighting', prAuc: 0.8771, rocAuc: 0.9778, f1Score: 0.8925, precision: 0.9432, recall: 0.8469, latencyMs: 2.1, status: 'OPTIMIZED DEPLOYED', isWinner: true },
    { name: 'XGBoost (scale_pos_weight=577)', prAuc: 0.8650, rocAuc: 0.9710, f1Score: 0.8810, precision: 0.9250, recall: 0.8410, latencyMs: 1.1, status: 'CANDIDATE', isWinner: false },
    { name: 'LightGBM (balanced)', prAuc: 0.8520, rocAuc: 0.9680, f1Score: 0.8690, precision: 0.9120, recall: 0.8300, latencyMs: 0.5, status: 'CANDIDATE', isWinner: false },
    { name: 'Random Forest Baseline (Unweighted)', prAuc: 0.7850, rocAuc: 0.9420, f1Score: 0.8085, precision: 0.8507, recall: 0.7703, latencyMs: 2.8, status: 'BENCHMARK', isWinner: false }
  ],
  spatial: [
    { name: 'Stacking Ensemble + Haversine Distance', prAuc: 0.9175, rocAuc: 0.9885, f1Score: 0.8557, precision: 0.9053, recall: 0.8112, latencyMs: 2.3, status: 'OPTIMIZED DEPLOYED', isWinner: true },
    { name: 'XGBoost Spatial Engine', prAuc: 0.9050, rocAuc: 0.9820, f1Score: 0.8480, precision: 0.8940, recall: 0.8060, latencyMs: 1.2, status: 'CANDIDATE', isWinner: false },
    { name: 'LightGBM Spatial Engine', prAuc: 0.8920, rocAuc: 0.9790, f1Score: 0.8390, precision: 0.8820, recall: 0.8000, latencyMs: 0.6, status: 'CANDIDATE', isWinner: false },
    { name: 'Random Forest Baseline', prAuc: 0.8110, rocAuc: 0.9510, f1Score: 0.8110, precision: 0.8520, recall: 0.7730, latencyMs: 3.1, status: 'BENCHMARK', isWinner: false }
  ],
  banksim: [
    { name: 'XGBoost + OmniSMOTE (Category Head)', prAuc: 0.9967, rocAuc: 0.9997, f1Score: 0.9714, precision: 0.9444, recall: 1.0000, latencyMs: 0.8, status: 'OPTIMIZED DEPLOYED', isWinner: true },
    { name: 'Random Forest + OmniSMOTE', prAuc: 1.0000, rocAuc: 1.0000, f1Score: 0.9697, precision: 1.0000, recall: 0.9412, latencyMs: 1.9, status: 'CANDIDATE', isWinner: false },
    { name: 'Stacking Ensemble', prAuc: 0.9967, rocAuc: 0.9997, f1Score: 0.9412, precision: 0.9412, recall: 0.9412, latencyMs: 1.7, status: 'CANDIDATE', isWinner: false },
    { name: 'LightGBM Baseline', prAuc: 0.9967, rocAuc: 0.9997, f1Score: 0.9412, precision: 0.9412, recall: 0.9412, latencyMs: 0.4, status: 'BENCHMARK', isWinner: false }
  ]
};

const SAMPLING_BENCHMARKS = [
  {
    strategy: 'OmniSMOTE (Omni-Adaptive Hybrid)',
    description: 'Custom hybrid oversampler combining Borderline-1, Tomek Links, and density-based boundary synthesis.',
    minorityRecall: '91.3% - 100%',
    f1Score: '0.892 - 0.996',
    prAuc: '0.877 - 1.000',
    syntheticNoise: 'Very Low (Boundary Cleaned)',
    status: 'SELECTED STRATEGY',
    isWinner: true
  },
  {
    strategy: 'Borderline-SMOTE',
    description: 'Synthesizes artificial minority samples strictly near decision boundaries.',
    minorityRecall: '88.5%',
    f1Score: '0.865',
    prAuc: '0.850',
    syntheticNoise: 'Low',
    status: 'EVALUATED',
    isWinner: false
  },
  {
    strategy: 'Standard SMOTE',
    description: 'K-NN interpolation across arbitrary minority instances without noise filtering.',
    minorityRecall: '85.1%',
    f1Score: '0.820',
    prAuc: '0.815',
    syntheticNoise: 'Moderate (Introduces Overlap)',
    status: 'EVALUATED',
    isWinner: false
  },
  {
    strategy: 'Baseline (Imbalanced 1:577)',
    description: 'Raw dataset without oversampling (severe class imbalance bias).',
    minorityRecall: '68.4%',
    f1Score: '0.742',
    prAuc: '0.765',
    syntheticNoise: 'N/A',
    status: 'UNBALANCED',
    isWinner: false
  }
];

export const ModelComparisonModule = () => {
  const [activeDomain, setActiveDomain] = useState('paysim');
  const [activeTab, setActiveTab] = useState('models'); // 'models' | 'sampling'

  const currentModels = DATASET_BENCHMARKS[activeDomain] || DATASET_BENCHMARKS.paysim;
  const activeMeta = DATASET_METADATA[activeDomain] || DATASET_METADATA.paysim;

  return (
    <div className="space-y-6 font-mono">
      
      {/* Top Banner & Control Tabs */}
      <div className="glass-card p-6 border-l-4 border-l-[#7C3AED]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-[#7C3AED]" />
              MULTI-DOMAIN MODEL BENCHMARK COMPARATOR
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              COMPARE MODEL ARCHITECTURES & OVERSAMPLING ACROSS ALL 4 REAL KAGGLE DATASETS
            </p>
          </div>

          {/* Domain Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.values(DATASET_METADATA).map(ds => (
              <button
                key={ds.id}
                onClick={() => setActiveDomain(ds.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeDomain === ds.id
                    ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-200'
                }`}
              >
                {ds.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub Header showing Active Domain Stats */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 text-xs border-t-2 border-t-indigo-500">
        <div>
          <span className="text-slate-400">Active Dataset Domain: </span>
          <strong className="text-slate-900 dark:text-white">{activeMeta.name}</strong>
          <span className="text-slate-400 ml-2">({activeMeta.recordCount} records, {activeMeta.fraudCount} fraud)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            F1 Gain: <strong>{activeMeta.baselineF1} → {activeMeta.optimizedF1}</strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-[#7C3AED] border border-violet-500/30">
            Threshold: <strong>{activeMeta.threshold}</strong>
          </div>
        </div>
      </div>

      {/* VIEW 1: Model Architecture Comparison */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentModels.map((m, idx) => (
              <div key={idx} className={`glass-card p-5 relative overflow-hidden ${m.isWinner ? 'border-2 border-[#7C3AED]' : ''}`}>
                {m.isWinner && (
                  <div className="absolute top-0 right-0 bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <Award className="w-3 h-3" /> BEST DEPLOYED
                  </div>
                )}

                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-3 pr-12">{m.name}</h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">PR-AUC:</span>
                    <span className="font-bold text-[#7C3AED]">{m.prAuc}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">ROC-AUC:</span>
                    <span className="font-bold text-indigo-500">{m.rocAuc}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">F1 Score:</span>
                    <span className="font-bold text-emerald-500">{m.f1Score}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Recall:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{(m.recall * 100).toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-slate-200/80 dark:border-white/5 text-[11px]">
                    <span className="text-slate-400">Latency:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{m.latencyMs} ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Model Performance Comparison Bar Chart */}
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
              PR-AUC vs Inference Latency ({activeMeta.name})
            </h3>

            <div className="space-y-4 text-xs">
              {currentModels.map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>{m.name}</span>
                    <span className="text-[#7C3AED]">PR-AUC: {m.prAuc} | F1: {m.f1Score}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.isWinner ? 'bg-[#7C3AED]' : 'bg-indigo-400'}`}
                      style={{ width: `${m.prAuc * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
