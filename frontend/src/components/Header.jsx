import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Download, Smartphone } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-[60px] px-4 flex justify-between items-center shrink-0 z-20" style={{
      background: 'rgba(10,12,18,0.96)',
      borderBottom: '1px solid #00f2ff',
      backdropFilter: 'blur(8px)'
    }} data-testid="header">
      {/* Brand */}
      <div className="font-bold tracking-[2px] text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }} data-testid="header-brand">
        LENSTEDREAL <span style={{ color: '#00f2ff', textShadow: '0 0 10px rgba(0,242,255,0.3)' }}>SYSTEMS</span>
      </div>

      {/* Status */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="blink text-xs" style={{ color: '#00ff6a' }} data-testid="sync-status">
          ● QUANTUM_SYNC_OK
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Download Badges */}
        <a
          href="https://play.google.com/store"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-all hover:opacity-80"
          style={{ background: '#00f2ff', color: '#020204' }}
          data-testid="play-store-btn"
        >
          <Download className="w-3 h-3" /> Play Store
        </a>
        <div
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider opacity-50 cursor-not-allowed"
          style={{ border: '1px solid rgba(30,41,59,0.6)', color: '#64748b' }}
          data-testid="app-store-badge"
        >
          <Smartphone className="w-3 h-3" /> App Store <span className="text-[8px] ml-1">YAKINDA</span>
        </div>

        <div className="text-[10px] hidden md:block" style={{ color: '#64748b' }} data-testid="version-info">V10_PRO_NODE</div>

        {/* User & Logout */}
        {user && (
          <button
            onClick={logout}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold tracking-wider transition-all hover:opacity-80"
            style={{ border: '1px solid rgba(255,0,60,0.4)', color: '#ff003c' }}
            data-testid="logout-btn"
          >
            <LogOut className="w-3 h-3" /> ÇIKIŞ
          </button>
        )}
      </div>
    </header>
  );
}
