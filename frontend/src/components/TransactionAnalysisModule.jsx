import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Zap, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, 
  AlertCircle, ShieldCheck, Upload, FileText, ArrowRight, Activity, Eye, 
  Database, ExternalLink, BarChart2, Layers, Sliders, Check, AlertTriangle 
} from 'lucide-react';
import { fetchRandomTransaction, analyzeTransaction, DATASET_METADATA } from '../lib/api';

const SAMPLE_PAYLOADS = {
  paysim: {
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
  creditcard: {
    Time: 544,
    V1: -2.3122,
    V2: 1.9519,
    V3: -1.6098,
    V4: 3.9979,
    V14: -4.2893,
    V17: -2.8301,
    Amount: 149.62,
    Class: 1
  },
  spatial: {
    trans_date_trans_time: '2020-06-21 12:14:25',
    amt: 529.00,
    category: 'es_tech',
    gender: 'M',
    city_pop: 333497,
    lat: 33.9659,
    long: -80.9355,
    merch_lat: 33.9863,
    merch_long: -81.2007,
    is_fraud: 1
  },
  banksim: {
    step: 42,
    age: '3',
    gender: 'F',
    category: 'es_hotelservices',
    amount: 450.00,
    merchant: 'M348934600',
    fraud: 1
  }
};

export const TransactionAnalysisModule = ({ onTriggerThreatShift, onNavigateTab }) => {
  const [activeDomain, setActiveDomain] = useState('paysim');
  const [formData, setFormData] = useState(SAMPLE_PAYLOADS.paysim);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const activeMeta = DATASET_METADATA[activeDomain] || DATASET_METADATA.paysim;

  const handleDomainChange = (domainKey) => {
    setActiveDomain(domainKey);
    setFormData(SAMPLE_PAYLOADS[domainKey] || SAMPLE_PAYLOADS.paysim);
    setAnalysisResult(null);
    setParsedRows([]);
    setCsvFileName('');
  };

  const handleFetchRandom = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      if (activeDomain === 'paysim') {
        const data = await fetchRandomTransaction();
        if (data) {
          setFormData({
            step: data.step ?? 1,
            type: data.type ?? 'TRANSFER',
            amount: data.amount ?? 0,
            nameOrig: data.nameOrig ?? '',
            oldbalanceOrg: data.oldbalanceOrg ?? 0,
            newbalanceOrig: data.newbalanceOrig ?? 0,
            nameDest: data.nameDest ?? '',
            oldbalanceDest: data.oldbalanceDest ?? 0,
            newbalanceDest: data.newbalanceDest ?? 0,
            isFraud: data.isFraud ?? undefined
          });
        }
      } else {
        setFormData(SAMPLE_PAYLOADS[activeDomain] || SAMPLE_PAYLOADS.paysim);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) return;

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = [];

      for (let i = 1; i < Math.min(lines.length, 50); i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx];
        });
        rows.push(obj);
      }

      setParsedRows(rows);
      if (rows.length > 0) {
        setFormData(rows[0]);
        setSelectedRowIndex(0);
      }
    };
    reader.readAsText(file);
  };

  const handleRunInference = async (e) => {
    e?.preventDefault();
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await analyzeTransaction(formData, activeDomain);
      setAnalysisResult(res);

      if ((res.decision === 'Fraud' || res.status === 'FRAUD') && onTriggerThreatShift) {
        onTriggerThreatShift(
          `HIGH RISK ${activeDomain.toUpperCase()} FRAUD INTERCEPTED`,
          `Transaction risk score calculated at ${(res.risk_score * 100).toFixed(1)}%. Classification: FRAUD.`
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      
      {/* Domain Switcher Bar */}
      <div className="glass-card p-6 border-l-4 border-l-[#7C3AED]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-[#7C3AED]" />
              MULTI-DOMAIN DATASET & MODEL INFERENCE
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              SELECT A FINANCIAL DOMAIN TO LOAD DOMAIN METRICS & DEDICATED MODEL INFERENCE
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Object.values(DATASET_METADATA).map(ds => {
              const isSelected = activeDomain === ds.id;
              return (
                <button
                  key={ds.id}
                  onClick={() => handleDomainChange(ds.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-md ring-2 ring-violet-500/30'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {ds.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dataset-Specific Domain Analysis Panel */}
      <div className="glass-card p-6 border-t-4 border-t-indigo-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeMeta.name}</h3>
              <a 
                href={`https://www.kaggle.com/datasets/${activeMeta.kaggleSlug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1 font-bold"
              >
                Kaggle: {activeMeta.kaggleSlug} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activeMeta.description}</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
              Optimized F1-Score: <strong className="text-slate-900 dark:text-white">{activeMeta.optimizedF1}</strong>
            </div>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <span className="text-slate-400 text-[10px] block">Record Count</span>
            <strong className="text-slate-900 dark:text-white text-sm">{activeMeta.recordCount}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <span className="text-slate-400 text-[10px] block">Fraud Cases</span>
            <strong className="text-rose-500 text-sm">{activeMeta.fraudCount} ({activeMeta.fraudRate})</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <span className="text-slate-400 text-[10px] block">Baseline F1 (`0.50`)</span>
            <strong className="text-slate-500 text-sm">{activeMeta.baselineF1}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <span className="text-slate-400 text-[10px] block">Precision</span>
            <strong className="text-emerald-500 text-sm">{activeMeta.precision}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <span className="text-slate-400 text-[10px] block">Recall</span>
            <strong className="text-indigo-500 text-sm">{activeMeta.recall}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[10px] block">Primary Risk Drivers</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold text-[11px] truncate block">
              {activeMeta.riskDrivers.slice(0, 2).join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Transaction Input Form (Left 7 Cols) & Inference Results (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & CSV Upload */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#7C3AED]" />
                {activeMeta.name} Transaction Form
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchRandom}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded-lg bg-violet-500/10 text-[#7C3AED] hover:bg-violet-500/20 text-xs font-bold border border-violet-500/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Sample Row
                </button>

                <label className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold border border-slate-200 dark:border-white/10 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  Upload CSV
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {csvFileName && (
              <div className="p-3 mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-500">
                <span>Loaded CSV: <strong>{csvFileName}</strong> ({parsedRows.length} rows)</span>
              </div>
            )}

            {/* Dynamic Form Inputs */}
            <form onSubmit={handleRunInference} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(formData).map(([k, v]) => (
                  <div key={k} className="space-y-1">
                    <label className="text-[11px] text-slate-400 block font-bold">{k}</label>
                    <input
                      type={typeof v === 'number' ? 'number' : 'text'}
                      step="any"
                      value={v}
                      onChange={(e) => setFormData({ ...formData, [k]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    RUNNING {activeDomain.toUpperCase()} FRAUDSHIELD INFERENCE...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    RUN LIVE {activeDomain.toUpperCase()} FRAUDSHIELD INFERENCE
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Inference Results & SHAP Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          {analysisResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 border-t-4 border-t-[#7C3AED] space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  ML Model Classification
                </h3>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  analysisResult.decision === 'Fraud' || analysisResult.status === 'FRAUD'
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                    : analysisResult.decision === 'Needs Review' || analysisResult.status === 'NEEDS_REVIEW'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                }`}>
                  {analysisResult.decision || analysisResult.status}
                </span>
              </div>

              <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="text-4xl font-black text-slate-900 dark:text-white">
                  {(analysisResult.risk_score * 100).toFixed(1)}%
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ACTUAL MODEL FRAUD PROBABILITY
                </span>
                <span className="text-[10px] text-indigo-500 mt-0.5 font-bold block">
                  Classification Rule: Safe (&lt;35%) • Needs Review (35%-65%) • Fraud (&gt;65%)
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                  Top SHAP Risk Factors
                </h4>

                <div className="space-y-2 text-xs">
                  {analysisResult.explanations?.map((exp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{exp.feature}</span>
                      <span className={`font-bold ${exp.shap_value > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {exp.shap_value > 0 ? '+' : ''}{exp.shap_value.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('shap')}
                  className="w-full py-2.5 rounded-xl bg-violet-500/10 text-[#7C3AED] hover:bg-violet-500/20 font-bold text-xs border border-violet-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  INSPECT DETAILED SHAP WATERFALL
                </button>
              )}
            </motion.div>
          ) : (
            <div className="glass-card p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <Cpu className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 animate-bounce" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Ready for Inference</p>
              <p className="text-slate-500 mt-1">Select a domain dataset above and click "Run Live Inference" to test predictions.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
