import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Header from "@/components/Header";
import TickerBar from "@/components/TickerBar";
import AssetIntelligence from "@/components/AssetIntelligence";
import ChartPanel from "@/components/ChartPanel";
import RightPanel from "@/components/RightPanel";
import Footer from "@/components/Footer";

const CG = "https://api.coingecko.com/api/v3";
// Prefer the backend proxy (cached, rate-limit tolerant); fall back to CoinGecko directly
// only when REACT_APP_BACKEND_URL is not configured (avoids "undefined/api").
const BACKEND = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = BACKEND ? `${BACKEND}/api` : null;

export default function Dashboard() {
  const [marketData, setMarketData] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [systemLogs, setSystemLogs] = useState([]);

  const addLog = useCallback((msg) => {
    const t = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setSystemLogs(p => [{ id: Date.now() + Math.random(), time: t, message: msg }, ...p].slice(0, 50));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      addLog("Kuantum veri senkronizasyonu başlatıldı...");
      const marketsReq = API
        ? axios.get(`${API}/market-data`, { timeout: 15000 })
        : axios.get(`${CG}/coins/markets`, { params: { vs_currency: "usd", order: "market_cap_desc", per_page: 20, page: 1, sparkline: true, price_change_percentage: "1h,24h,7d" }, timeout: 10000 });
      const globalReq = API
        ? axios.get(`${API}/global-stats`, { timeout: 15000 })
        : axios.get(`${CG}/global`, { timeout: 10000 });
      const [m, g] = await Promise.all([
        marketsReq.catch(() => ({ data: null })),
        globalReq.catch(() => ({ data: { data: {} } })),
      ]);
      const list = Array.isArray(m.data) ? m.data : null;
      // On a 429/failed refresh keep the last good data instead of blanking the UI.
      if (list && list.length) setMarketData(list);
      if (g.data?.data && Object.keys(g.data.data).length) setGlobalStats(g.data.data);
      addLog(list && list.length
        ? `Piyasa senkronizasyonu tamamlandı. ${list.length} varlık yüklendi.`
        : "Piyasa verisi alınamadı (limit/ağ). Önceki veriler korunuyor.");
    } catch (e) {
      addLog(`Senkronizasyon hatası: ${e.message}`);
    }
  }, [addLog]);

  useEffect(() => {
    addLog("LENSTEDREAL Quantum Terminal V10 başlatılıyor...");
    addLog("Güvenli kuantum bağlantısı kuruluyor...");
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, [fetchData, addLog]);

  return (
    <div className="flex flex-col h-screen scanline" data-testid="dashboard">
      <Header />
      <TickerBar marketData={marketData} />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_300px] gap-[2px] overflow-auto lg:overflow-hidden" style={{ background: 'rgba(30,41,59,0.2)' }} data-testid="terminal-grid">
        <section className="flex flex-col overflow-hidden lg:order-1 order-2" style={{ background: 'rgba(7,10,16,0.8)' }}>
          <AssetIntelligence marketData={marketData} systemLogs={systemLogs} loginLogs={[]} />
        </section>
        <section className="flex flex-col overflow-hidden lg:order-2 order-1 min-h-[55vh] lg:min-h-0" style={{ background: 'rgba(7,10,16,0.8)' }}>
          <ChartPanel />
        </section>
        <section className="flex flex-col overflow-hidden lg:order-3 order-3" style={{ background: 'rgba(7,10,16,0.8)' }}>
          <RightPanel />
        </section>
      </main>
      <Footer />
    </div>
  );
}
