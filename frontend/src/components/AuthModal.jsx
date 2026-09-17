import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, UserCheck, KeyRound, Sparkles, X, Check, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';

export function AuthModal() {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    user, 
    loginWithPersona, 
    loginWithCredentials, 
    register, 
    isLoading, 
    authError 
  } = useAuth();

  const [activeTab, setActiveTab] = useState('personas'); // 'personas', 'login', 'register'
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('soc_analyst');
  const [department, setDepartment] = useState('Security Operations');

  if (!isAuthModalOpen) return null;

  const handlePersonaSelect = async (personaId) => {
    await loginWithPersona(personaId);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    await loginWithCredentials(email, password);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    await register(email, password, name, role, department);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-950 tracking-tight">Enterprise Identity &amp; Access</h3>
                <p className="text-xs text-zinc-500">Cryptographic JWT &amp; Role-Based Access Control</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 flex gap-2 border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('personas')}
              className={`pb-2.5 text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'personas'
                  ? 'border-zinc-950 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Demo Personas</span>
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`pb-2.5 text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'border-zinc-950 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password Sign In</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`pb-2.5 text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'border-zinc-950 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6">
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* TAB 1: QUICK DEMO PERSONAS */}
            {activeTab === 'personas' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 leading-relaxed mb-1">
                  Evaluate FraudShield instantly without registration by selecting an enterprise persona:
                </p>

                {/* Persona 1: SOC Analyst */}
                <button
                  type="button"
                  onClick={() => handlePersonaSelect('soc_analyst')}
                  disabled={isLoading}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer group ${
                    user?.role === 'soc_analyst'
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                      : 'border-slate-200 bg-white hover:border-zinc-400 hover:bg-slate-50 text-zinc-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl text-xs font-bold shrink-0 ${
                      user?.role === 'soc_analyst' ? 'bg-white/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      SOC
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Sarah Chen, CISSP</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          user?.role === 'soc_analyst' ? 'bg-white/20 text-white' : 'bg-slate-100 text-zinc-600'
                        }`}>
                          soc_analyst
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 font-medium ${user?.role === 'soc_analyst' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        Senior SOC Fraud Analyst • Stream Triage &amp; Risk Scoring
                      </p>
                    </div>
                  </div>
                  {user?.role === 'soc_analyst' ? (
                    <Check className="w-4 h-4 text-emerald-400 mt-1" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors mt-1" />
                  )}
                </button>

                {/* Persona 2: Compliance Officer */}
                <button
                  type="button"
                  onClick={() => handlePersonaSelect('compliance_officer')}
                  disabled={isLoading}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer group ${
                    user?.role === 'compliance_officer'
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                      : 'border-slate-200 bg-white hover:border-zinc-400 hover:bg-slate-50 text-zinc-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl text-xs font-bold shrink-0 ${
                      user?.role === 'compliance_officer' ? 'bg-white/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    }`}>
                      XAI
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Marcus Vance, CAMS</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          user?.role === 'compliance_officer' ? 'bg-white/20 text-white' : 'bg-slate-100 text-zinc-600'
                        }`}>
                          compliance_officer
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 font-medium ${user?.role === 'compliance_officer' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        Lead Risk Officer • SHAP Explainability &amp; FCRA Audits
                      </p>
                    </div>
                  </div>
                  {user?.role === 'compliance_officer' ? (
                    <Check className="w-4 h-4 text-cyan-400 mt-1" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors mt-1" />
                  )}
                </button>

                {/* Persona 3: System Admin / CISO */}
                <button
                  type="button"
                  onClick={() => handlePersonaSelect('admin')}
                  disabled={isLoading}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer group ${
                    user?.role === 'admin'
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-md'
                      : 'border-slate-200 bg-white hover:border-zinc-400 hover:bg-slate-50 text-zinc-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl text-xs font-bold shrink-0 ${
                      user?.role === 'admin' ? 'bg-white/10 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      OPS
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Dr. Elena Rostova</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          user?.role === 'admin' ? 'bg-white/20 text-white' : 'bg-slate-100 text-zinc-600'
                        }`}>
                          admin
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 font-medium ${user?.role === 'admin' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        CISO &amp; MLOps Lead • Federated Weights &amp; Full Access
                      </p>
                    </div>
                  </div>
                  {user?.role === 'admin' ? (
                    <Check className="w-4 h-4 text-amber-400 mt-1" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors mt-1" />
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: STANDARD LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@fraudshield.ai"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-950 focus:border-transparent transition-all"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Default demo passwords: <code className="text-zinc-700 font-mono">analyst123</code>, <code className="text-zinc-700 font-mono">compliance123</code>, <code className="text-zinc-700 font-mono">admin123</code></p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-zinc-950 text-white font-semibold text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In with JWT'}
                </button>
              </form>
            )}

            {/* TAB 3: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@finbank.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-950"
                    >
                      <option value="soc_analyst">SOC Analyst</option>
                      <option value="compliance_officer">Compliance Auditor</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Fraud Risk"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-950"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-zinc-950 text-white font-semibold text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Creating Account...' : 'Register & Establish Session'}
                </button>
              </form>
            )}
          </div>

          {/* Footer Security Badge */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>TLS 1.3 • AES-256 GCM • Sliding Rate Limiter</span>
            </span>
            <span>v1.0.0</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
