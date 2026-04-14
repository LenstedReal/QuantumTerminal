import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext(null);

// Error formatter
function formatError(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = not auth
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
      if (data.requires_2fa) {
        return { requires_2fa: true, temp_token: data.temp_token };
      }
      setUser(data);
      return { success: true };
    } catch (e) {
      return { error: formatError(e.response?.data?.detail) || e.message };
    }
  };

  const verify2FALogin = async (code, tempToken) => {
    try {
      const { data } = await axios.post(`${API}/auth/verify-2fa-login`, { code }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${tempToken}` }
      });
      setUser(data);
      return { success: true };
    } catch (e) {
      return { error: formatError(e.response?.data?.detail) || e.message };
    }
  };

  const register = async (email, password, name) => {
    try {
      const { data } = await axios.post(`${API}/auth/register`, { email, password, name }, { withCredentials: true });
      setUser(data);
      return { success: true, verification_code: data.verification_code_hint };
    } catch (e) {
      return { error: formatError(e.response?.data?.detail) || e.message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    setUser(false);
  };

  const verifyEmail = async (code) => {
    try {
      await axios.post(`${API}/auth/verify-email`, { code }, { withCredentials: true });
      setUser(prev => prev ? { ...prev, email_verified: true } : prev);
      return { success: true };
    } catch (e) {
      return { error: formatError(e.response?.data?.detail) || e.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify2FALogin, register, logout, verifyEmail, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
