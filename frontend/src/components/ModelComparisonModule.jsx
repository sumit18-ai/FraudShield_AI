import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GitCompare, Layers, Cpu, CheckCircle2, Zap, ShieldCheck, 
  BarChart3, Sliders, ArrowUpRight, Award, Activity 
} from 'lucide-react';

const MODEL_BENCHMARKS = [
  {
    name: 'Stacking Ensemble (XGB + LGBM + RF)',
    prAuc: 0.948,
    rocAuc: 0.998,
    f1Score: 0.947,
    precision: 0.984,
    recall: 0.913,
    latencyMs: 1.8,
    status: 'PRODUCTION DEPLOYED',
    isWinner: true
  },
  {
    name: 'XGBoost (Extreme Gradient Boosting)',
    prAuc: 0.932,
    rocAuc: 0.995,
    f1Score: 0.931,
    precision: 0.978,
    recall: 0.889,
    latencyMs: 0.9,
    status: 'CANDIDATE',
    isWinner: false
  },
  {
    name: 'LightGBM (Fast Gradient Boosting)',
    prAuc: 0.915,
    rocAuc: 0.992,
    f1Score: 0.918,
    precision: 0.965,
    recall: 0.875,
    latencyMs: 0.4,
    status: 'CANDIDATE',
    isWinner: false
  },
  {
    name: 'Random Forest Baseline',
    prAuc: 0.884,
    rocAuc: 0.981,
    f1Score: 0.887,
    precision: 0.942,
    recall: 0.838,
    latencyMs: 2.4,
    status: 'BENCHMARK',
    isWinner: false
  }
];

const SAMPLING_BENCHMARKS = [
  {
    strategy: 'OmniSMOTE (Omni-Adaptive Hybrid)',
    description: 'Custom hybrid oversampler combining Borderline-1, Tomek Links, and density-based boundary synthesis.',
    minorityRecall: '91.3%',
    f1Score: '0.947',
    prAuc: '0.948',
    syntheticNoise: 'Very Low (Boundary Cleaned)',
    status: 'SELECTED STRATEGY',
    isWinner: true
  },
  {
    strategy: 'Borderline-SMOTE',
    description: 'Synthesizes artificial minority samples strictly near decision boundaries.',
    minorityRecall: '88.5%',
    f1Score: '0.912',
    prAuc: '0.915',
    syntheticNoise: 'Low',
    status: 'EVALUATED',
    isWinner: false
  },
  {
    strategy: 'Standard SMOTE',
    description: 'K-NN interpolation across arbitrary minority instances without noise filtering.',
    minorityRecall: '85.1%',
    f1Score: '0.879',
    prAuc: '0.882',
    syntheticNoise: 'Moderate (Introduces Overlap)',
    status: 'EVALUATED',
    isWinner: false
  },
  {
    strategy: 'Baseline (Imbalanced 1:100)',
    description: 'Raw dataset without oversampling (severe 98.7% class imbalance bias).',
    minorityRecall: '68.4%',
    f1Score: '0.742',
    prAuc: '0.765',
    syntheticNoise: 'N/A',
    status: 'UNBALANCED',
    isWinner: false
  }
];

export const ModelComparisonModule = () => {
  const [activeTab, setActiveTab] = useState('models'); // 'models' | 'sampling'

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Tabs */}
      <div className="glass-card p-6 border-l-4 border-l-[#7C3AED]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-[#7C3AED]" />
              MODEL ARCHITECTURE & OVERSAMPLING COMPARATOR
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              BENCHMARK EVALUATION OF ML CLASSIFIERS AND ADVANCED OVERSAMPLING STRATEGIES ON PAYSIM DATASET
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setActiveTab('models')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer border ${
                activeTab === 'models'
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-200'
              }`}
            >
              MODEL ARCHITECTURES
            </button>

            <button
              onClick={() => setActiveTab('sampling')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer border ${
                activeTab === 'sampling'
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-200'
              }`}
            >
              OVERSAMPLING BENCHMARKS (OMNISMOTE)
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: Model Architecture Comparison */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {MODEL_BENCHMARKS.map((m, idx) => (
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
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#7C3AED]" />
              PR-AUC vs Inference Latency Comparison
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {MODEL_BENCHMARKS.map((m, idx) => (
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

      {/* VIEW 2: Oversampling Strategy Benchmarks (OmniSMOTE) */}
      {activeTab === 'sampling' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {SAMPLING_BENCHMARKS.map((s, idx) => (
              <div key={idx} className={`glass-card p-5 relative overflow-hidden ${s.isWinner ? 'border-2 border-emerald-500' : ''}`}>
                {s.isWinner && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <Award className="w-3 h-3" /> BEST SAMPLER
                  </div>
                )}

                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2">{s.strategy}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 h-12 leading-relaxed">
                  {s.description}
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Minority Recall:</span>
                    <span className="font-bold text-emerald-500">{s.minorityRecall}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">F1 Score:</span>
                    <span className="font-bold text-[#7C3AED]">{s.f1Score}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">PR-AUC:</span>
                    <span className="font-bold text-indigo-500">{s.prAuc}</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-slate-200/80 dark:border-white/5 text-[10px]">
                    <span className="text-slate-400">Boundary Noise:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{s.syntheticNoise}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* OmniSMOTE Technical Overview Card */}
          <div className="glass-card p-6 border-l-4 border-l-emerald-500 font-mono">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              WHY OMNISMOTE OUTPERFORMS STANDARD OVERSAMPLING
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Standard SMOTE introduces synthetic noise by interpolating across overlapping decision boundaries in highly imbalanced financial datasets like PaySim (1:100 imbalance). 
              <span className="font-bold text-emerald-500 ml-1">OmniSMOTE</span> combines density-adaptive boundary sampling with Tomek Links cleaning, boosting minority class recall from 68.4% to <span className="font-bold text-slate-900 dark:text-white">91.3%</span> without increasing false positive block rates.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
