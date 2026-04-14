import React from "react";
import { ArrowUpRight, ArrowDownRight, Loader2, BarChart3, Zap, Globe } from "lucide-react";

const formatNum = (val) => {
  if (!val) return "--";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return val.toLocaleString();
};

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function StatCard({ label, value, change, icon: Icon }) {
  const isUp = change >= 0;
  return (
    <div className="px-3 py-2.5 border-b border-zinc-800/30 hover:bg-zinc-800/30 transition-colors duration-75">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3 h-3 text-zinc-500" />}
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono font-semibold text-white">{value}</span>
        {change !== undefined && change !== null && (
          <span className={`text-[10px] font-mono flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {isUp ? "+" : ""}{typeof change === 'number' ? change.toFixed(2) : change}%
          </span>
        )}
      </div>
    </div>
  );
}

function TopMoverRow({ coin }) {
  const ch = coin.price_change_percentage_24h;
  const isUp = ch >= 0;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800/30 transition-colors duration-75" data-testid={`mover-${coin.id}`}>
      <img src={coin.image} alt={coin.symbol} className="w-4 h-4 rounded-full" />
      <span className="text-[11px] font-semibold text-white uppercase flex-1">{coin.symbol}</span>
      <MiniSparkline data={coin.sparkline_in_7d?.price?.slice(-24)} color={isUp ? "#10B981" : "#EF4444"} />
      <span className={`text-[10px] font-mono font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {isUp ? "+" : ""}{ch?.toFixed(2)}%
      </span>
    </div>
  );
}

export default function TechnicalMetrics({ marketData, globalStats, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      </div>
    );
  }

  const totalVol = globalStats?.total_volume?.usd;
  const activeCryptos = globalStats?.active_cryptocurrencies;
  const mcapChange = globalStats?.market_cap_change_percentage_24h_usd;

  const gainers = [...marketData].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)).slice(0, 5);
  const losers = [...marketData].sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)).slice(0, 5);

  return (
    <div className="flex flex-col h-full" data-testid="technical-metrics">
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">Technical Metrics</div>
        <div className="text-[9px] text-zinc-600 font-mono">02</div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Global Stats */}
        <StatCard label="24h Volume" value={formatNum(totalVol)} icon={BarChart3} />
        <StatCard label="Market Change 24h" value={`${mcapChange?.toFixed(2)}%`} change={mcapChange} icon={Zap} />
        <StatCard label="Active Cryptos" value={activeCryptos?.toLocaleString() || '--'} icon={Globe} />

        {/* Dominance Bars */}
        <div className="px-3 py-2 border-b border-zinc-800/30">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">Dominance</div>
          {globalStats?.market_cap_percentage && Object.entries(globalStats.market_cap_percentage).slice(0, 5).map(([sym, pct]) => (
            <div key={sym} className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase w-6">{sym}</span>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500/70"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-300 w-10 text-right">{pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>

        {/* Top Gainers */}
        <div className="border-b border-zinc-800/30">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.15em] text-emerald-400 uppercase">Top Gainers</span>
          </div>
          {gainers.map(coin => <TopMoverRow key={coin.id} coin={coin} />)}
        </div>

        {/* Top Losers */}
        <div>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.15em] text-red-400 uppercase">Top Losers</span>
          </div>
          {losers.map(coin => <TopMoverRow key={coin.id} coin={coin} />)}
        </div>
      </div>

      {/* TradingView Technical Analysis Widget */}
      <div className="border-t border-zinc-800 shrink-0" style={{ height: '220px' }} data-testid="tv-technical-widget">
        <div className="px-3 py-1.5 border-b border-zinc-800/50">
          <span className="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">Scanner</span>
        </div>
        <div style={{ height: 'calc(100% - 28px)' }}>
          <TVScreenerWidget />
        </div>
      </div>
    </div>
  );
}

function TVScreenerWidget() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.height = "100%";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      defaultColumn: "overview",
      defaultScreen: "most_capitalized",
      market: "crypto",
      showToolbar: false,
      colorTheme: "dark",
      locale: "tr",
      isTransparent: true
    });
    container.appendChild(widgetDiv);
    container.appendChild(script);
    ref.current.appendChild(container);
  }, []);
  return <div ref={ref} style={{ height: "100%" }} />;
}
