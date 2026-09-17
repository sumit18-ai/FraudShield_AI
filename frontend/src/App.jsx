import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardModule } from './components/DashboardModule';
import { TransactionAnalysisModule } from './components/TransactionAnalysisModule';
import { LiveMonitoringModule } from './components/LiveMonitoringModule';
import { GraphIntelligenceModule } from './components/GraphIntelligenceModule';
import { ReportsModule } from './components/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { LandingPage } from './components/LandingPage';
import { AuthProvider, useAuth } from './lib/auth';
import { AuthModal } from './components/AuthModal';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('landing');
  const [threatMode, setThreatMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }, []);

  // Global hotkeys (1 - 7) for fast keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === '1') setActiveTab('dashboard');
      if (e.key === '2') setActiveTab('transactions');
      if (e.key === '3') setActiveTab('alerts');
      if (e.key === '4') setActiveTab('risk-engine');
      if (e.key === '5') setActiveTab('graph');
      if (e.key === '6') setActiveTab('reports');
      if (e.key === '7') setActiveTab('settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleThreatMode = () => {
    setThreatMode(!threatMode);
  };

  const handleTriggerThreatShift = (isHighRisk) => {
    setThreatMode(isHighRisk);
  };

  if (activeTab === 'landing') {
    return <LandingPage onLaunchDashboard={() => setActiveTab('dashboard')} />;
  }


  return (
    <div className="min-h-screen flex bg-[#F7F7F5] text-[#111111] font-sans selection:bg-black selection:text-white relative">
      <div className="ambient-mesh" />
      
      {/* 1. Left Sidebar (Desktop) */}
      <div className="hidden md:block relative z-20">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-72 h-full bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1 flex flex-col justify-between">
          
          <div>
            {/* Top Bar Header */}
            <TopHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              threatMode={threatMode}
              onToggleThreatMode={handleToggleThreatMode}
              onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              isMobileMenuOpen={isMobileMenuOpen}
            />

            {/* Staged Module Content with Smooth Animated Transitions */}
            <main className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {activeTab === 'dashboard' && (
                    <DashboardModule 
                      onNavigateTab={setActiveTab}
                      searchQuery={searchQuery}
                    />
                  )}

                  {(activeTab === 'transactions' || activeTab === 'risk-engine' || activeTab === 'analysis') && (
                    <TransactionAnalysisModule 
                      onTriggerThreatShift={handleTriggerThreatShift} 
                      onNavigateTab={setActiveTab} 
                    />
                  )}

                  {(activeTab === 'alerts' || activeTab === 'monitoring') && (
                    <LiveMonitoringModule />
                  )}

                  {activeTab === 'graph' && (
                    <GraphIntelligenceModule />
                  )}

                  {(activeTab === 'reports' || activeTab === 'explainability' || activeTab === 'drift' || activeTab === 'comparison') && (
                    <ReportsModule />
                  )}

                  {(activeTab === 'settings' || activeTab === 'federated') && (
                    <SettingsModule />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Clean Reference Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200/70 text-center text-xs text-slate-400 font-medium">
            © 2024 FraudShield AI. All rights reserved.
          </footer>

        </div>
      </div>

    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
      <AuthModal />
    </AuthProvider>
  );
}

export default App;

