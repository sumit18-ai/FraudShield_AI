import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Pause, Play, ShieldAlert, Globe, ArrowUpRight, Lock, MapPin, Zap } from 'lucide-react';

const INITIAL_TRANSACTIONS = [
  { id: 'tx-9081', time: '14:23:01', user: 'usr_8829', origin: 'Lagos, NG', target: 'Stripe Merchant US', amount: '$4,850.00', risk: 96, vector: 'Geo-Velocity Anomaly', status: 'BLOCKED' },
  { id: 'tx-9080', time: '14:22:58', user: 'usr_1024', origin: 'Tokyo, JP', target: 'Global Cloud AWS', amount: '$12.50', risk: 4, vector: 'Standard Merchant', status: 'CLEARED' },
  { id: 'tx-9079', time: '14:22:52', user: 'usr_4910', origin: 'Bucharest, RO', target: 'Coinbase EU', amount: '$12,400.00', risk: 91, vector: 'ASN Proxy Hop', status: 'BLOCKED' },
  { id: 'tx-9078', time: '14:22:45', user: 'usr_7712', origin: 'New York, US', target: 'Apple Store Online', amount: '$1,299.00', risk: 12, vector: 'Card Present Chip', status: 'CLEARED' },
];

const GEO_NODES = [
  { id: 'lagos', name: 'Lagos', x: 480, y: 260, threat: true },
  { id: 'bucharest', name: 'Bucharest', x: 520, y: 180, threat: true },
  { id: 'tokyo', name: 'Tokyo', x: 780, y: 210, threat: false },
  { id: 'nyc', name: 'New York', x: 260, y: 190, threat: true },
  { id: 'london', name: 'London Target', x: 460, y: 160, isTarget: true },
];

export const LiveMonitoringModule = () => {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [isPaused, setIsPaused] = useState(false);
  const [activeBeam, setActiveBeam] = useState({ source: 'lagos', target: 'london', risk: 96 });

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const isHighRisk = Math.random() > 0.45;
      const origins = ['Lagos, NG', 'Bucharest, RO', 'Sao Paulo, BR', 'Moscow, RU', 'Tokyo, JP', 'Singapore, SG'];
      const targets = ['Stripe Merchant US', 'AWS Cloud Services', 'Crypto Exchange X', 'Apple Store Online'];
      const vectors = ['Geo-Velocity Anomaly', 'ASN Proxy Hop', 'Stolen Card Velocity', 'Device Fingerprint Swap'];

      const randomOrigin = origins[Math.floor(Math.random() * origins.length)];
      const riskScore = isHighRisk ? Math.floor(82 + Math.random() * 16) : Math.floor(3 + Math.random() * 25);
      
      const newTx = {
        id: `tx-${Math.floor(1000 + Math.random() * 9000)}`,
        time: new Date().toTimeString().split(' ')[0],
        user: `usr_${Math.floor(1000 + Math.random() * 9000)}`,
        origin: randomOrigin,
        target: targets[Math.floor(Math.random() * targets.length)],
        amount: `$${(Math.random() * (isHighRisk ? 8000 : 300)).toFixed(2)}`,
        risk: riskScore,
        vector: isHighRisk ? vectors[Math.floor(Math.random() * vectors.length)] : 'Standard Match',
        status: isHighRisk ? 'BLOCKED' : 'CLEARED',
      };

      setTransactions(prev => [newTx, ...prev.slice(0, 7)]);
      
      if (isHighRisk) {
        setActiveBeam({
          source: randomOrigin.toLowerCase().split(',')[0],
          target: 'london',
          risk: riskScore,
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left 7 cols: The Signal Streaming Feed */}
      <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#7C3AED] animate-pulse" />
                HIGH-VELOCITY SIGNAL FEED
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono mt-0.5">
                REAL-TIME TRANSACTION STREAM & INGESTION TELEMETRY
              </p>
            </div>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-semibold cursor-pointer border transition-all ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-600 dark:text-[#F59E0B] border-amber-500/40'
                  : 'bg-violet-500/10 text-[#7C3AED] dark:text-[#8B5CF6] border-violet-500/30 hover:bg-violet-500/20'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'RESUME STREAM' : 'PAUSE INGEST'}</span>
            </button>
          </div>

          {/* Transaction Stream List with AnimatePresence */}
          <div className="space-y-3 font-mono">
            <AnimatePresence initial={false}>
              {transactions.map((tx) => {
                const isDanger = tx.risk > 75;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: -25, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                      isDanger
                        ? 'bg-red-500/10 dark:bg-red-950/20 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                        : 'bg-slate-100/70 dark:bg-[#101726] border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-xs ${
                        isDanger ? 'bg-red-500/20 text-red-600 dark:text-[#EF4444] border-red-500/50' : 'bg-violet-500/10 text-[#7C3AED] dark:text-[#8B5CF6] border-violet-500/30'
                      }`}>
                        {tx.risk}%
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                          <span>{tx.id}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 dark:text-[#CBD5E1]">{tx.user}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-[#7C3AED] dark:text-[#8B5CF6]">{tx.origin}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] flex items-center gap-2 mt-0.5">
                          <span>{tx.vector}</span>
                          <span>→</span>
                          <span className="text-slate-700 dark:text-[#CBD5E1]">{tx.target}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">{tx.amount}</div>
                      <div className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase inline-block mt-0.5 ${
                        isDanger ? 'bg-red-500/20 text-red-600 dark:text-[#EF4444] border border-red-500/30' : 'bg-emerald-500/20 text-emerald-600 dark:text-[#22C55E] border border-emerald-500/30'
                      }`}>
                        {tx.status}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right 5 cols: Geographic Telemetry Map */}
      <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#7C3AED]" />
              GEOGRAPHIC TELEMETRY
            </h3>
            <span className="text-xs font-mono text-red-600 dark:text-[#EF4444] bg-red-500/10 border border-red-500/20 px-3 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              LIVE PULSE
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono mb-6">
            REAL-TIME ATTACK ARCS & MERCHANT NODE THREAT BEAMS
          </p>

          {/* SVG Map Container */}
          <div className="relative w-full h-72 bg-slate-900 dark:bg-[#090D18] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden flex items-center justify-center">
            {/* SVG Background Grid & Arcs */}
            <svg className="w-full h-full" viewBox="0 0 900 400">
              <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(124,58,237,0.15)" />
              </pattern>
              <rect width="900" height="400" fill="url(#dotGrid)" />

              {/* Animated Threat Beam Arc */}
              <motion.path
                d="M 480 260 Q 470 180 460 160"
                stroke="#EF4444"
                strokeWidth="3"
                fill="none"
                strokeDasharray="6 6"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />

              <motion.path
                d="M 260 190 Q 360 140 460 160"
                stroke="#7C3AED"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="4 4"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />

              {/* Nodes */}
              {GEO_NODES.map((node) => (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  {node.isTarget ? (
                    <>
                      <circle r="14" fill="rgba(124, 58, 237, 0.2)" className="animate-ping" />
                      <circle r="6" fill="#7C3AED" />
                      <text x="12" y="4" fill="#7C3AED" fontSize="12" fontFamily="monospace" fontWeight="bold">
                        {node.name}
                      </text>
                    </>
                  ) : (
                    <>
                      <circle r="12" fill={node.threat ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.15)'} className={node.threat ? 'animate-ping' : ''} />
                      <circle r="5" fill={node.threat ? '#EF4444' : '#94A3B8'} />
                      <text x="10" y="4" fill="#CBD5E1" fontSize="10" fontFamily="monospace">
                        {node.name}
                      </text>
                    </>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-slate-100/80 dark:bg-[#101726] border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs font-mono">
          <div>
            <div className="text-slate-500 dark:text-[#94A3B8]">HIGHEST ATTACK ORIGIN</div>
            <div className="text-red-600 dark:text-[#EF4444] font-bold">Lagos, NG (42% volume)</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 dark:text-[#94A3B8]">AVG GEO-VELOCITY</div>
            <div className="text-[#7C3AED] dark:text-[#8B5CF6] font-bold">780 km/h anomaly</div>
          </div>
        </div>

      </div>

    </div>
  );
};
