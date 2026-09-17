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

export const ModelComparisonModule = () => {
  const [activeDomain, setActiveDomain] = useState('paysim');

  const currentModels = DATASET_BENCHMARKS[activeDomain] || DATASET_BENCHMARKS.paysim;
  const activeMeta = DATASET_METADATA[activeDomain] || DATASET_METADATA.paysim;

  return (
    <div className="space-y-6 font-mono">
      
      {/* Top Banner & Control Tabs */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-l-4 border-l-blue-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-600" />
              MULTI-DOMAIN MODEL BENCHMARK COMPARATOR
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              COMPARE MODEL ARCHITECTURES & PERFORMANCE METRICS ACROSS BENCHMARK DATASETS
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
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {ds.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub Header showing Active Domain Stats */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4 text-xs border-t-2 border-t-blue-600">
        <div>
          <span className="text-slate-400">Active Dataset Domain: </span>
          <strong className="text-slate-900">{activeMeta.name}</strong>
          <span className="text-slate-400 ml-2">({activeMeta.recordCount} records, {activeMeta.fraudCount} fraud)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            F1 Gain: <strong>{activeMeta.baselineF1} → {activeMeta.optimizedF1}</strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            Threshold: <strong>{activeMeta.threshold}</strong>
          </div>
        </div>
      </div>

      {/* Model Architecture Comparison */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentModels.map((m, idx) => (
            <div key={idx} className={`p-5 rounded-2xl bg-white border shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden ${m.isWinner ? 'border-2 border-blue-600' : 'border-slate-200/80'}`}>
              {m.isWinner && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                  <Award className="w-3 h-3" /> BEST DEPLOYED
                </div>
              )}

              <h4 className="font-bold text-slate-900 text-xs mb-3 pr-12">{m.name}</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">PR-AUC:</span>
                  <span className="font-bold text-blue-600">{m.prAuc}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">ROC-AUC:</span>
                  <span className="font-bold text-indigo-600">{m.rocAuc}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">F1 Score:</span>
                  <span className="font-bold text-emerald-600">{m.f1Score}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Recall:</span>
                  <span className="font-bold text-slate-900">{(m.recall * 100).toFixed(1)}%</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400">Latency:</span>
                  <span className="font-mono text-slate-700">{m.latencyMs} ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Model Performance Comparison Bar Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            PR-AUC vs Inference Latency ({activeMeta.name})
          </h3>

          <div className="space-y-4 text-xs">
            {currentModels.map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{m.name}</span>
                  <span className="text-blue-600">PR-AUC: {m.prAuc} | F1: {m.f1Score}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.isWinner ? 'bg-blue-600' : 'bg-indigo-400'}`}
                    style={{ width: `${m.prAuc * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
