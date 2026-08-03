import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Radio, Cpu, Eye, GitCompare } from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tag: 'CMD CENTRAL' },
  { id: 'monitoring', label: 'Live Monitoring', icon: Radio, tag: 'STREAMING' },
  { id: 'analysis', label: 'Transaction AI', icon: Cpu, tag: 'PREDICTION' },
  { id: 'explainability', label: 'Explainable AI', icon: Eye, tag: 'XAI GLASS BOX' },
  { id: 'comparison', label: 'Model Lab', icon: GitCompare, tag: 'ROC LAB' },
];

export const Navigation = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="relative z-30 mb-8 flex justify-center">
      <div className="glass-pill p-1.5 rounded-full flex items-center gap-1.5 max-w-full overflow-x-auto border border-slate-200/80 dark:border-white/10">
        {NAVIGATION_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer select-none whitespace-nowrap ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 pearl-btn-gradient rounded-full shadow-[0_4px_20px_rgba(124,58,237,0.3)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
              
              <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="relative z-10 font-mono tracking-wide">{item.label}</span>
              <span className={`relative z-10 text-[9px] px-1.5 py-0.5 rounded-full font-mono hidden sm:inline-block ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}>
                {index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
