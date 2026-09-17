import React, { useState } from 'react';
import { Lock, Shield, Server, Sliders, CheckCircle2 } from 'lucide-react';
import { FederatedLearningModule } from './FederatedLearningModule';

export const SettingsModule = () => {
  const [activeSub, setActiveSub] = useState('federated');
  const [alertThreshold, setAlertThreshold] = useState(70);
  const [autoBlockHighRisk, setAutoBlockHighRisk] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <div className="space-y-6">
      {/* Subtab Navigation for Settings */}
      <div className="surface-card p-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSub('federated')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeSub === 'federated'
                ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Federated Multi-Bank Defense</span>
          </button>

          <button
            onClick={() => setActiveSub('general')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeSub === 'general'
                ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Risk Rules &amp; Thresholds</span>
          </button>
        </div>
      </div>

      {activeSub === 'federated' && <FederatedLearningModule />}

      {activeSub === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Risk Engine Preferences */}
          <div className="surface-card p-6 space-y-5">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Automated Decision Policy</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-zinc-800 mb-2 font-mono">
                  <span>High Risk Auto-Block Threshold</span>
                  <span className="text-blue-600 font-bold">{alertThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(+e.target.value)}
                  className="w-full h-1.5 bg-black/[0.08] rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.05]">
                <div>
                  <div className="font-semibold text-zinc-900">Instant Step-Up 2FA Challenge</div>
                  <div className="text-zinc-400 text-[11px]">Prompt biometric verification for scores 35-69</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoBlockHighRisk}
                  onChange={(e) => setAutoBlockHighRisk(e.target.checked)}
                  className="w-4 h-4 text-black rounded-sm focus:ring-black accent-black"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.05]">
                <div>
                  <div className="font-semibold text-zinc-900">Real-time Webhook Dispatches</div>
                  <div className="text-zinc-400 text-[11px]">Send Kafka/SQS messages on high risk alerts</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-black rounded-sm focus:ring-black accent-black"
                />
              </div>
            </div>
          </div>

          {/* System & Telemetry */}
          <div className="surface-card p-6 space-y-5">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>API Cluster Status</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.05]">
                <span className="text-zinc-600">FastAPI Risk Inference Gateway</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy (:8008)
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.05]">
                <span className="text-zinc-600">Graph Database Engine (NetworkX)</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 5,420 Nodes
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.05]">
                <span className="text-zinc-600">SHAP &amp; LIME Explainer Cache</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready (sub-100ms)
                </span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
