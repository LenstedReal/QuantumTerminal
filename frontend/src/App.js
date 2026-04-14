import React, { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import Header from "@/components/Header";
import TickerBar from "@/components/TickerBar";
import AssetIntelligence from "@/components/AssetIntelligence";
import ChartPanel from "@/components/ChartPanel";
import TechnicalMetrics from "@/components/TechnicalMetrics";
import SystemLogs from "@/components/SystemLogs";
import MobileNav from "@/components/MobileNav";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function App() {
  const [marketData, setMarketData] = useState([]);
  const [trending, setTrending] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [activePanel, setActivePanel] = useState("chart");
  const prevPricesRef = useRef({});

  const addLog = useCallback((message, level = "INFO") => {
    setLogs(prev => [{
      id: Date.now() + Math.random(),
      message,
      timestamp: new Date().toISOString(),
      level
    }, ...prev].slice(0, 100));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      addLog("Initiating quantum data sync...");
      const [marketRes, trendingRes, globalRes] = await Promise.all([
        axios.get(`${API}/market-data`).catch(() => ({ data: [] })),
        axios.get(`${API}/trending`).catch(() => ({ data: { coins: [] } })),
        axios.get(`${API}/global-stats`).catch(() => ({ data: { data: {} } })),
      ]);

      const newMarket = marketRes.data || [];
      // Track price changes
      const newPrices = {};
      newMarket.forEach(coin => {
        const prev = prevPricesRef.current[coin.id];
        coin._priceDir = prev ? (coin.current_price > prev ? 'up' : coin.current_price < prev ? 'down' : null) : null;
        newPrices[coin.id] = coin.current_price;
      });
      prevPricesRef.current = newPrices;

      setMarketData(newMarket);
      setTrending(trendingRes.data?.coins || []);
      setGlobalStats(globalRes.data?.data || null);
      setLoading(false);
      addLog(`Market sync complete. ${newMarket.length} assets loaded.`, "SUCCESS");
    } catch (e) {
      addLog(`Data sync error: ${e.message}`, "ERROR");
      setLoading(false);
    }
  }, [addLog]);

  useEffect(() => {
    addLog("LENSTEDREAL Quantum Terminal V10 initializing...");
    addLog("Establishing secure connection to market feeds...");
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData, addLog]);

  return (
    <div className="h-full flex flex-col bg-[#09090B] scanline-overlay" data-testid="app-root">
      <Header globalStats={globalStats} />
      <TickerBar marketData={marketData} />

      {/* Desktop Layout */}
      <main className="flex-1 hidden lg:grid grid-cols-12 gap-px bg-zinc-800/50 min-h-0 overflow-hidden" data-testid="desktop-grid">
        <div className="col-span-3 bg-[#09090B] overflow-hidden flex flex-col">
          <AssetIntelligence marketData={marketData} trending={trending} loading={loading} />
        </div>
        <div className="col-span-6 bg-[#09090B] overflow-hidden flex flex-col">
          <ChartPanel />
          <SystemLogs logs={logs} />
        </div>
        <div className="col-span-3 bg-[#09090B] overflow-hidden flex flex-col">
          <TechnicalMetrics marketData={marketData} globalStats={globalStats} loading={loading} />
        </div>
      </main>

      {/* Mobile Layout */}
      <main className="flex-1 lg:hidden overflow-y-auto" data-testid="mobile-layout">
        <div className="p-1">
          {activePanel === "chart" && <ChartPanel />}
          {activePanel === "assets" && (
            <div className="h-[calc(100dvh-120px)]">
              <AssetIntelligence marketData={marketData} trending={trending} loading={loading} />
            </div>
          )}
          {activePanel === "metrics" && (
            <div className="h-[calc(100dvh-120px)]">
              <TechnicalMetrics marketData={marketData} globalStats={globalStats} loading={loading} />
            </div>
          )}
          {activePanel === "logs" && (
            <div className="h-[calc(100dvh-120px)]">
              <SystemLogs logs={logs} />
            </div>
          )}
        </div>
      </main>

      <MobileNav activePanel={activePanel} setActivePanel={setActivePanel} />
    </div>
  );
}

export default App;
