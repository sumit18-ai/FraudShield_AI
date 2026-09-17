import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Bell, 
  ShieldCheck, 
  Share2, 
  FileText, 
  Settings,
  ChevronDown,
  Shield,
  Compass,
  Activity,
  Radio
} from 'lucide-react';

export const SIDEBAR_ITEMS = [
  { id: 'landing', label: 'Product Overview', icon: Compass },
  { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Diagnostic Engine', icon: CreditCard },
  { id: 'alerts', label: 'Live Telemetry', icon: Bell },
  { id: 'graph', label: 'Graph Intelligence', icon: Share2 },
  { id: 'reports', label: 'XAI & Drift Reports', icon: FileText },
  { id: 'settings', label: 'Node Federation', icon: Settings },
];

export const Sidebar = ({ activeTab, setActiveTab, unreadAlerts = 3 }) => {
  return (
    <aside className="w-64 bg-white/60 backdrop-blur-2xl border-r border-black/[0.06] flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40 transition-all">
      
      {/* Top: Brand Logo */}
      <div className="p-6">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setActiveTab('landing')}
          title="Return to Product Overview"
        >
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-sm">FS</span>
          </div>
          <div>
            <div className="flex items-center gap-1 font-bold text-lg text-zinc-950 tracking-tight">
              FraudShield <span className="text-blue-600 font-extrabold">AI</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-medium tracking-wide">
              Real-Time Defense SOC
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-7 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || 
              (item.id === 'transactions' && (activeTab === 'analysis' || activeTab === 'risk-engine')) ||
              (item.id === 'reports' && (activeTab === 'explainability' || activeTab === 'drift' || activeTab === 'comparison')) ||
              (item.id === 'alerts' && activeTab === 'monitoring') ||
              (item.id === 'settings' && activeTab === 'federated');

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'transactions') setActiveTab('analysis');
                  else if (item.id === 'alerts') setActiveTab('monitoring');
                  else if (item.id === 'reports') setActiveTab('explainability');
                  else if (item.id === 'settings') setActiveTab('settings');
                  else setActiveTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer select-none text-left ${
                  isActive
                    ? 'bg-zinc-950 text-white font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span className="tracking-tight">{item.label}</span>
                </div>

                {item.id === 'alerts' && unreadAlerts > 0 && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive 
                      ? 'bg-rose-500/30 text-rose-200' 
                      : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                  }`}>
                    {unreadAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Telemetry & Profile Card */}
      <div className="p-4 border-t border-black/[0.05]">
        <div className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.04] shadow-xs hover:border-black/[0.08] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                TC
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-zinc-900 text-xs truncate">
                  TCET Risk Analyst
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  FastAPI :8008 Connected
                </div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>

          <div className="mt-2.5 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <Activity className="w-3 h-3" />
              42ms SLA
            </span>
            <span>Stacking v4.2</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
