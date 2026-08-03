import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CursorSpotlight } from './components/CursorSpotlight';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardModule } from './components/DashboardModule';
import { LiveMonitoringModule } from './components/LiveMonitoringModule';
import { TransactionAnalysisModule } from './components/TransactionAnalysisModule';
import { ExplainableAIModule } from './components/ExplainableAIModule';
import { ModelComparisonModule } from './components/ModelComparisonModule';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [threatMode, setThreatMode] = useState(false);
  const [theme, setTheme] = useState('light'); // Light mode default matching user's image

  // Handle theme attribute on html tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Global hotkeys (1 - 5) for quick navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '1') setActiveTab('dashboard');
      if (e.key === '2') setActiveTab('monitoring');
      if (e.key === '3') setActiveTab('analysis');
      if (e.key === '4') setActiveTab('explainability');
      if (e.key === '5') setActiveTab('comparison');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const handleToggleThreatMode = () => {
    const nextThreat = !threatMode;
    setThreatMode(nextThreat);
    if (nextThreat) {
      document.documentElement.style.setProperty('--pearl-glow', 'rgba(239, 68, 68, 0.25)');
    } else {
      document.documentElement.style.setProperty('--pearl-glow', theme === 'dark' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(124, 58, 237, 0.08)');
    }
  };

  const handleTriggerThreatShift = (isHighRisk) => {
    setThreatMode(isHighRisk);
    if (isHighRisk) {
      document.documentElement.style.setProperty('--pearl-glow', 'rgba(239, 68, 68, 0.25)');
    } else {
      document.documentElement.style.setProperty('--pearl-glow', theme === 'dark' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(124, 58, 237, 0.08)');
    }
  };

  return (
    <div className={`min-h-screen relative text-slate-900 dark:text-[#F8FAFC] selection:bg-[#7C3AED] selection:text-white transition-colors duration-500 ${
      threatMode
        ? theme === 'dark' ? 'bg-[#0f0408]' : 'bg-[#fff1f2]'
        : theme === 'dark' ? 'bg-[#090D18]' : 'bg-[#F0F3FF]'
    }`}>
      {/* Background Vacuum & Ambient Glow System */}
      <CursorSpotlight />

      {/* Main Application Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* System Vitality Header */}
        <Header
          threatMode={threatMode}
          onToggleThreatMode={handleToggleThreatMode}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Glass Pill Navigation */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Staged Module Content with Animated Transitions */}
        <main className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'dashboard' && <DashboardModule />}
              {activeTab === 'monitoring' && <LiveMonitoringModule />}
              {activeTab === 'analysis' && <TransactionAnalysisModule onTriggerThreatShift={handleTriggerThreatShift} />}
              {activeTab === 'explainability' && <ExplainableAIModule />}
              {activeTab === 'comparison' && <ModelComparisonModule />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer info */}
        <footer className="mt-16 pt-6 border-t border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 dark:text-[#94A3B8] gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
            <span>FRAUDSHIELD CINETIC INTELLIGENCE • PEARL VIOLET DASHBOARD</span>
          </div>
          <div>PRESS HOTKEYS <span className="text-slate-800 dark:text-[#CBD5E1] font-bold">1 - 5</span> TO SWITCH STAGES</div>
        </footer>

      </div>
    </div>
  );
}

export default App;
