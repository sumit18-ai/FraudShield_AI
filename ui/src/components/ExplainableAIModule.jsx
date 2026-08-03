import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Sparkles, HelpCircle, FileText, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

const SHAP_FEATURES = [
  { id: 'geo', name: 'Geo-Velocity Jump (4,200 km)', base: 12, impact: +34, category: 'Location Anomaly', desc: 'Transaction location jumped 4,200km from previous card tap in 8 minutes (Impossible Travel Speed).' },
  { id: 'device', name: 'Device Fingerprint Swap', base: 5, impact: +28, category: 'Hardware Identity', desc: 'Device OS switched from iOS 17 (trusted device) to an unrecognized headless Linux VM.' },
  { id: 'velocity', name: '1-Hour Transaction Velocity (18 tx)', base: 2, impact: +18, category: 'Frequency', desc: '18 high-value checkout attempts executed within 60 minutes across 4 merchant categories.' },
  { id: 'ip', name: 'ASN Proxy / Tor Exit Node', base: 8, impact: +14, category: 'Network IP', desc: 'IP address belongs to a known commercial proxy pool (ASN 4134).' },
  { id: 'merchant', name: 'High Risk Merchant Category', base: 15, impact: +8, category: 'Merchant Risk', desc: 'Merchant classified under High Risk Electronics Gift Card Reseller.' },
  { id: 'loyalty', name: 'Historical Account Age (5 yrs)', base: 80, impact: -18, category: 'User Trust', desc: 'Account has 5+ years of zero-chargeback history, reducing total risk score by 18 points.' },
];

export const ExplainableAIModule = () => {
  const [activeFeature, setActiveFeature] = useState(SHAP_FEATURES[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left 7 cols: Interactive SHAP Waterfall Bars */}
      <div className="lg:col-span-7 glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#7C3AED]" />
              SHAP FEATURE WATERFALL (XAI)
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono mt-0.5">
              SHAPLEY ADDITIVE EXPLANATIONS • FEATURE CONTRIBUTION TO RISK SCORE
            </p>
          </div>
          <span className="text-xs font-mono text-[#7C3AED] dark:text-violet-300 bg-violet-500/10 border border-violet-500/30 px-3 py-1 rounded-full font-bold">
            BASE MODEL SCORE: 20
          </span>
        </div>

        {/* Feature Bars */}
        <div className="space-y-4 font-mono">
          {SHAP_FEATURES.map((feature) => {
            const isPositive = feature.impact > 0;
            const isSelected = activeFeature.id === feature.id;
            const barWidth = Math.abs(feature.impact) * 2.2;

            return (
              <div
                key={feature.id}
                onMouseEnter={() => setActiveFeature(feature)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-[#101726] border-[#7C3AED]/50 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
                    : 'bg-slate-50/50 dark:bg-[#101726]/40 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">{feature.category}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{feature.name}</span>
                  </div>
                  <span className={`font-bold text-sm ${isPositive ? 'text-red-600 dark:text-[#EF4444]' : 'text-emerald-600 dark:text-[#22C55E]'}`}>
                    {isPositive ? `+${feature.impact} pts` : `${feature.impact} pts`}
                  </span>
                </div>

                {/* Animated Horizontal Impact Bar */}
                <div className="relative w-full h-3 bg-slate-200 dark:bg-[#090D18] rounded-full overflow-hidden flex items-center">
                  <div className="absolute left-1/2 w-0.5 h-full bg-slate-400 dark:bg-white/20" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      isPositive ? 'bg-gradient-to-r from-[#EF4444] to-[#F97316]' : 'bg-gradient-to-r from-[#22C55E] to-[#7C3AED]'
                    }`}
                    style={{
                      marginLeft: isPositive ? '50%' : `calc(50% - ${barWidth}%)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right 5 cols: Natural Language Generation (NLG) Block */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* NLG Narrative Block */}
        <div className="glass-card p-6 border-violet-500/30 bg-slate-900 dark:bg-[#090D18] text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#7C3AED] animate-pulse" />
              <h4 className="text-sm font-bold font-mono text-violet-300 uppercase tracking-wider">
                SYNTHESIZED NATURAL LANGUAGE (NLG)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              GPT-4O SOC REASONER
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 dark:bg-[#101726] border border-white/10 text-slate-200 text-sm leading-relaxed font-sans space-y-3">
            <p>
              "FraudShield AI flagged transaction <span className="font-mono text-violet-300 font-bold">#TX-9081</span> with{' '}
              <span className="font-mono text-rose-400 font-bold">94.2% confidence</span> due to a critical anomaly stack."
            </p>
            <p className="text-xs text-slate-300 border-l-2 border-red-500 pl-3 py-1 bg-red-500/5">
              The primary driver is an impossible <span className="text-white font-semibold">4,200 km geo-velocity jump</span> occurring within 8 minutes of the cardholder's last verified transaction in New York, combined with an unrecognized Linux VM hardware fingerprint on a high-risk proxy IP range.
            </p>
          </div>

          <div className="mt-4 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>RECOMMENDATION: <span className="text-rose-400 font-bold">HARD BLOCK & NOTIFY</span></span>
            <span className="text-[#7C3AED] font-bold">0.4ms NLG latency</span>
          </div>
        </div>

        {/* Feature Deep Dive Card */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[#7C3AED]" />
            <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
              FEATURE DEEP-DIVE INSPECTOR
            </h4>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-[#101726] border border-slate-200/80 dark:border-white/5 space-y-2 font-mono">
            <div className="text-xs font-bold text-[#7C3AED] dark:text-violet-300">{activeFeature.name}</div>
            <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]">CATEGORY: {activeFeature.category}</div>
            <div className="text-xs text-slate-700 dark:text-[#CBD5E1] font-sans leading-normal pt-1 border-t border-slate-200/80 dark:border-white/5">
              {activeFeature.desc}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
