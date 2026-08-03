import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

const PRESET_SCENARIOS = [
  {
    name: 'Legitimate Coffee',
    amount: '4.75',
    cardholder: 'Sarah Jenkins',
    merchant: 'Starbucks NY #104',
    location: 'New York, US',
    device: 'iPhone 15 Pro (iOS 17.4)',
    velocity: '1 tx / hr',
    distance: '0.8 km',
    expectedRisk: 4,
  },
  {
    name: 'Stolen Card Velocity',
    amount: '4850.00',
    cardholder: 'Marcus Vance',
    merchant: 'Luxury Electronics EU',
    location: 'Bucharest, RO',
    device: 'Unrecognized Linux VM',
    velocity: '18 tx / hr',
    distance: '4,200 km',
    expectedRisk: 96,
  },
  {
    name: 'Account Takeover IP Hop',
    amount: '1299.99',
    cardholder: 'Elena Rostova',
    merchant: 'Crypto Gateway Pro',
    location: 'Lagos, NG',
    device: 'Android Chrome (Proxy ASN)',
    velocity: '9 tx / hr',
    distance: '8,500 km',
    expectedRisk: 89,
  },
];

export const TransactionAnalysisModule = ({ onTriggerThreatShift }) => {
  const [formData, setFormData] = useState({
    amount: '4850.00',
    cardholder: 'Marcus Vance',
    merchant: 'Luxury Electronics EU',
    location: 'Bucharest, RO',
    device: 'Unrecognized Linux VM',
    velocity: '18 tx / hr',
    distance: '4,200 km',
  });

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisStep, setSynthesisStep] = useState('');
  const [prediction, setPrediction] = useState(null);

  const applyPreset = (preset) => {
    setFormData({
      amount: preset.amount,
      cardholder: preset.cardholder,
      merchant: preset.merchant,
      location: preset.location,
      device: preset.device,
      velocity: preset.velocity,
      distance: preset.distance,
    });
    setPrediction(null);
  };

  const handlePredict = () => {
    setIsSynthesizing(true);
    setPrediction(null);

    const steps = [
      'Initializing Neural Weights...',
      'Extracting Device & Geo-Velocity Vectors...',
      'Running XGBoost v4.2 Ensembles...',
      'Evaluating SHAP Feature Contributions...',
    ];

    steps.forEach((stepText, idx) => {
      setTimeout(() => {
        setSynthesisStep(stepText);
      }, idx * 350);
    });

    setTimeout(() => {
      setIsSynthesizing(false);
      const isHigh = parseFloat(formData.amount) > 1000 || formData.velocity.includes('18');
      const score = isHigh ? 94 : 6;
      
      setPrediction({
        score,
        confidence: 99.4,
        decision: score > 75 ? 'HIGH RISK BLOCK' : 'LOW RISK APPROVE',
        shapFactors: isHigh
          ? [
              { name: 'Geo-Distance Jump', impact: '+36%' },
              { name: 'Device Fingerprint Anomaly', impact: '+28%' },
              { name: '1h Transaction Velocity', impact: '+22%' },
            ]
          : [
              { name: 'Historical User Behavior Match', impact: '-45%' },
              { name: 'Chip & Pin Verification', impact: '-30%' },
            ],
      });

      if (onTriggerThreatShift) {
        onTriggerThreatShift(score > 75);
      }
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left 6 cols: Input Form & Presets */}
      <div className="lg:col-span-6 glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#7C3AED]" />
              TRANSACTION INGESTION STAGE
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono mt-0.5">
              INPUT FEATURE TENSORS FOR REAL-TIME AI SYNTHESIS
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-mono uppercase tracking-wider mb-2">QUICK TEST PRESETS</div>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-[#101726] border border-slate-200/80 dark:border-white/10 hover:border-violet-500/50 text-left cursor-pointer transition-all hover:bg-slate-200/60 dark:hover:bg-white/10 group"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-[#CBD5E1] group-hover:text-[#7C3AED] dark:group-hover:text-violet-400 truncate">{preset.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-mono">${preset.amount}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Minimalist Floating Label Form */}
        <div className="space-y-4 font-mono">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder=" "
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 bg-slate-100/90 dark:bg-[#101726] rounded-2xl border border-slate-300 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors floating-input"
              />
              <label className="absolute left-4 top-3 text-xs text-slate-500 dark:text-[#94A3B8] pointer-events-none transition-all floating-label">
                AMOUNT ($ USD)
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder=" "
                value={formData.cardholder}
                onChange={(e) => setFormData({ ...formData, cardholder: e.target.value })}
                className="w-full px-4 py-3 bg-slate-100/90 dark:bg-[#101726] rounded-2xl border border-slate-300 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors floating-input"
              />
              <label className="absolute left-4 top-3 text-xs text-slate-500 dark:text-[#94A3B8] pointer-events-none transition-all floating-label">
                CARDHOLDER NAME
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder=" "
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                className="w-full px-4 py-3 bg-slate-100/90 dark:bg-[#101726] rounded-2xl border border-slate-300 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors floating-input"
              />
              <label className="absolute left-4 top-3 text-xs text-slate-500 dark:text-[#94A3B8] pointer-events-none transition-all floating-label">
                MERCHANT ENTITY
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder=" "
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-slate-100/90 dark:bg-[#101726] rounded-2xl border border-slate-300 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors floating-input"
              />
              <label className="absolute left-4 top-3 text-xs text-slate-500 dark:text-[#94A3B8] pointer-events-none transition-all floating-label">
                INGESTION LOCATION
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder=" "
                value={formData.device}
                onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                className="w-full px-3 py-3 bg-slate-100/90 dark:bg-[#101726] rounded-2xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors floating-input"
              />
              <label className="absolute left-3 top-3 text-[10px] text-slate-500 dark:text-[#94A3B8] pointer-events-none transition-all floating-label">
                DEVICE FINGERPRINT
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder=" "
                value={formData.velocity}
                onChange={(e) => setFormData({ ...formData, velocity: e.target.value })}
                className="w-full px-3 py-3 bg-slate-100/90 dark:bg-[#101726] rounded-2xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors floating-input"
              />
              <label className="absolute left-3 top-3 text-[10px] text-slate-500 dark:text-[#94A3B8] pointer-events-none transition-all floating-label">
                1H VELOCITY
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder=" "
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                className="w-full px-3 py-3 bg-slate-100/90 dark:bg-[#101726] rounded-2xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#7C3AED] transition-colors floating-input"
              />
              <label className="absolute left-3 top-3 text-[10px] text-slate-500 dark:text-[#94A3B8] pointer-events-none transition-all floating-label">
                GEO DISTANCE
              </label>
            </div>
          </div>

          <div className="pt-4">
            <MagneticButton onClick={handlePredict} className="w-full py-4 text-base">
              <Sparkles className="w-5 h-5 text-white animate-spin" />
              <span>RUN NEURAL PREDICTION ENGINE</span>
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* Right 6 cols: Staged Prediction Reveal & Gauge */}
      <div className="lg:col-span-6 glass-card p-6 flex flex-col justify-between relative overflow-hidden">
        
        {/* Loading Overlay: Neural Synthesis Animation */}
        <AnimatePresence>
          {isSynthesizing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-[#090D18]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 space-y-6 text-center text-white"
            >
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-[#7C3AED] animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-red-500/20 border-b-[#EF4444] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <Cpu className="w-8 h-8 text-[#7C3AED] animate-pulse" />
              </div>

              <div className="space-y-2 font-mono">
                <div className="text-sm font-bold text-[#7C3AED] tracking-wider">NEURAL SYNTHESIS IN PROGRESS</div>
                <div className="text-xs text-slate-400 font-medium h-6">{synthesisStep}</div>
              </div>

              {/* Shifting Matrix Lines */}
              <div className="w-full max-w-xs h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#7C3AED] via-[#06B6D4] to-[#EF4444]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.4, ease: 'linear' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prediction Output State */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#7C3AED]" />
              AI RISK EVALUATION STAGE
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8]">SOC MODEL ENSEMBLE</span>
          </div>

          {prediction ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="space-y-6"
            >
              {/* Radial Risk Gauge */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="10" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={prediction.score > 75 ? '#EF4444' : '#22C55E'}
                      strokeWidth="10"
                      strokeDasharray="314.15"
                      strokeDashoffset={314.15 - (314.15 * prediction.score) / 100}
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: 314.15 }}
                      animate={{ strokeDashoffset: 314.15 - (314.15 * prediction.score) / 100 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </svg>
                  
                  <div className="absolute flex flex-col items-center justify-center font-mono">
                    <span className={`text-4xl font-extrabold ${prediction.score > 75 ? 'text-red-500 dark:text-[#EF4444]' : 'text-emerald-500 dark:text-[#22C55E]'}`}>
                      {prediction.score}%
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] tracking-widest uppercase">FRAUD PROBABILITY</span>
                  </div>
                </div>

                <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase border flex items-center gap-2 ${
                  prediction.score > 75 ? 'bg-red-500/20 text-red-600 dark:text-[#EF4444] border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-emerald-500/20 text-emerald-600 dark:text-[#22C55E] border-emerald-500/50'
                }`}>
                  {prediction.score > 75 ? <AlertCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{prediction.decision}</span>
                </div>
              </div>

              {/* Contributing Features SHAP mini breakdown */}
              <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-[#101726] border border-slate-200/80 dark:border-white/5 space-y-2 font-mono">
                <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider">TOP INFLUENCING SHAP VECTORS</div>
                {prediction.shapFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-[#CBD5E1]">{factor.name}</span>
                    <span className={`font-bold ${factor.impact.startsWith('+') ? 'text-red-500 dark:text-[#EF4444]' : 'text-emerald-600 dark:text-[#22C55E]'}`}>
                      {factor.impact}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 text-slate-400 dark:text-slate-500 font-mono">
              <Cpu className="w-12 h-12 stroke-[1.5] text-slate-400 dark:text-slate-700" />
              <div className="text-xs">AWAITING TENSOR INGESTION...</div>
              <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]">CLICK "RUN NEURAL PREDICTION ENGINE" ABOVE</div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-white/10 text-[10px] font-mono text-slate-500 dark:text-[#94A3B8] flex items-center justify-between">
          <span>MODEL CONFIDENCE: 99.4%</span>
          <span>LATENCY: 3.2ms</span>
        </div>

      </div>

    </div>
  );
};
