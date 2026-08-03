import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Zap, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, 
  AlertCircle, ShieldCheck, Upload, FileText, ArrowRight, Activity, Eye 
} from 'lucide-react';
import { fetchRandomTransaction, analyzeTransaction } from '../lib/api';

export const TransactionAnalysisModule = ({ onTriggerThreatShift, onNavigateTab }) => {
  const [formData, setFormData] = useState({
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
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  // Computed telemetry
  const errorBalanceOrig = (parseFloat(formData.oldbalanceOrg) || 0) - (parseFloat(formData.amount) || 0) - (parseFloat(formData.newbalanceOrig) || 0);
  const errorBalanceDest = (parseFloat(formData.oldbalanceDest) || 0) + (parseFloat(formData.amount) || 0) - (parseFloat(formData.newbalanceDest) || 0);
  const isHighAmount = (parseFloat(formData.amount) || 0) > 200000;

  const handleFetchRandom = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
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
        selectCsvRow(rows[0], 0);
      }
    };
    reader.readAsText(file);
  };

  const selectCsvRow = (row, index) => {
    setSelectedRowIndex(index);
    setFormData({
      step: parseInt(row.step || 1),
      type: row.type || 'TRANSFER',
      amount: parseFloat(row.amount || 0),
      nameOrig: row.nameOrig || 'C000000000',
      oldbalanceOrg: parseFloat(row.oldbalanceOrg || 0),
      newbalanceOrig: parseFloat(row.newbalanceOrig || 0),
      nameDest: row.nameDest || 'C000000000',
      oldbalanceDest: parseFloat(row.oldbalanceDest || 0),
      newbalanceDest: parseFloat(row.newbalanceDest || 0),
      isFraud: row.isFraud !== undefined ? parseInt(row.isFraud) : undefined
    });
    setAnalysisResult(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setAnalysisResult(null);
  };

  const handleRunInference = async () => {
    setIsAnalyzing(true);
    try {
      const payload = {
        step: parseInt(formData.step) || 1,
        type: String(formData.type),
        amount: parseFloat(formData.amount) || 0,
        nameOrig: String(formData.nameOrig),
        oldbalanceOrg: parseFloat(formData.oldbalanceOrg) || 0,
        newbalanceOrig: parseFloat(formData.newbalanceOrig) || 0,
        nameDest: String(formData.nameDest),
        oldbalanceDest: parseFloat(formData.oldbalanceDest) || 0,
        newbalanceDest: parseFloat(formData.newbalanceDest) || 0
      };

      const result = await analyzeTransaction(payload);
      setAnalysisResult(result);

      if (onTriggerThreatShift) {
        onTriggerThreatShift(result.is_fraud || result.decision === 'Block');
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: CSV Controls & Data Loader */}
      <div className="glass-card p-6 border-l-4 border-l-[#7C3AED]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#7C3AED]" />
              PAYSIM CSV LIVE TRANSACTION ANALYZER
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              INPUT OR INGEST TRANSACTIONS DIRECTLY FROM PAYSIM DATASET FOR LIVE ML INFERENCE & SHAP EXPLANATION
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleFetchRandom}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              FETCH RANDOM PAYSIM ROW
            </button>

            <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 font-medium text-xs cursor-pointer border border-slate-200 dark:border-white/10 transition-all font-mono">
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>{csvFileName ? `CSV: ${csvFileName}` : 'UPLOAD CSV FILE'}</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Optional Parsed Rows Bar if custom CSV uploaded */}
        {parsedRows.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/5">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2 font-mono">
              <FileText className="w-3.5 h-3.5 text-[#7C3AED]" />
              SELECT ROW FROM UPLOADED CSV ({parsedRows.length} ROWS LOADED):
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {parsedRows.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => selectCsvRow(r, idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
                    selectedRowIndex === idx
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                      : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100'
                  }`}
                >
                  Row {idx + 1}: {r.type || 'TX'} ${parseFloat(r.amount || 0).toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Form Inputs & ML Output Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: PaySim Field Editor */}
        <div className="lg:col-span-7 glass-card p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200/80 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#7C3AED]" />
              PaySim Transaction Features
            </h3>
            {formData.isFraud !== undefined && (
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
                formData.isFraud === 1 
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}>
                Ground Truth CSV Label: {formData.isFraud === 1 ? 'FRAUD (1)' : 'LEGIT (0)'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            
            {/* Transaction Type */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Transaction Type (`type`)
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="TRANSFER">TRANSFER</option>
                <option value="CASH_OUT">CASH_OUT</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="DEBIT">DEBIT</option>
                <option value="CASH_IN">CASH_IN</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Amount (`amount`)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Time Step */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Time Step (`step` / hour)
              </label>
              <input
                type="number"
                value={formData.step}
                onChange={(e) => handleInputChange('step', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Origin ID */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Origin Account (`nameOrig`)
              </label>
              <input
                type="text"
                value={formData.nameOrig}
                onChange={(e) => handleInputChange('nameOrig', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Origin Old Balance */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Origin Old Balance (`oldbalanceOrg`)
              </label>
              <input
                type="number"
                value={formData.oldbalanceOrg}
                onChange={(e) => handleInputChange('oldbalanceOrg', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Origin New Balance */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Origin New Balance (`newbalanceOrig`)
              </label>
              <input
                type="number"
                value={formData.newbalanceOrig}
                onChange={(e) => handleInputChange('newbalanceOrig', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Destination ID */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Destination Account (`nameDest`)
              </label>
              <input
                type="text"
                value={formData.nameDest}
                onChange={(e) => handleInputChange('nameDest', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Destination Old Balance */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Destination Old Balance (`oldbalanceDest`)
              </label>
              <input
                type="number"
                value={formData.oldbalanceDest}
                onChange={(e) => handleInputChange('oldbalanceDest', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

            {/* Destination New Balance */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Destination New Balance (`newbalanceDest`)
              </label>
              <input
                type="number"
                value={formData.newbalanceDest}
                onChange={(e) => handleInputChange('newbalanceDest', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-[#7C3AED]"
              />
            </div>

          </div>

          {/* Feature Engineering Live Telemetry Cards */}
          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/5 grid grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-slate-400 block">errorBalanceOrig</span>
              <span className={`font-bold ${Math.abs(errorBalanceOrig) > 0.01 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {errorBalanceOrig.toFixed(2)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-slate-400 block">errorBalanceDest</span>
              <span className={`font-bold ${Math.abs(errorBalanceDest) > 0.01 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {errorBalanceDest.toFixed(2)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <span className="text-slate-400 block">is_high_amount</span>
              <span className={`font-bold ${isHighAmount ? 'text-rose-500' : 'text-slate-400'}`}>
                {isHighAmount ? '1 (> $200k)' : '0'}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              onClick={handleRunInference}
              disabled={isAnalyzing}
              className="w-full py-3 px-6 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm tracking-wide shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>RUNNING ML MODEL INFERENCE...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>RUN LIVE FRAUDSHIELD INFERENCE</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Real-Time ML Decision & SHAP Telemetry */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          
          {analysisResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 flex-1 flex flex-col justify-between border-t-4 border-t-[#7C3AED]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Model Risk Assessment
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    analysisResult.is_fraud || analysisResult.decision === 'Block'
                      ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                  }`}>
                    {analysisResult.decision?.toUpperCase() || (analysisResult.is_fraud ? 'BLOCK' : 'ALLOW')}
                  </span>
                </div>

                {/* Score Dial / Large Indicator */}
                <div className="text-center my-6">
                  <div className="text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                    {(analysisResult.risk_score * 100).toFixed(1)}%
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 block">
                    PREDICTED FRAUD PROBABILITY
                  </span>
                </div>

                {/* SHAP Explanations */}
                {analysisResult.explanations && analysisResult.explanations.length > 0 && (
                  <div className="space-y-3 font-mono text-xs mt-6 pt-4 border-t border-slate-200/80 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                        SHAP Feature Importance Factors
                      </h4>

                      {onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('explainability')}
                          className="text-[11px] font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>DEEP WATERFALL ➔</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {analysisResult.explanations.map((exp, idx) => {
                        const val = typeof exp.shap_value === 'number' ? exp.shap_value : parseFloat(exp.shap_value || 0);
                        const pct = Math.min(Math.abs(val) * 200, 100);
                        const isPositive = val >= 0;

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {exp.feature}
                              </span>
                              <span className={isPositive ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
                                {isPositive ? '+' : ''}{val.toFixed(3)}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isPositive ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.max(pct, 8)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">TreeSHAP Engine Active</span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('explainability')}
                    className="text-[#7C3AED] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>OPEN SHAP TAB</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center flex-1 text-slate-400 font-mono text-xs">
              <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3 animate-bounce" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Inference Result Yet</p>
              <p className="max-w-xs mt-1 text-slate-500">
                Click "RUN LIVE FRAUDSHIELD INFERENCE" or fetch a random PaySim row to execute model evaluation.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
