import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Activity, GitCompare, FileText } from 'lucide-react';
import { ExplainableAIModule } from './ExplainableAIModule';
import { ConceptDriftModule } from './ConceptDriftModule';
import { ModelComparisonModule } from './ModelComparisonModule';

export const ReportsModule = () => {
  const [subTab, setSubTab] = useState('xai');

  return (
    <div className="space-y-6">
      {/* Subtab Navigation for Reports */}
      <div className="surface-card p-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSubTab('xai')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              subTab === 'xai'
                ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>SHAP &amp; Explainability</span>
          </button>

          <button
            onClick={() => setSubTab('drift')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              subTab === 'drift'
                ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Concept Drift &amp; KS-Test</span>
          </button>

          <button
            onClick={() => setSubTab('comparison')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              subTab === 'comparison'
                ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04]'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Ensemble Benchmarks</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 pr-3 text-[11px] font-mono text-zinc-400">
          <FileText className="w-3.5 h-3.5 text-zinc-600" />
          <span>EU AI Act &amp; FCRA Compliant</span>
        </div>
      </div>

      {/* Render subtab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {subTab === 'xai' && <ExplainableAIModule />}
          {subTab === 'drift' && <ConceptDriftModule />}
          {subTab === 'comparison' && <ModelComparisonModule />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
