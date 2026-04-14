import React, { useEffect, useRef, useState } from "react";

export default function ChartPanel() {
  const chartRef = useRef(null);
  const [symbol, setSymbol] = useState("NASDAQ:NVDA");

  const symbols = [
    { label: "NVDA", value: "NASDAQ:NVDA" },
    { label: "BTC", value: "BINANCE:BTCUSDT" },
    { label: "ETH", value: "BINANCE:ETHUSDT" },
    { label: "GOOGL", value: "NASDAQ:GOOGL" },
    { label: "SOL", value: "BINANCE:SOLUSDT" },
  ];

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.height = "100%";
    container.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "calc(100% - 32px)";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Europe/Istanbul",
      theme: "dark",
      style: "1",
      locale: "tr",
      backgroundColor: "rgba(7, 10, 16, 0.8)",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_volume: false,
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);
    chartRef.current.appendChild(container);
  }, [symbol]);

  return (
    <div className="flex flex-col h-full" data-testid="chart-panel">
      {/* Header */}
      <div className="px-4 py-2.5 flex justify-between items-center shrink-0" style={{
        background: 'rgba(15,23,42,0.5)', borderBottom: '1px solid rgba(30,41,59,0.6)'
      }}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase font-bold tracking-wider" style={{ color: '#00f2ff' }}>
            Quantum Core Chart
          </span>
          <div className="flex items-center gap-1">
            {symbols.map(s => (
              <button
                key={s.value}
                onClick={() => setSymbol(s.value)}
                className="px-1.5 py-0.5 text-[8px] font-bold rounded transition-all"
                style={{
                  background: symbol === s.value ? 'rgba(0,242,255,0.15)' : 'transparent',
                  color: symbol === s.value ? '#00f2ff' : '#64748b',
                  border: symbol === s.value ? '1px solid rgba(0,242,255,0.3)' : '1px solid transparent',
                }}
                data-testid={`chart-btn-${s.label}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <span className="text-[11px] font-bold" style={{ color: '#00f2ff' }}>Canlı</span>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="flex-1 min-h-0" data-testid="chart-widget" />
    </div>
  );
}
