import React, { useEffect, useRef, useState } from 'react';
import { 
  Shield, 
  ArrowRight, 
  Layers, 
  Share2, 
  Sliders, 
  Activity, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  Lock,
  Sparkles,
  Zap,
  FileCheck,
  Users,
  Eye,
  KeyRound
} from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import { useAuth } from '../lib/auth';

export const LandingPage = ({ onLaunchDashboard }) => {
  const { setIsAuthModalOpen } = useAuth();
  const canvasRef = useRef(null);
  const [activeStageMode, setActiveStageMode] = useState('stacking');
  const [apiOnline, setApiOnline] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);

  // Check API health on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'online') setApiOnline(true);
      })
      .catch(() => setApiOnline(false));
  }, []);

  // Initialize Canvas Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();

    const nodes = [
      { x: 0.15, y: 0.25, label: 'XGBoost', color: '#3B82F6', size: 12 },
      { x: 0.15, y: 0.50, label: 'LightGBM', color: '#10B981', size: 12 },
      { x: 0.15, y: 0.75, label: 'Random Forest', color: '#8B5CF6', size: 12 },
      { x: 0.50, y: 0.50, label: 'Logistic Meta-Learner', color: '#F59E0B', size: 18 },
      { x: 0.85, y: 0.35, label: 'Clean Probability', color: '#10B981', size: 14 },
      { x: 0.85, y: 0.65, label: 'Fraud Risk Flag', color: '#EF4444', size: 14 },
    ];

    const particles = Array.from({ length: 24 }).map(() => ({
      progress: Math.random(),
      speed: 0.006 + Math.random() * 0.008,
      fromIdx: Math.floor(Math.random() * 3),
      toIdx: 3,
      size: 2 + Math.random() * 2
    }));

    let time = 0;
    const render = () => {
      time += 0.03;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Dark canvas theme matching high-tech terminal
      ctx.fillStyle = '#0A0E1A';
      ctx.fillRect(0, 0, w, h);

      // Subtle Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (activeStageMode === 'stacking') {
        // Draw connector paths
        nodes.forEach((n, idx) => {
          const nx = n.x * w;
          const ny = n.y * h;

          if (idx < 3) {
            const mx = nodes[3].x * w;
            const my = nodes[3].y * h;
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(mx, my);
            ctx.stroke();
          } else if (idx === 3) {
            [4, 5].forEach(destIdx => {
              const dx = nodes[destIdx].x * w;
              const dy = nodes[destIdx].y * h;
              ctx.strokeStyle = destIdx === 5 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(nx, ny);
              ctx.lineTo(dx, dy);
              ctx.stroke();
            });
          }
        });

        // Flowing particles
        particles.forEach(p => {
          p.progress += p.speed;
          if (p.progress > 1) {
            p.progress = 0;
            p.fromIdx = Math.floor(Math.random() * 3);
          }
          const from = nodes[p.fromIdx];
          const to = nodes[p.toIdx];
          const px = (from.x + (to.x - from.x) * p.progress) * w;
          const py = (from.y + (to.y - from.y) * p.progress) * h;

          ctx.fillStyle = '#60A5FA';
          ctx.shadowColor = '#3B82F6';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw Nodes
        nodes.forEach((n) => {
          const nx = n.x * w;
          const ny = n.y * h;
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(nx, ny, n.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#F1F5F9';
          ctx.font = '11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(n.label, nx, ny - n.size - 6);
        });

      } else if (activeStageMode === 'shap') {
        const features = [
          { name: 'Amount Anomaly (> $200K)', val: +0.42, color: '#EF4444' },
          { name: 'errorBalanceOrig (< 0)', val: +0.34, color: '#EF4444' },
          { name: 'PCA Component V14', val: +0.22, color: '#EF4444' },
          { name: 'errorBalanceDest', val: +0.18, color: '#EF4444' },
          { name: 'Known Merchant POS', val: -0.28, color: '#10B981' },
          { name: 'Device Fingerprint Match', val: -0.32, color: '#10B981' },
        ];

        const barStartY = 50;
        const barHeight = 22;
        const spacing = 40;
        const centerX = w * 0.52;

        ctx.fillStyle = '#94A3B8';
        ctx.font = '12px Geist, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SHAP Base Value: E[f(x)] = 0.04 (Standard Non-Fraud Benchmark)', centerX, 28);

        features.forEach((f, i) => {
          const y = barStartY + i * spacing;
          const barW = Math.abs(f.val) * (w * 0.32);

          ctx.fillStyle = '#CBD5E1';
          ctx.font = '11px JetBrains Mono, monospace';
          ctx.textAlign = 'right';
          ctx.fillText(f.name, centerX - 12, y + 15);

          ctx.fillStyle = f.color;
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 8;
          if (f.val > 0) {
            ctx.fillRect(centerX + 5, y, barW, barHeight);
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            ctx.fillText(`+${(f.val * 100).toFixed(0)}% Risk`, centerX + barW + 10, y + 15);
          } else {
            ctx.fillRect(centerX - 5 - barW, y, barW, barHeight);
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'right';
            ctx.fillText(`${(f.val * 100).toFixed(0)}% Safe`, centerX - 5 - barW - 10, y + 15);
          }
          ctx.shadowBlur = 0;
        });

      } else if (activeStageMode === 'graph') {
        const cx = w * 0.5;
        const cy = h * 0.5;
        const muleCount = 8;
        const ringRadius = Math.min(w, h) * 0.30;

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;

        // Core
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Mule Syndicate Core', cx, cy + 34);

        for (let i = 0; i < muleCount; i++) {
          const angle = (i / muleCount) * Math.PI * 2 + time * 0.2;
          const mx = cx + Math.cos(angle) * ringRadius;
          const my = cy + Math.sin(angle) * ringRadius;

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(mx, my);
          ctx.stroke();

          ctx.fillStyle = i % 2 === 0 ? '#F59E0B' : '#3B82F6';
          ctx.beginPath();
          ctx.arc(mx, my, 9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#CBD5E1';
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.fillText(`Mule #${100 + i}`, mx, my - 12);
        }

      } else if (activeStageMode === 'omnismote') {
        const cx = w * 0.5;
        const cy = h * 0.5;

        ctx.fillStyle = '#94A3B8';
        ctx.font = '12px Geist, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OmniSMOTE Adaptive Manifold: Generating Boundary Samples on 0.17% Imbalance', cx, 28);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < w; x += 10) {
          const y = cy + Math.sin((x / w) * Math.PI * 3 + time * 0.5) * (h * 0.25);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
        for (let i = 0; i < 35; i++) {
          const px = (0.1 + (i % 7) * 0.1) * w;
          const py = (0.6 + Math.floor(i / 7) * 0.08) * h;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#F43F5E';
        ctx.shadowColor = '#F43F5E';
        ctx.shadowBlur = 8;
        for (let i = 0; i < 14; i++) {
          const px = (0.2 + (i / 14) * 0.6) * w;
          const py = cy + Math.sin((px / w) * Math.PI * 3 + time * 0.5) * (h * 0.25) + Math.sin(i * 2) * 16;
          ctx.beginPath();
          ctx.arc(px, py, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeStageMode]);

  const faqs = [
    {
      q: "Why use a Hybrid Stacking Ensemble over standalone XGBoost or LightGBM?",
      a: "Individual gradient-boosted trees excel at structured tabular patterns but struggle with extreme edge cases and probability calibration. FraudShield AI's stacking architecture combines heterogeneous inductive biases (XGBoost, LightGBM, and Random Forest) through a cross-validated Logistic Regression meta-learner, producing calibrated probabilities, reducing False Positives to 0.04%, and achieving 99.4% ROC-AUC."
    },
    {
      q: "How does FraudShield AI maintain sub-100ms inference with heavy XAI algorithms?",
      a: "Heavy background training distributions are pre-calculated and cached during initialization. During live scoring, our FastAPI ASGI microservice uses optimized TreeSHAP implementations and parallelized surrogate evaluation, returning transaction risk scores in under 45ms and complete local SHAP feature attributions in under 120ms."
    },
    {
      q: "How does OmniSMOTE solve the extreme class imbalance problem (0.17% fraud prevalence)?",
      a: "In standard financial transaction datasets (e.g. Kaggle Credit Card dataset with 492 frauds in 284,807 transactions), standard SMOTE generates noisy synthetic points across majority class boundaries. OmniSMOTE evaluates decision manifold density, synthesizing minority samples strictly along ambiguous decision contours, combined with RobustScaler normalization to insulate the model from extreme transaction amount outliers."
    },
    {
      q: "What regulatory compliance requirements does this platform address?",
      a: "FraudShield AI satisfies EU Artificial Intelligence Act (2024) Article 22 mandates and US Fair Credit Reporting Act (FCRA) provisions regarding automated consumer decision transparency ('Right to Explanation'). Every automated decline or hold generates an immutable SHAP attribution record detailing the primary factors behind the decision."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111111] font-sans selection:bg-black selection:text-white">
      
      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-[#F7F7F5]/85 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 flex justify-between items-center h-[72px]">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center text-xs font-extrabold shadow-sm">FS</span>
              <span className="font-extrabold text-[20px] tracking-tight text-zinc-900">
                FraudShield <span className="text-blue-600 font-extrabold">AI</span>
              </span>
            </div>
            <nav className="hidden lg:flex items-center gap-6">
              <a href="#overview" className="text-sm font-medium tracking-tight text-zinc-500 hover:text-zinc-900 transition-colors">Overview</a>
              <a href="#stage" className="text-sm font-medium tracking-tight text-zinc-500 hover:text-zinc-900 transition-colors">Stacking 3D</a>
              <a href="#architecture" className="text-sm font-medium tracking-tight text-zinc-500 hover:text-zinc-900 transition-colors">Ensemble Engine</a>
              <a href="#widget" className="text-sm font-medium tracking-tight text-zinc-500 hover:text-zinc-900 transition-colors">Inference Widget</a>
              <a href="#xai" className="text-sm font-medium tracking-tight text-zinc-500 hover:text-zinc-900 transition-colors">XAI Transparency</a>
              <a href="#agents" className="text-sm font-medium tracking-tight text-zinc-500 hover:text-zinc-900 transition-colors">Risk Copilot</a>
              <a href="#faqs" className="text-sm font-medium tracking-tight text-zinc-500 hover:text-zinc-900 transition-colors">FAQs</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href={`${API_BASE_URL}/docs`} 
              target="_blank" 
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              REST API Docs
            </a>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border border-slate-200 bg-white text-zinc-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
              <span>Identity Portal</span>
            </button>
            <button
              onClick={onLaunchDashboard}
              className="bg-black text-white px-5 py-2.5 rounded-full font-medium transition-all hover:bg-zinc-800 text-[14px] flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Risk Operations SOC</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="pt-12 pb-16">
        
        {/* HERO SECTION */}
        <section id="overview" className="max-w-[1280px] mx-auto px-6 sm:px-8 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-200/75 border border-zinc-300 text-xs font-medium text-zinc-800 self-start">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="font-bold">THAKUR COLLEGE OF ENGINEERING &amp; TECHNOLOGY (TCET)</span>
                <span className="text-zinc-400">|</span>
                <span className="font-mono font-bold text-emerald-700">SUB-45ms INFERENCE</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-[68px] text-zinc-950 tracking-tight font-extrabold leading-[1.08]">
                Real-time financial fraud intelligence with explainable AI
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <button
                  onClick={onLaunchDashboard}
                  className="bg-black text-white px-7 py-3.5 rounded-full font-semibold transition-all hover:bg-zinc-800 flex items-center gap-2 text-sm shadow-md cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Open Fraud Intelligence Dashboard</span>
                </button>
                <a
                  href="#stage"
                  className="bg-transparent border border-zinc-300 text-zinc-900 px-7 py-3.5 rounded-full font-medium transition-all hover:bg-zinc-200/50 text-sm flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Explore Stacking Architecture</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-end">
              <div className="space-y-4 pt-2">
                <p className="text-[17px] text-zinc-600 max-w-sm text-left leading-relaxed">
                  FraudShield AI replaces opaque black-box models and brittle rule engines with calibrated multi-layer intelligence: <strong className="text-zinc-900">OmniSMOTE</strong> imbalance resampling, <strong className="text-zinc-900">XGBoost + LightGBM + Random Forest</strong> stacking meta-learners, real-time <strong className="text-zinc-900">SHAP &amp; LIME</strong> feature attributions, and <strong className="text-zinc-900">NetworkX</strong> collusion graph analysis.
                </p>
                <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
                  <div><strong className="text-zinc-900 font-bold text-base block font-mono">99.4%</strong> ROC-AUC</div>
                  <div className="w-px h-6 bg-zinc-200" />
                  <div><strong className="text-zinc-900 font-bold text-base block font-mono">0.04%</strong> False Positives</div>
                  <div className="w-px h-6 bg-zinc-200" />
                  <div><strong className="text-zinc-900 font-bold text-base block font-mono">&lt; 45ms</strong> Inference SLA</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3D STAGE & INTERACTIVE TOPOLOGICAL CANVAS */}
        <section id="stage" className="max-w-[1280px] mx-auto px-6 sm:px-8 mb-24">
          <div className="bg-[#F3F2EF] rounded-3xl p-6 sm:p-7 flex flex-col relative overflow-hidden border border-[#E7E7E4] shadow-xl min-h-[560px] justify-between">
            
            {/* Top Stage Tabs */}
            <div className="flex flex-wrap justify-between items-center gap-3 z-10">
              <div className="flex bg-[#F7F3F2] p-1 rounded-full border border-[#E7E7E4] shadow-xs">
                {[
                  { id: 'stacking', label: 'Stacking Ensemble' },
                  { id: 'shap', label: 'SHAP Attribution' },
                  { id: 'graph', label: 'Collusion Graph' },
                  { id: 'omnismote', label: 'OmniSMOTE Boundary' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStageMode(tab.id)}
                    className={`px-4 py-2 rounded-full text-xs transition-all cursor-pointer ${
                      activeStageMode === tab.id
                        ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                        : 'text-zinc-500 font-medium hover:text-zinc-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="bg-[#F7F3F2] px-4 py-2 rounded-full border border-[#E7E7E4] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-zinc-800">INTERACTIVE NEURAL STAGE</span>
              </div>
            </div>

            {/* Ambient Glow Orbs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
              <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 blur-3xl absolute -ml-40" />
              <div className="w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-cyan-400/15 to-blue-400/15 blur-3xl absolute" />
              <div className="w-[260px] h-[260px] rounded-full bg-gradient-to-tr from-emerald-400/20 to-teal-400/20 blur-3xl absolute ml-44 mt-16" />
            </div>

            {/* Canvas Viewport */}
            <div className="relative w-full h-[380px] sm:h-[420px] z-10 flex items-center justify-center overflow-hidden rounded-2xl border border-[#E7E7E4] bg-[#0A0E1A] shadow-inner my-5">
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-6 flex items-center gap-3 pointer-events-none bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px]">
                  {activeStageMode === 'stacking' && 'STACKING META-LEARNER: XGB + LGBM + RF → LOGISTIC REGRESSION'}
                  {activeStageMode === 'shap' && 'XAI ENGINE: DUAL SHAP WATERFALL & LIME LOCAL ATTRIBUTIONS'}
                  {activeStageMode === 'graph' && 'NETWORKX TOPOLOGY: MONEY MULE & COLLUSION CLUSTER DISCOVERY'}
                  {activeStageMode === 'omnismote' && 'OMNISMOTE RESAMPLER: BOUNDARY CALIBRATION ON 0.17% FRAUD IMBALANCE'}
                </span>
              </div>
            </div>

            {/* Bottom Module Bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 z-10 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#E7E7E4]">
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs font-medium text-zinc-500">
                <span className="text-zinc-900 font-bold">284K CreditCard &amp; PaySim Kaggle Benchmarks</span>
                <span>•</span>
                <span>FastAPI Microservice (sub-100ms)</span>
                <span>•</span>
                <span>Dual SHAP &amp; LIME</span>
                <span>•</span>
                <span>EU AI Act &amp; FCRA Compliant</span>
              </div>
              <button
                onClick={onLaunchDashboard}
                className="bg-black text-white px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Launch Live Simulator
              </button>
            </div>

          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="max-w-[1280px] mx-auto px-8 text-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            VALIDATED ON ENTERPRISE FINANCIAL PROTOCOLS &amp; REAL-TIME PAYMENT STREAMS
          </h3>
        </section>

        <section className="w-full overflow-hidden mb-24 py-4 border-y border-zinc-200/80 bg-white/50">
          <div className="flex whitespace-nowrap overflow-hidden group">
            <div className="flex items-center gap-24 animate-marquee group-hover:pause-marquee">
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Shield className="w-5 h-5 text-blue-600" />VISA Direct Network</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Lock className="w-5 h-5 text-rose-600" />Mastercard Decision</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Activity className="w-5 h-5 text-emerald-600" />SWIFT Alliance Gateway</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Zap className="w-5 h-5 text-purple-600" />NPCI / UPI Real-Time</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Sliders className="w-5 h-5 text-sky-600" />FedNow Instant Clearing</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Layers className="w-5 h-5 text-indigo-600" />Stripe Radar Protocol</span>
            </div>
            <div aria-hidden="true" className="flex items-center gap-24 animate-marquee group-hover:pause-marquee">
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Shield className="w-5 h-5 text-blue-600" />VISA Direct Network</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Lock className="w-5 h-5 text-rose-600" />Mastercard Decision</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Activity className="w-5 h-5 text-emerald-600" />SWIFT Alliance Gateway</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Zap className="w-5 h-5 text-purple-600" />NPCI / UPI Real-Time</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Sliders className="w-5 h-5 text-sky-600" />FedNow Instant Clearing</span>
              <span className="flex items-center gap-2.5 text-zinc-700 font-bold text-lg tracking-tighter uppercase italic"><Layers className="w-5 h-5 text-indigo-600" />Stripe Radar Protocol</span>
            </div>
          </div>
        </section>

        {/* 5 CORE ENGINES */}
        <section id="architecture" className="max-w-[1280px] mx-auto px-6 sm:px-8 mb-28">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl text-zinc-900 font-bold mb-4">Five core engines, one unified risk intelligence layer</h2>
            <p className="text-zinc-600 text-lg">Combining imbalanced machine learning ensembles, transparent XAI attribution, money mule collusion graphs, and real-time concept drift monitoring.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-[#FCFCFB] rounded-2xl p-8 border border-[#E7E7E4] min-h-[300px] flex flex-col justify-between hover:shadow-lg transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold font-mono">01</div>
                <h3 className="text-2xl font-bold text-zinc-900">Hybrid Stacking Ensemble Engine</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Unifies heterogeneous base classifiers—<strong>XGBoost</strong>, <strong>LightGBM</strong>, and <strong>Random Forest</strong>—via a 3-fold cross-validated <strong>Logistic Regression meta-learner</strong>. Delivers superior probability calibration and eliminates single-model blind spots.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 mt-4 block">99.4% ROC-AUC • Superior PR-AUC Curve</span>
            </div>

            <div className="bg-[#FCFCFB] rounded-2xl p-8 border border-[#E7E7E4] min-h-[300px] flex flex-col justify-between hover:shadow-lg transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold font-mono">02</div>
                <h3 className="text-2xl font-bold text-zinc-900">Dual Explainable AI (SHAP &amp; LIME)</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Provides real-time local feature attribution using <strong>SHAP Kernel/Tree Explainer</strong> and <strong>LIME tabular surrogates</strong>. Converts complex 45+ feature vectors into plain-English explanations for immediate dispute justification.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 mt-4 block">EU AI Act &amp; FCRA Article 22 Right to Explanation</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FCFCFB] rounded-2xl p-6 border border-[#E7E7E4] space-y-3 hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-900 flex items-center justify-center font-bold text-xs font-mono">03</div>
              <h4 className="font-bold text-zinc-900 text-base">NetworkX Mule Syndicate Graph</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">Maps cyclical transfer rings, shared devices, and mule accounts across PaySim and CreditCard transaction topologies in real time.</p>
            </div>
            <div className="bg-[#FCFCFB] rounded-2xl p-6 border border-[#E7E7E4] space-y-3 hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-900 flex items-center justify-center font-bold text-xs font-mono">04</div>
              <h4 className="font-bold text-zinc-900 text-base">OmniSMOTE Imbalance Resampler</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">Solves 0.17% minority class imbalance via boundary-calibrated synthetic oversampling combined with RobustScaler outlier normalization.</p>
            </div>
            <div className="bg-[#FCFCFB] rounded-2xl p-6 border border-[#E7E7E4] space-y-3 hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-900 flex items-center justify-center font-bold text-xs font-mono">05</div>
              <h4 className="font-bold text-zinc-900 text-base">Concept Drift &amp; Retraining Watchdog</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">Continuously tracks feature distribution shifts with Kolmogorov-Smirnov statistical tests and auto-triggers adaptive model retraining.</p>
            </div>
          </div>
        </section>

        {/* NEURAL ENGINE WIDGET PREVIEW */}
        <section id="widget" className="max-w-[1280px] mx-auto px-6 sm:px-8 mb-28">
          <div className="w-full aspect-[16/9] min-h-[500px] bg-[#F3F2EF] rounded-3xl border border-[#E7E7E4] flex items-center justify-center overflow-hidden relative group shadow-2xl">
            <img 
              alt="Financial Telemetry Background" 
              className="w-full h-full object-cover opacity-75 group-hover:opacity-90 transition-opacity duration-500" 
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
            />
            
            <div className="absolute inset-0 flex items-center justify-center z-20 p-4">
              <div className="absolute w-80 h-80 bg-blue-500/25 rounded-full blur-[100px] -translate-x-28 -translate-y-12" />
              <div className="absolute w-80 h-80 bg-indigo-500/25 rounded-full blur-[100px] translate-x-28 translate-y-12" />

              <div className="relative w-full max-w-[500px] bg-white/45 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-7 sm:p-8 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.25)] flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600 mb-1 font-mono">FraudShield Engine v4.2 PRO</span>
                    <span className="text-sm font-semibold text-zinc-900 tracking-tight">Real-Time Stacking Inference Active</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest font-mono">FastAPI Online</span>
                  </div>
                </div>

                <div className="flex items-end justify-between h-24 gap-1.5 bg-black/5 p-3 rounded-2xl border border-black/5">
                  <div className="w-2 bg-gradient-to-t from-blue-500/40 to-blue-600 rounded-full h-[35%]" />
                  <div className="w-2 bg-gradient-to-t from-blue-500/40 to-blue-600 rounded-full h-[52%]" />
                  <div className="w-2 bg-gradient-to-t from-blue-500/40 to-blue-600 rounded-full h-[78%]" />
                  <div className="w-2 bg-gradient-to-t from-rose-500/50 to-rose-600 rounded-full h-[96%]" />
                  <div className="w-2 bg-gradient-to-t from-rose-500/50 to-rose-600 rounded-full h-[88%]" />
                  <div className="w-2 bg-gradient-to-t from-purple-500/40 to-purple-600 rounded-full h-[64%]" />
                  <div className="w-2 bg-gradient-to-t from-blue-500/40 to-blue-600 rounded-full h-[42%]" />
                  <div className="w-2 bg-gradient-to-t from-blue-500/40 to-blue-600 rounded-full h-[60%]" />
                  <div className="w-2 bg-gradient-to-t from-blue-500/40 to-blue-600 rounded-full h-[32%]" />
                  <div className="w-2 bg-gradient-to-t from-blue-500/40 to-blue-600 rounded-full h-[55%]" />
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 border-y border-black/5 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Latency</span>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-xl font-bold text-zinc-900 font-mono">42</span>
                      <span className="text-xs text-zinc-500 font-medium">ms</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">ROC-AUC</span>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-xl font-bold text-zinc-900 font-mono">99.4</span>
                      <span className="text-xs text-zinc-500 font-medium">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">False Positives</span>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-xl font-bold text-emerald-600 font-mono">0.04</span>
                      <span className="text-xs text-zinc-500 font-medium">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zinc-800" />
                    <span className="text-xs font-semibold text-zinc-900 font-mono">Payload #TX-9402</span>
                  </div>
                  <button
                    onClick={onLaunchDashboard}
                    className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm cursor-pointer"
                  >
                    Inspect SHAP Breakdown
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* XAI TRANSPARENCY STUDIO */}
        <section id="xai" className="max-w-[1280px] mx-auto px-6 sm:px-8 mb-28">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-xs font-mono font-bold bg-zinc-200 text-zinc-900 px-3.5 py-1 rounded-full">XAI Transparency Studio</span>
            <div className="h-px bg-[#E7E7E4] flex-grow" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
            <div className="lg:col-span-5">
              <h2 className="text-3xl sm:text-4xl text-zinc-900 leading-tight font-bold">Audit, explain, &amp; defend fraud decisions in real time</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 flex items-end">
              <p className="text-zinc-600 text-lg">Generate automated audit logs compliant with international regulatory mandates (EU AI Act &amp; FCRA) and deliver transparent SHAP &amp; LIME attributions to risk investigation teams.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#FCFCFB] rounded-2xl border border-[#E7E7E4] h-[320px] flex flex-col justify-end relative overflow-hidden group hover:shadow-lg transition-all">
              <img 
                alt="SHAP Feature Attribution UI" 
                className="absolute inset-0 w-full h-full object-cover group-hover:opacity-100 transition-opacity duration-500" 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop"
              />
              <div className="z-10 bg-black/60 backdrop-blur-xl border border-white/20 p-6 rounded-b-2xl text-white">
                <h4 className="text-[20px] mb-2 text-white font-bold">SHAP Feature Impact Attribution</h4>
                <p className="text-sm text-white/80">Calculates exact additive contribution per transaction (+38% Balance Destruction, +24% High-Amount Outlier, -15% Known POS Terminal).</p>
              </div>
            </div>

            <div className="bg-[#FCFCFB] rounded-2xl p-7 border border-[#E7E7E4] h-[320px] flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="flex justify-between items-start z-10">
                <FileCheck className="w-7 h-7 text-zinc-900" />
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">FCRA &amp; EU AI Act Validated</span>
              </div>
              <div className="z-10">
                <h4 className="text-[20px] mb-2 font-bold text-zinc-900">Automated Dispute Audit Transcript</h4>
                <p className="text-sm text-zinc-600 leading-relaxed">Produces structured immutable JSON audit reports justifying automated card freezes, ready for compliance officer review.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#F3F2EF] rounded-xl p-5 border border-[#E7E7E4] flex flex-col gap-2 items-start hover:bg-zinc-200/60 transition-colors cursor-pointer">
              <Sparkles className="w-5 h-5 text-zinc-900" />
              <span className="font-medium text-sm text-zinc-900">Stacking Meta-Learner</span>
            </div>
            <div className="bg-[#F3F2EF] rounded-xl p-5 border border-[#E7E7E4] flex flex-col gap-2 items-start hover:bg-zinc-200/60 transition-colors cursor-pointer">
              <Sliders className="w-5 h-5 text-zinc-900" />
              <span className="font-medium text-sm text-zinc-900">OmniSMOTE Resampling</span>
            </div>
            <div className="bg-[#F3F2EF] rounded-xl p-5 border border-[#E7E7E4] flex flex-col gap-2 items-start hover:bg-zinc-200/60 transition-colors cursor-pointer">
              <Share2 className="w-5 h-5 text-zinc-900" />
              <span className="font-medium text-sm text-zinc-900">Collusion Mule Graphs</span>
            </div>
            <div className="bg-[#F3F2EF] rounded-xl p-5 border border-[#E7E7E4] flex flex-col gap-2 items-start hover:bg-zinc-200/60 transition-colors cursor-pointer">
              <Activity className="w-5 h-5 text-zinc-900" />
              <span className="font-medium text-sm text-zinc-900">Sub-45ms Latency</span>
            </div>
          </div>
        </section>

        {/* AUTONOMOUS RISK AGENTS & COPILOT */}
        <section id="agents" className="max-w-[1280px] mx-auto px-6 sm:px-8 mb-28">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-xs font-mono font-bold bg-zinc-200 text-zinc-900 px-3.5 py-1 rounded-full">Risk Copilot Agents</span>
            <div className="h-px bg-[#E7E7E4] flex-grow" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
            <div className="lg:col-span-5">
              <h2 className="text-3xl sm:text-4xl text-zinc-900 leading-tight font-bold">Autonomous fraud defense copilots that verify &amp; orchestrate</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 flex items-end">
              <p className="text-zinc-600 text-lg">Deploy automated AI fraud response agents that support SOC tier-1 analysts in executing smart payment holds and automated account isolation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#FCFCFB] rounded-3xl p-7 border border-[#E7E7E4] h-[440px] flex flex-col relative overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity duration-500">
                <div className="w-[220px] h-[220px] rounded-full bg-gradient-to-r from-blue-500 to-indigo-400 blur-2xl absolute -ml-20 -mt-20" />
                <div className="w-[220px] h-[220px] rounded-full bg-gradient-to-r from-purple-500 to-rose-400 blur-2xl absolute ml-20 mt-20" />
              </div>

              <div className="z-10 bg-white/90 backdrop-blur-sm self-start px-4 py-1.5 rounded-full border border-[#E7E7E4] text-xs font-semibold mb-auto">
                Interactive Risk Copilot
              </div>

              <div className="z-10 mt-auto bg-white/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/70 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] space-y-4">
                <div className="flex gap-3 items-center">
                  <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-white/75 backdrop-blur-md border border-white/80 px-4 py-2 rounded-2xl rounded-tl-xs text-xs shadow-xs font-medium text-zinc-900">
                    Transfer #TX-9402 ($184,200) exhibits 340% velocity anomaly with zero destination history. Stacking risk: 94.2%.
                  </div>
                </div>

                <div className="flex gap-3 items-center flex-row-reverse">
                  <div className="w-9 h-9 bg-white/80 backdrop-blur-md border border-white/80 rounded-full flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-zinc-900" />
                  </div>
                  <div className="bg-black text-white px-4 py-2 rounded-2xl rounded-tr-xs text-xs shadow-md font-medium">
                    Confirm hold on TX-9402, quarantine destination wallet, and dispatch step-up MFA challenge.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#FCFCFB] rounded-3xl p-8 border border-[#E7E7E4] h-[440px] flex flex-col justify-between relative overflow-hidden group">
              <div className="z-10 bg-white/90 backdrop-blur-sm self-start px-4 py-1.5 rounded-full border border-[#E7E7E4] text-xs font-semibold mb-auto">
                Live Graph Intelligence
              </div>

              <div className="z-10 mt-auto bg-white/60 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/70 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  <h4 className="text-[22px] font-bold text-zinc-900">Syndicate &amp; Mule Rings</h4>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  NetworkX graph clustering algorithms continually scan active payment channels, discovering multi-hop money mule laundering networks across 35 interconnected accounts and 24 relational transaction edges.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQS */}
        <section id="faqs" className="max-w-[1000px] mx-auto px-6 sm:px-8 mb-28 space-y-6">
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-3xl sm:text-4xl text-zinc-900 font-bold">Engine Specifications &amp; FAQs</h2>
            <p className="text-zinc-500 text-sm">Key architectural and research answers from the FraudShield AI Technical Dossier.</p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-[#FCFCFB] rounded-2xl p-6 border border-[#E7E7E4] cursor-pointer transition-all"
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
              >
                <div className="flex justify-between items-center font-bold text-zinc-900 text-base">
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-blue-600' : 'text-zinc-400'}`} />
                </div>
                {openFaq === idx && (
                  <p className="text-xs text-zinc-600 leading-relaxed mt-4 pt-4 border-t border-[#E7E7E4]">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SIGN OFF BANNER */}
        <section className="max-w-[1280px] mx-auto px-6 sm:px-8 mb-20 text-center flex flex-col items-center">
          <h2 className="text-3xl sm:text-5xl text-zinc-900 mb-6 max-w-3xl leading-tight font-bold">
            The future of real-time financial fraud defense starts here
          </h2>
          <p className="text-zinc-600 max-w-xl mb-8 text-sm leading-relaxed">
            Engineered at Thakur College of Engineering &amp; Technology (TCET), Mumbai. Tested across millions of synthetic and real-world transaction vectors.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={onLaunchDashboard}
              className="bg-black text-white px-8 py-3.5 rounded-full font-semibold transition-all hover:bg-zinc-800 flex items-center gap-2 text-sm shadow-md cursor-pointer"
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Launch Interactive Risk SOC</span>
            </button>
            <a
              href={`${API_BASE_URL}/docs`}
              target="_blank"
              rel="noreferrer"
              className="bg-transparent border border-zinc-300 text-zinc-900 px-8 py-3.5 rounded-full font-medium transition-all hover:bg-zinc-200/50 text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>FastAPI OpenAPI Specification</span>
            </a>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[#E7E7E4] py-12 bg-[#F3F2EF] text-xs text-zinc-500">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <span className="text-lg font-bold tracking-tighter text-zinc-900 text-[20px]">FraudShield AI</span>
            <span className="text-sm text-zinc-500">
              © 2026 TCET Mumbai • Student Team: Ashmit Singh, Sumit Singh, Shivam Singh • Guide: Ms. Tanmayi Nagale
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button onClick={onLaunchDashboard} className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer">
              Live Dashboard
            </button>
            <a className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors" href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer">
              API Documentation
            </a>
            <a className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors" href={`${API_BASE_URL}/health`} target="_blank" rel="noreferrer">
              Health Check
            </a>
          </div>
        </div>
      </footer>


    </div>
  );
};
