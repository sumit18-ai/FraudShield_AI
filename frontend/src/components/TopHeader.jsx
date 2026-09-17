import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, Menu, X, ShieldAlert, CheckCircle2, Shield, ChevronDown, Sparkles, User, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '../lib/auth';

export const TopHeader = ({ 
  searchQuery, 
  setSearchQuery, 
  threatMode,
  onToggleThreatMode,
  onToggleMobileMenu,
  isMobileMenuOpen
}) => {
  const { user, role, loginWithPersona, setIsAuthModalOpen, logout } = useAuth();
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [currentTime, setCurrentTime] = useState({
    date: 'Sep 17, 2026',
    time: '11:45 AM'
  });
  const [useLiveClock, setUseLiveClock] = useState(true);

  // Close persona menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsPersonaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!useLiveClock) return;

    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTime({ date: dateStr, time: timeStr });
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [useLiveClock]);

  // Role visual attributes
  const roleBadgeStyle = {
    soc_analyst: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    compliance_officer: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    admin: 'bg-amber-50 text-amber-700 border-amber-200'
  }[role] || 'bg-slate-50 text-zinc-700 border-slate-200';

  const roleLabel = {
    soc_analyst: 'SOC Analyst',
    compliance_officer: 'Compliance Auditor',
    admin: 'System Admin'
  }[role] || role;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  return (
    <header className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      
      {/* Mobile Bar Controls */}
      <div className="flex md:hidden items-center justify-between">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl bg-white/80 border border-black/[0.06] text-zinc-700"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        
        <div className="flex items-center gap-2 font-bold text-zinc-950">
          FraudShield <span className="text-blue-600 font-extrabold">AI</span>
        </div>
      </div>

      {/* Left: Search Input Box */}
      <div className="relative flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions, account hashes, mule rings, or IP..."
            className="w-full pl-10 pr-12 py-2 bg-white/70 backdrop-blur-md border border-black/[0.06] rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black/30 transition-all shadow-xs"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-[11px] text-zinc-400 hover:text-zinc-700 px-1 py-0.5 rounded-sm"
            >
              Clear
            </button>
          ) : (
            <span className="absolute right-3 text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 bg-black/[0.04] rounded-sm pointer-events-none">
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Right: Badges, Telemetry & User Persona */}
      <div className="flex items-center gap-2.5 self-end md:self-center">
        
        {/* Threat Mode Toggle Pill */}
        <div 
          onClick={onToggleThreatMode}
          title="Click to toggle simulated threat surge"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all border backdrop-blur-md ${
            threatMode
              ? 'border-rose-300 text-rose-700 bg-rose-50/80 shadow-xs'
              : 'border-black/[0.06] bg-white/70 text-zinc-700 hover:bg-white/90 hover:border-emerald-300'
          }`}
        >
          {threatMode ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-mono text-[11px]">SURGE ALERT</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-700">Healthy</span>
            </>
          )}
        </div>

        {/* Date & Time Pill */}
        <div 
          onClick={() => setUseLiveClock(!useLiveClock)}
          title="Live UTC/Local Clock"
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 bg-white/70 backdrop-blur-md border border-black/[0.06] rounded-xl text-zinc-700 select-none cursor-pointer hover:bg-white/90 transition-all shadow-xs"
        >
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <div className="text-left font-mono text-[11px] leading-tight">
            <span className="font-semibold text-zinc-800">{currentTime.time}</span>
            <span className="text-zinc-400 ml-1.5 text-[10px]">{currentTime.date}</span>
          </div>
        </div>

        {/* Authenticated Persona & RBAC Control */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md border border-black/[0.08] hover:border-zinc-400 rounded-xl transition-all shadow-xs cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-zinc-950 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-zinc-900 leading-tight flex items-center gap-1.5">
                <span>{user?.name || 'SOC Analyst'}</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 leading-tight">
                {roleLabel}
              </div>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold border hidden sm:inline-block ${roleBadgeStyle}`}>
              {role === 'admin' ? 'ADMIN' : role === 'compliance_officer' ? 'AUDIT' : 'ANALYST'}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 transition-transform" />
          </button>

          {/* Persona Dropdown */}
          {isPersonaMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Active Session Profile</p>
                <p className="font-bold text-zinc-950 mt-0.5">{user?.name}</p>
                <p className="text-zinc-500 text-[11px] truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <p className="px-3.5 py-1 text-[10px] text-zinc-400 uppercase font-semibold">Fast Persona Switcher</p>
                
                <button
                  onClick={() => { loginWithPersona('soc_analyst'); setIsPersonaMenuOpen(false); }}
                  className={`w-full px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer ${
                    role === 'soc_analyst' ? 'font-semibold text-emerald-700 bg-emerald-50/50' : 'text-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Sarah Chen (SOC Analyst)
                  </span>
                  {role === 'soc_analyst' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>

                <button
                  onClick={() => { loginWithPersona('compliance_officer'); setIsPersonaMenuOpen(false); }}
                  className={`w-full px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer ${
                    role === 'compliance_officer' ? 'font-semibold text-cyan-700 bg-cyan-50/50' : 'text-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Marcus Vance (Compliance)
                  </span>
                  {role === 'compliance_officer' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />}
                </button>

                <button
                  onClick={() => { loginWithPersona('admin'); setIsPersonaMenuOpen(false); }}
                  className={`w-full px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer ${
                    role === 'admin' ? 'font-semibold text-amber-700 bg-amber-50/50' : 'text-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Dr. Elena Rostova (Admin/CISO)
                  </span>
                  {role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => { setIsAuthModalOpen(true); setIsPersonaMenuOpen(false); }}
                  className="w-full px-3.5 py-1.5 flex items-center gap-2 text-zinc-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Custom Sign In / Register</span>
                </button>
                <button
                  onClick={() => { logout(); setIsPersonaMenuOpen(false); }}
                  className="w-full px-3.5 py-1.5 flex items-center gap-2 text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Reset Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};

