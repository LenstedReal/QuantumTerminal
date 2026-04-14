import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Header from "@/components/Header";
import TickerBar from "@/components/TickerBar";
import AssetIntelligence from "@/components/AssetIntelligence";
import ChartPanel from "@/components/ChartPanel";
import RightPanel from "@/components/RightPanel";
import Footer from "@/components/Footer";

const CG = "https://api.coingecko.com/api/v3";

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
      const [m, g] = await Promise.all([
        axios.get(`${CG}/coins/markets`, { params: { vs_currency: "usd", order: "market_cap_desc", per_page: 20, page: 1, sparkline: true, price_change_percentage: "1h,24h,7d" }, timeout: 10000 }).catch(() => ({ data: [] })),
        axios.get(`${CG}/global`, { timeout: 10000 }).catch(() => ({ data: { data: {} } })),
      ]);
      setMarketData(m.data || []);
      setGlobalStats(g.data?.data || null);
      addLog(`Piyasa senkronizasyonu tamamlandı. ${(m.data || []).length} varlık yüklendi.`);
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
