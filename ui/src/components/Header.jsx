import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Zap, AlertTriangle, ShieldCheck, Sun, Moon, Calendar, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header = ({ threatMode, onToggleThreatMode, theme, onToggleTheme }) => {
  const [tps, setTps] = useState(12480);
  const [latency, setLatency] = useState(3.8);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTps(prev => Math.floor(12400 + Math.random() * 250));
      setLatency(prev => +(3.5 + Math.random() * 0.7).toFixed(1));
    }, 1200);

    const clockInterval = setInterval(() => {
      const d = new Date();
      setTimeStr(d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2));
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const isDark = theme === 'dark';

  return (
    <header className="relative z-30 mb-8 glass-card px-6 py-4 border border-slate-200/80 dark:border-white/10">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand & Vitality Title */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
              threatMode
                ? 'bg-red-500/10 border-red-500/40 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                : 'bg-violet-500/10 border-violet-500/30 text-[#7C3AED] dark:text-violet-400 shadow-[0_0_20px_rgba(124,58,237,0.2)]'
            }`}>
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${
              isDark ? 'border-[#090D18]' : 'border-white'
            } ${threatMode ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2 font-mono">
                FRAUDSHIELD <span className="text-xs px-3 py-0.5 rounded-full bg-violet-500/10 text-[#7C3AED] dark:text-violet-300 font-mono tracking-widest uppercase border border-violet-500/20 font-bold">PEARL v4.2</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide flex items-center gap-2 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              CINETIC INTELLIGENCE ENGINE • REAL-TIME THREAT STAGING
            </p>
          </div>
        </div>

        {/* Center: System Heartbeat & Live Telemetry Wave */}
        <div className="flex-1 max-w-xl hidden md:flex items-center justify-center gap-6 px-6 py-2.5 rounded-full bg-slate-100/80 dark:bg-[#101726]/90 border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Activity className={`w-5 h-5 ${threatMode ? 'text-red-500' : 'text-[#7C3AED]'} animate-pulse`} />
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase">THROUGHPUT</div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tracking-wider">{tps.toLocaleString()} <span className="text-xs text-slate-400">TX/S</span></div>
            </div>
          </div>

          {/* SVG Heartbeat ECG Wave */}
          <div className="flex-1 h-8 flex items-center overflow-hidden">
            <svg className="w-full h-8" viewBox="0 0 200 40" fill="none">
              <path
                d="M 0 20 L 40 20 L 48 5 L 56 35 L 64 12 L 72 25 L 80 20 L 130 20 L 138 0 L 146 40 L 154 10 L 162 28 L 170 20 L 200 20"
                stroke={threatMode ? '#EF4444' : '#7C3AED'}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="ecg-line"
              />
            </svg>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-white/10 pl-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase">LATENCY</div>
              <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{latency} <span className="text-xs text-slate-400">MS</span></div>
            </div>
          </div>
        </div>

        {/* Right: Date Pill Filter & Controls */}
        <div className="flex items-center gap-3">
          {/* Reference Pill Selector */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-[#101726] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Year to Date</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          <div className="text-right hidden sm:block font-mono">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-widest">{timeStr || '00:00:00.00'}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">UTC-0 ONLINE</div>
          </div>

          {/* Light / Dark Mode Toggle */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onToggleTheme}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            className="p-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#101726] text-slate-700 dark:text-slate-200 hover:border-[#7C3AED] cursor-pointer transition-all shadow-sm flex items-center justify-center"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#7C3AED]" />
            )}
          </motion.button>

          {/* Global Threat Override Toggle */}
          <button
            onClick={onToggleThreatMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-semibold tracking-wider transition-all border cursor-pointer ${
              threatMode
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.25)] animate-pulse'
                : 'bg-slate-100 dark:bg-[#101726] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-[#7C3AED]'
            }`}
          >
            {threatMode ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>STATE: CRITICAL</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>STATE: OPTIMAL</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
