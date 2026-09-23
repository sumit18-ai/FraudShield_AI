import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from './api';

const AuthContext = createContext(null);

export const DEFAULT_DEMO_PERSONAS = {
  soc_analyst: {
    id: 'usr_analyst_01',
    email: 'analyst@fraudshield.ai',
    name: 'Sarah Chen, CISSP',
    title: 'Senior SOC Fraud Analyst',
    role: 'soc_analyst',
    department: 'Security Operations Center',
    permissions: ['view_dashboard', 'analyze_transactions', 'view_graph', 'manual_override', 'read_telemetry']
  },
  compliance_officer: {
    id: 'usr_compliance_02',
    email: 'compliance@fraudshield.ai',
    name: 'Marcus Vance, CAMS',
    title: 'Lead Regulatory & Model Risk Auditor',
    role: 'compliance_officer',
    department: 'Model Governance & Risk',
    permissions: ['view_dashboard', 'read_shap_attributions', 'view_fcra_cards', 'view_drift_metrics', 'view_audit_logs']
  },
  admin: {
    id: 'usr_admin_03',
    email: 'admin@fraudshield.ai',
    name: 'Dr. Elena Rostova',
    title: 'Chief Information Security Officer & MLOps Lead',
    role: 'admin',
    department: 'Executive Cyber & MLOps Engineering',
    permissions: [
      'view_dashboard', 'analyze_transactions', 'view_graph', 'manual_override',
      'trigger_drift_spike', 'run_federated_round', 'manage_api_keys',
      'view_audit_logs', 'tune_thresholds', 'full_admin'
    ]
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('fs_user_profile');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // Fallback
      }
    }
    // Default to active SOC Analyst for zero-friction exploration
    return DEFAULT_DEMO_PERSONAS.soc_analyst;
  });

  const [token, setToken] = useState(() => localStorage.getItem('fs_access_token') || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync token to API calls
  useEffect(() => {
    if (token) {
      localStorage.setItem('fs_access_token', token);
    } else {
      localStorage.removeItem('fs_access_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('fs_user_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('fs_user_profile');
    }
  }, [user]);

  // Fast 1-click persona login
  const loginWithPersona = async (personaId) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: personaId })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.access_token);
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.detail || 'Login failed. Please verify the security server is running.';
        setAuthError(msg);
        return { success: false, error: msg };
      }
    } catch (err) {
      console.error('Backend offline or unreachable during persona login.', err);
      const msg = 'Backend offline — please ensure the server is running.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Standard credentials login
  const loginWithCredentials = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.access_token);
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      } else {
        setAuthError(data.detail || 'Invalid email or password.');
        return { success: false, error: data.detail };
      }
    } catch (err) {
      setAuthError('Unable to connect to security server. Please try demo persona.');
      return { success: false, error: 'Connection failure' };
    } finally {
      setIsLoading(false);
    }
  };

  // User self-registration
  const register = async (email, password, name, role = 'soc_analyst', department = 'Fraud Operations') => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, department })
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.access_token);
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      } else {
        setAuthError(data.detail || 'Registration failed.');
        return { success: false, error: data.detail };
      }
    } catch (err) {
      setAuthError('Unable to register with security server.');
      return { success: false, error: 'Connection failure' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(DEFAULT_DEMO_PERSONAS.soc_analyst);
    setToken('');
    localStorage.removeItem('fs_access_token');
    localStorage.removeItem('fs_user_profile');
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin bypass
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.role);
    }
    return user.role === allowedRoles;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'soc_analyst',
        isLoading,
        authError,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithPersona,
        loginWithCredentials,
        register,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
