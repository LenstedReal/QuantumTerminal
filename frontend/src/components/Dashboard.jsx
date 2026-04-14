import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Header from "@/components/Header";
import TickerBar from "@/components/TickerBar";
import AssetIntelligence from "@/components/AssetIntelligence";
import ChartPanel from "@/components/ChartPanel";
import RightPanel from "@/components/RightPanel";
import Footer from "@/components/Footer";

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : null;

export default function Dashboard() {
  const [marketData, setMarketData] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loginLogs, setLoginLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([
    { id: 1, time: "14:09:33", message: "Kimlik doğrulama başarılı." },
    { id: 2, time: "14:09:35", message: "Portföy senkronizasyonu tamamlandı." },
  ]);

  const addLog = useCallback((msg) => {
    const t = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setSystemLogs(p => [{ id: Date.now() + Math.random(), time: t, message: msg }, ...p].slice(0, 50));
  }, []);

  const fetchData = useCallback(async () => {
    if (!API) return;
    try {
      addLog("Kuantum veri senkronizasyonu başlatıldı...");
      const [m, g, l] = await Promise.all([
        axios.get(`${API}/market-data`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API}/global-stats`, { withCredentials: true }).catch(() => ({ data: { data: {} } })),
        axios.get(`${API}/login-logs`, { withCredentials: true }).catch(() => ({ data: [] })),
      ]);
      setMarketData(m.data || []);
      setGlobalStats(g.data?.data || null);
      setLoginLogs(l.data || []);
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
          <AssetIntelligence marketData={marketData} systemLogs={systemLogs} loginLogs={loginLogs} />
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
