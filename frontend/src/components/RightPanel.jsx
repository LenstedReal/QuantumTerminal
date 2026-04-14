import React, { useEffect, useRef } from "react";

export default function RightPanel() {
  return (
    <div className="flex flex-col h-full" data-testid="right-panel">
      {/* Technical Metrics - TradingView Technical Analysis Widget */}
      <div className="flex-1 flex flex-col" style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
        <div className="px-4 py-2.5 flex justify-between items-center shrink-0" style={{
          background: 'rgba(15,23,42,0.5)', borderBottom: '1px solid rgba(30,41,59,0.6)'
        }}>
          <span className="text-[11px] uppercase font-bold tracking-wider" style={{ color: '#00f2ff' }}>
            Teknik Göstergeler
          </span>
        </div>
        <div className="flex-1 min-h-[200px]">
          <TVTechnicalAnalysis />
        </div>
      </div>

      {/* Scanner - TradingView Screener Widget */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2.5 flex justify-between items-center shrink-0" style={{
          background: 'rgba(15,23,42,0.5)', borderBottom: '1px solid rgba(30,41,59,0.6)'
        }}>
          <span className="text-[11px] uppercase font-bold tracking-wider" style={{ color: '#00f2ff' }}>
            Tarayıcı
          </span>
        </div>
        <div className="flex-1 min-h-[200px]">
          <TVScreener />
        </div>
      </div>
    </div>
  );
}

function TVTechnicalAnalysis() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.height = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: "1h",
      width: "100%",
      height: "100%",
      isTransparent: true,
      symbol: "NASDAQ:NVDA",
      showIntervalTabs: true,
      locale: "tr",
      colorTheme: "dark"
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);
    ref.current.appendChild(container);
  }, []);

  return <div ref={ref} style={{ height: "100%" }} data-testid="tv-technical-analysis" />;
}

function TVScreener() {
  const ref = useRef(null);
  useEffect(() => {
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
      market: "america",
      showToolbar: false,
      colorTheme: "dark",
      locale: "tr",
      isTransparent: true
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);
    ref.current.appendChild(container);
  }, []);

  return <div ref={ref} style={{ height: "100%" }} data-testid="tv-screener" />;
}
