import React, { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/components/AuthPage";
import Dashboard from "@/components/Dashboard";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div style={{ background: '#020204', minHeight: '100vh' }} />;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  // Loading durumunda 2 saniye bekle, sonra login göster
  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (loading && !timedOut) {
    return <div style={{ background: '#020204', minHeight: '100vh' }} />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={
        loading || !user ? <Navigate to="/login" replace /> : <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
