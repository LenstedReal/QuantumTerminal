import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export default function ChartPanel() {
  const chartRef = useRef(null);
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const symbols = [
    { label: "BTC/USDT", value: "BINANCE:BTCUSDT" },
    { label: "ETH/USDT", value: "BINANCE:ETHUSDT" },
    { label: "NVDA", value: "NASDAQ:NVDA" },
    { label: "AAPL", value: "NASDAQ:AAPL" },
    { label: "GOOGL", value: "NASDAQ:GOOGL" },
    { label: "SOL/USDT", value: "BINANCE:SOLUSDT" },
  ];

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "60",
      timezone: "Europe/Istanbul",
      theme: "dark",
      style: "1",
      locale: "tr",
      backgroundColor: "#09090B",
      gridColor: "rgba(39, 39, 42, 0.3)",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_volume: false,
      toolbar_bg: "#121214",
    });

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.height = "100%";
    container.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "calc(100% - 32px)";
    widgetDiv.style.width = "100%";

    container.appendChild(widgetDiv);
    container.appendChild(script);
    chartRef.current.appendChild(container);
  }, [symbol]);

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-40 bg-[#09090B]' : 'flex-1'} min-h-0`} data-testid="chart-panel">
      {/* Chart Header */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#0C0C0E]">
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">
            Quantum Core Chart
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" />
            <span className="text-[9px] text-emerald-400 font-mono">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Symbol Quick Switch */}
          <div className="hidden sm:flex items-center gap-1">
            {symbols.map(s => (
              <button
                key={s.value}
                onClick={() => setSymbol(s.value)}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded transition-colors duration-75 ${
                  symbol === s.value
                    ? "bg-blue-600 text-white"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                }`}
                data-testid={`chart-symbol-${s.label.replace('/', '-')}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {/* Mobile Symbol Select */}
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="sm:hidden bg-zinc-900 border border-zinc-700 text-white text-[10px] font-mono rounded px-2 py-1"
            data-testid="chart-symbol-select"
          >
            {symbols.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
            data-testid="chart-fullscreen-btn"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Chart Widget */}
      <div ref={chartRef} className="flex-1 min-h-[60vh] lg:min-h-0" data-testid="chart-widget" />
    </div>
  );
}
