import React from "react";
import { Activity, Download, Smartphone } from "lucide-react";

const formatMarketCap = (val) => {
  if (!val) return "--";
  const t = val / 1e12;
  return `$${t.toFixed(2)}T`;
};

export default function Header({ globalStats }) {
  const totalMcap = globalStats?.total_market_cap?.usd;
  const mcapChange = globalStats?.market_cap_change_percentage_24h_usd;
  const btcDom = globalStats?.market_cap_percentage?.btc;

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[#121214] border-b border-zinc-800 z-30 shrink-0" data-testid="header">
      {/* Brand */}
      <div className="flex items-center gap-3" data-testid="header-brand">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-bold tracking-widest text-white leading-none">
            LENSTEDREAL
          </div>
          <div className="text-[10px] tracking-[0.2em] text-zinc-500 font-medium">
            QUANTUM TERMINAL V10
          </div>
        </div>
        <div className="sm:hidden text-xs font-bold tracking-wider text-white">LTR</div>
      </div>

      {/* Global Stats - Desktop */}
      <div className="hidden md:flex items-center gap-6 text-xs font-mono" data-testid="global-stats">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">MCAP</span>
          <span className="text-white">{formatMarketCap(totalMcap)}</span>
          {mcapChange !== undefined && (
            <span className={mcapChange >= 0 ? "text-emerald-400" : "text-red-400"}>
              {mcapChange >= 0 ? "+" : ""}{mcapChange?.toFixed(2)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">BTC.D</span>
          <span className="text-white">{btcDom?.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />
          <span className="text-emerald-400 text-[10px] tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Download Badges */}
      <div className="flex items-center gap-2" data-testid="download-badges">
        <a
          href="https://play.google.com/store"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded transition-colors duration-150"
          data-testid="play-store-btn"
        >
          <Download className="w-3 h-3" />
          <span className="hidden sm:inline">Play Store</span>
        </a>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-500 text-[11px] font-semibold rounded cursor-not-allowed opacity-70"
          data-testid="app-store-badge"
        >
          <Smartphone className="w-3 h-3" />
          <span className="hidden sm:inline">App Store</span>
          <span className="text-[9px] text-zinc-600 ml-1">YAKINDA</span>
        </div>
      </div>
    </header>
  );
}
