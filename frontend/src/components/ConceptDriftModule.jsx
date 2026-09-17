import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, AlertTriangle, CheckCircle, Flame, RefreshCw, 
  TrendingUp, Shield, Cpu, Play, BarChart2, Info, ShieldAlert
} from 'lucide-react';
import { API_BASE_URL, fetchWithAuth } from '../lib/api';
import { useAuth } from '../lib/auth';

export function ConceptDriftModule() {
  const { role, loginWithPersona } = useAuth();
  const [driftData, setDriftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [rbacMessage, setRbacMessage] = useState(null);

  const fetchDriftStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/drift/status`);
      if (res.ok) {
        const data = await res.json();
        setDriftData(data);
      }
    } catch (e) {
      console.warn("Backend offline or local simulation fallback", e);
      setDriftData({
        overall_psi: 0.142,
        model_status: "WARNING_MODERATE_DRIFT",
        window_sample_count: 100,
        recommendation: "Data distribution drift detected in input features. Monitor closely; schedule automated hyperparameter recalibration.",
        retraining_recommended: false,
        feature_metrics: [
          { feature: "amount", psi_value: 0.285, status: "CRITICAL_DRIFT", color: "#EF4444", baseline_mean: 180.5, current_mean: 940.2 },
          { feature: "oldbalanceOrg", psi_value: 0.112, status: "MODERATE_DRIFT", color: "#F59E0B", baseline_mean: 4500.0, current_mean: 6200.0 },
          { feature: "newbalanceOrig", psi_value: 0.085, status: "STABLE", color: "#10B981", baseline_mean: 4200.0, current_mean: 4350.0 },
          { feature: "errorBalanceOrig", psi_value: 0.086, status: "STABLE", color: "#10B981", baseline_mean: 0.2, current_mean: 0.5 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSpike = async (type) => {
    if (role !== 'admin') {
      setRbacMessage("Admin privilege required to trigger synthetic concept drift spikes.");
      return;
    }
    setRbacMessage(null);
    setSimulating(true);
    try {
      const res = await fetchWithAuth(`/drift/simulate-spike?drift_type=${type}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDriftData(data);
      } else if (res.status === 403) {
        setRbacMessage("Server 403 Forbidden: Active session role does not have administrative permissions.");
      }
    } catch (e) {
      console.warn("Simulation call error", e);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchDriftStatus();
  }, []);

  const overallPsi = driftData?.overall_psi || 0.05;
  const isCritical = overallPsi >= 0.25;
  const isModerate = overallPsi >= 0.10 && overallPsi < 0.25;

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">
              MLOps Concept Drift & Population Stability Index (PSI)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Real-time statistical divergence tracking between model training reference distributions and active production transaction traffic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDriftStatus}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer flex items-center gap-2 border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh PSI
          </button>
        </div>
      </div>

      {/* Primary PSI Status Banner */}
      <div className={`p-6 rounded-2xl border transition-all duration-500 ${
        isCritical 
          ? 'bg-rose-50 border-rose-200 text-rose-700' 
          : isModerate
          ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
              isCritical ? 'bg-rose-600 text-white' : isModerate ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isCritical ? '⚠️' : isModerate ? '⚡' : '✓'}
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider font-semibold opacity-80">
                System Calibration Status
              </div>
              <div className="text-xl font-bold font-mono">
                {driftData?.model_status?.replace(/_/g, ' ') || 'OPTIMAL CALIBRATION'}
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-xs font-mono opacity-80">Aggregate Population Stability Index</div>
            <div className="text-3xl font-extrabold font-mono">
              PSI {overallPsi.toFixed(4)}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-current/10 text-xs font-medium leading-relaxed">
          {driftData?.recommendation || "Model is operating within optimal statistical tolerances."}
        </div>
      </div>

      {/* Feature Breakdown Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {driftData?.feature_metrics?.map((metric) => (
          <div 
            key={metric.feature}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-slate-800">{metric.feature}</span>
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono border"
                style={{ backgroundColor: `${metric.color}15`, color: metric.color, borderColor: `${metric.color}30` }}
              >
                {metric.status}
              </span>
            </div>

            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-slate-800">
                {metric.psi_value.toFixed(4)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Feature PSI</div>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: `${Math.min(100, metric.psi_value * 250)}%`,
                  backgroundColor: metric.color 
                }} 
              />
            </div>

            <div className="text-[10px] font-mono text-slate-500 space-y-0.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Baseline Mean:</span>
                <span className="font-semibold text-slate-700">{metric.baseline_mean}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Mean:</span>
                <span className="font-semibold text-slate-700">{metric.current_mean}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RBAC Notification Banner */}
      {rbacMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{rbacMessage}</span>
          </div>
          <button
            onClick={() => { loginWithPersona('admin'); setRbacMessage(null); }}
            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition cursor-pointer shrink-0"
          >
            Elevate to Admin
          </button>
        </div>
      )}

      {/* Adversarial Drift Simulation Sandbox */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h4 className="text-base font-bold text-slate-800">
              Adversarial Drift &amp; Threat Vector Sandbox
            </h4>
          </div>
          {role !== 'admin' && (
            <span className="text-[11px] text-amber-600 font-medium">
              Admin only • <button onClick={() => loginWithPersona('admin')} className="underline font-bold cursor-pointer">Elevate to Admin</button>
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Inject synthetic real-world non-stationary traffic spikes to evaluate how the automated MLOps subsystem detects covariate shift and initiates retrain recommendations.
        </p>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleSimulateSpike('HIGH_AMOUNT_BURST')}
            disabled={simulating}
            className="p-4 rounded-xl bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-800 group-hover:text-rose-600">
                1. High-Value Attack Burst
              </span>
              <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Injects sudden +800% volume increase simulating an organized holiday fraud spree or massive credential stuffing attack.
            </p>
          </button>

          <button
            onClick={() => handleSimulateSpike('ZERO_BALANCE_ATTACK')}
            disabled={simulating}
            className="p-4 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-800 group-hover:text-amber-600">
                2. Zero-Balance Liquidation Spike
              </span>
              <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Injects rapid successive drain transactions emptying accounts completely to ₹0 / $0 to trigger mathematical balance drift.
            </p>
          </button>
        </div>
      </div>

    </div>
  );
}
