import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Zap, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, 
  AlertCircle, ShieldCheck, Upload, FileText, ArrowRight, Activity, Eye, 
  Database, ExternalLink, BarChart2, Layers, Sliders, Check, AlertTriangle,
  Network, Lock, HelpCircle, FileCheck, Shield
} from 'lucide-react';
import { fetchRandomTransaction, analyzeTransaction, DATASET_METADATA } from '../lib/api';

const SAMPLE_PAYLOADS = {
  paysim: {
    step: 1,
    type: 'TRANSFER',
    amount: 250000.0,
    nameOrig: 'C90101',
    oldbalanceOrg: 250000.0,
    newbalanceOrig: 0.0,
    nameDest: 'C90102',
    oldbalanceDest: 0.0,
    newbalanceDest: 250000.0,
    device_id: 'DEV_MULE_RING_X',
    ip_address: '45.134.22.9',
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
            nameOrig: data.nameOrig ?? 'C123456',
            oldbalanceOrg: data.oldbalanceOrg ?? 0,
            newbalanceOrig: data.newbalanceOrig ?? 0,
            nameDest: data.nameDest ?? 'M654321',
            oldbalanceDest: data.oldbalanceDest ?? 0,
            newbalanceDest: data.newbalanceDest ?? 0,
            device_id: `DEV_${Math.floor(Math.random() * 900 + 100)}`,
            ip_address: `192.168.1.${Math.floor(Math.random() * 250 + 1)}`,
            isFraud: data.isFraud ?? undefined
          });
        }
      } else {
        const sample = SAMPLE_PAYLOADS[activeDomain];
        if (sample) setFormData({ ...sample });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const rows = [];
          for (let i = 1; i < Math.min(lines.length, 100); i++) {
            const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const rowObj = {};
            headers.forEach((h, idx) => {
              const parsedNum = parseFloat(vals[idx]);
              rowObj[h] = isNaN(parsedNum) ? vals[idx] : parsedNum;
            });
            rows.push(rowObj);
          }
          setParsedRows(rows);
          if (rows.length > 0) {
            setSelectedRowIndex(0);
            setFormData(rows[0]);
          }
        }
      }
    };
    reader.readAsText(file);
  };

  const handleRunInference = async (e) => {
    if (e) e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeTransaction(formData, activeDomain);
      setAnalysisResult(result);
      if (onTriggerThreatShift) {
        onTriggerThreatShift(result.is_fraud || result.risk_score >= 0.70);
      }
    } catch (err) {
      console.error("Inference Error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const signals = analysisResult?.signal_breakdown;

  return (
    <div className="space-y-6">
      
      {/* Domain Selection Tabs */}
      <div className="surface-card p-1.5 flex flex-wrap gap-1.5">
        {Object.entries(DATASET_METADATA).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => handleDomainChange(key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
              activeDomain === key
                ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{meta.name}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Inputs vs Multi-Signal Risk Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Form (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="surface-card p-6">
            
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-black/[0.05]">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>{activeMeta.name} Vector Parameters</span>
                </h3>
                <p className="text-[11px] text-zinc-400">Configure Feature Values for Real-Time Stacking Inference</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchRandom}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded-xl bg-black/[0.04] text-zinc-800 hover:bg-black/[0.08] text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>Sample</span>
                </button>

                <label className="px-3 py-1.5 rounded-xl bg-black/[0.04] text-zinc-800 hover:bg-black/[0.08] text-xs font-medium cursor-pointer flex items-center gap-1 transition-all">
                  <Upload className="w-3.5 h-3.5 text-zinc-600" />
                  <span>CSV</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Dynamic Form Inputs */}
            <form onSubmit={handleRunInference} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs max-h-[380px] overflow-y-auto pr-1">
                {Object.entries(formData).map(([k, v]) => (
                  <div key={k} className="space-y-1">
                    <label className="text-[10px] text-zinc-400 block font-mono font-bold uppercase truncate" title={k}>
                      {k}
                    </label>
                    <input
                      type={typeof v === 'number' ? 'number' : 'text'}
                      step="any"
                      value={v}
                      onChange={(e) => setFormData({ ...formData, [k]: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-black/[0.02] border border-black/[0.06] text-zinc-900 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-black/20 focus:bg-white transition-all"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>EVALUATING MULTI-ENGINE STACKING MATRIX...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>RUN MULTI-ENGINE FRAUDSHIELD INFERENCE</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Multi-Signal Decision Dashboard (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {analysisResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Decision Action Banner */}
              <div className={`p-5 rounded-2xl border transition-all ${
                analysisResult.decision === 'Block'
                  ? 'bg-rose-50/80 border-rose-200/80 text-rose-800'
                  : analysisResult.decision === 'Needs Review'
                  ? 'bg-amber-50/80 border-amber-200/80 text-amber-800'
                  : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs ${
                      analysisResult.decision === 'Block' ? 'bg-rose-600 text-white' : analysisResult.decision === 'Needs Review' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {analysisResult.decision === 'Block' ? '⛔' : analysisResult.decision === 'Needs Review' ? '⚠️' : '✓'}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider font-semibold opacity-75">
                        {analysisResult.action_code || 'ACTION DETERMINED'}
                      </div>
                      <div className="text-xl font-bold font-mono">
                        {analysisResult.decision?.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono opacity-75">Composite Risk</div>
                    <div className="text-2xl font-black font-mono">
                      {(analysisResult.risk_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-current/10 text-xs font-medium leading-relaxed">
                  {analysisResult.action_description || "Evaluation completed."}
                </div>
              </div>

              {/* 5-Signal Weighted Breakdown Grid */}
              {signals && (
                <div className="surface-card p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-black/[0.05] pb-2">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Adaptive Multi-Signal Weighting Matrix</span>
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-400">Stacking Meta-Weights</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* ML Stacking */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-zinc-600">1. Stacking Ensemble ({signals.ml_ensemble?.weight_pct}%)</span>
                        <span className="font-bold text-blue-600">{((signals.ml_ensemble?.score || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-black/[0.05] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(signals.ml_ensemble?.score || 0) * 100}%` }} />
                      </div>
                    </div>

                    {/* Unsupervised Anomaly */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-zinc-600">2. Isolation Forest Anomaly ({signals.anomaly_engine?.weight_pct}%)</span>
                        <span className="font-bold text-sky-600">{((signals.anomaly_engine?.score || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-black/[0.05] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-600 h-full rounded-full" style={{ width: `${(signals.anomaly_engine?.score || 0) * 100}%` }} />
                      </div>
                    </div>

                    {/* Graph Ring */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-zinc-600">3. Graph &amp; Mule Ring Intel ({signals.graph_intelligence?.weight_pct}%)</span>
                        <span className="font-bold text-rose-600">{((signals.graph_intelligence?.score || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-black/[0.05] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-600 h-full rounded-full" style={{ width: `${(signals.graph_intelligence?.score || 0) * 100}%` }} />
                      </div>
                    </div>

                    {/* Customer Behavioral */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-zinc-600">4. Customer Behavioral Baseline ({signals.behavioral_profiler?.weight_pct}%)</span>
                        <span className="font-bold text-amber-600">{((signals.behavioral_profiler?.score || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-black/[0.05] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-600 h-full rounded-full" style={{ width: `${(signals.behavioral_profiler?.score || 0) * 100}%` }} />
                      </div>
                    </div>

                    {/* Rule Matrix */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-zinc-600">5. Compliance Policy Rule Matrix ({signals.rule_matrix?.weight_pct}%)</span>
                        <span className="font-bold text-zinc-900">{((signals.rule_matrix?.score || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-black/[0.05] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-zinc-900 h-full rounded-full" style={{ width: `${(signals.rule_matrix?.score || 0) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Natural Language Reason Codes */}
              {analysisResult.reason_codes && (
                <div className="surface-card p-5 space-y-2.5">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Plain-English Reason Codes (FCRA / GDPR Art. 22)</span>
                  </h4>

                  <div className="space-y-2">
                    {analysisResult.reason_codes.map((rc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.05] text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-zinc-900">{rc.title}</span>
                          <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{rc.code}</span>
                        </div>
                        <p className="text-zinc-600 text-[11px] leading-relaxed">{rc.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          ) : (
            <div className="surface-card p-12 text-center text-zinc-400 text-xs flex flex-col items-center justify-center min-h-[360px]">
              <Cpu className="w-10 h-10 text-zinc-400 mb-3 animate-pulse" />
              <p className="font-bold text-zinc-900 text-sm">Multi-Signal Risk Engine Ready</p>
              <p className="text-zinc-500 mt-1 max-w-sm">
                Click "Run Multi-Engine FraudShield Inference" to execute Stacking Ensemble, Isolation Forest, Graph Ring detection, and Reason Code generation.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
