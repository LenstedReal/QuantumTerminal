import React, { useCallback, useEffect, useMemo, useState } from "react";
import "@/styles/quantum.css";
import useMarket from "@/hooks/useMarket";
import { STOCKS } from "@/lib/market";
import { clockTR, safeStore } from "@/components/qt/ui";
import Header from "@/components/Header";
import TickerBar from "@/components/TickerBar";
import GlobalStats from "@/components/GlobalStats";
import MarketList from "@/components/MarketList";
import ChartPanel from "@/components/ChartPanel";
import AssetIntelligence from "@/components/AssetIntelligence";
import RightPanel from "@/components/RightPanel";
import Footer from "@/components/Footer";
import { HeatmapView, MarketsView, NewsView } from "@/components/Views";
import { Icon } from "@/components/qt/ui";

const VIEWS = [
  { id: "terminal", label: "Terminal", icon: "chart" },
  { id: "piyasalar", label: "Piyasalar", icon: "globe" },
  { id: "harita", label: "Isı haritası", icon: "grid" },
  { id: "takvim", label: "Takvim", icon: "calendar" },
];
const viewFromHash = () => {
  const m = typeof window !== "undefined" ? /^\/([a-z]+)$/.exec(decodeURIComponent(window.location.hash.slice(1))) : null;
  return m && VIEWS.some((v) => v.id === m[1]) ? m[1] : "terminal";
};

function Nav({ view, onGo, className }) {
  return (
    <nav className={`qt-nav ${className}`} aria-label="Bölümler">
      {VIEWS.map((v) => (
        <button key={v.id} type="button" aria-current={view === v.id ? "page" : undefined} onClick={() => onGo(v.id)} data-testid={`nav-${v.id}`}>
          <Icon name={v.icon} size={17} /><span>{v.label}</span>
        </button>
      ))}
    </nav>
  );
}

const initialId = () => {
  const h = typeof window !== "undefined" ? decodeURIComponent(window.location.hash.slice(1)) : "";
  if (/^[a-z0-9-]{2,60}$/.test(h)) return h;
  const saved = safeStore("qt-selected");
  return saved && /^[a-z0-9-]{2,60}$/.test(saved) ? saved : "bitcoin";
};

export default function Dashboard() {
  const { coins, global, status, updatedAt, ticks, reload, source } = useMarket();
  const [selectedId, setSelectedId] = useState(initialId);
  const [view, setView] = useState(viewFromHash);
  const [tab, setTab] = useState("tech");
  const stamp = updatedAt ? updatedAt.getTime() : 0;

  const asset = useMemo(() => {
    const stock = STOCKS.find((s) => s.id === selectedId);
    if (stock) return { ...stock, kind: "stock" };
    const coin = coins.find((c) => c.id === selectedId);
    if (coin) return coin;
    return coins[0] || null; // unknown id (or not in the top 20 any more): fall back to the leader
  }, [coins, selectedId]);

  const pick = useCallback((id) => {
    setSelectedId(id);
    setView("terminal");
    safeStore("qt-selected", id);
    try { window.history.replaceState(null, "", `#${id}`); } catch (e) { /* ignore */ }
    if (id.startsWith("stock-")) setTab("tech");
    const main = document.querySelector(".qt-center");
    if (main && window.matchMedia && window.matchMedia("(max-width: 900px)").matches) main.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const onHash = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (h.startsWith("/")) { setView(viewFromHash()); return; }
      setView("terminal");
      if (/^[a-z0-9-]{2,60}$/.test(h)) setSelectedId(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const name = asset ? (asset.kind === "stock" ? asset.symbol : String(asset.symbol || "").toUpperCase()) : "";
    document.title = name ? `${name} · LENSTEDREAL Quantum Terminal` : "LENSTEDREAL Quantum Terminal";
  }, [asset]);

  const tickFor = asset && asset.kind !== "stock" ? ticks[asset.id] : null;

  const go = useCallback((id) => {
    setView(id);
    try { window.history.replaceState(null, "", id === "terminal" ? `#${selectedId}` : `#/${id}`); } catch (e) { /* ignore */ }
    window.scrollTo(0, 0);
  }, [selectedId]);

  return (
    <div className="qt" data-testid="dashboard">
      <div className="qt-bg" aria-hidden="true" />
      <Header status={status} updatedAt={updatedAt} onRefresh={reload} source={source}>
        <Nav view={view} onGo={go} className="qt-nav-top" />
      </Header>
      <TickerBar coins={coins} ticks={ticks} stamp={stamp} onPick={pick} loading={status === "loading"} />

      {status === "error" && (
        <div className="qt-banner is-down" role="alert">
          Piyasa verisi alınamadı. İnternet bağlantını kontrol et; terminal 30 saniyede bir kendiliğinden yeniden dener.
          <button type="button" className="qt-btn qt-btn-sm" onClick={reload}>Şimdi dene</button>
        </div>
      )}
      {(status === "stale" || status === "offline") && (
        <div className="qt-banner is-warn" role="status">
          {status === "offline" ? "İnternet bağlantısı yok." : "Veri kaynağı şu an yanıt vermiyor."} Son alınan veriler gösteriliyor ({clockTR(updatedAt)}).
        </div>
      )}

      {view === "terminal" && (
        <main className="qt-main" data-testid="terminal-grid">
          <div className="qt-left">
            <MarketList coins={coins} ticks={ticks} stamp={stamp} selectedId={asset ? asset.id : selectedId} onPick={pick} status={status} />
          </div>
          <div className="qt-center">
            <GlobalStats global={global} />
            <ChartPanel asset={asset} coins={coins} onPick={pick} tick={tickFor} stamp={stamp} loading={status === "loading"} />
          </div>
          <div className="qt-side">
            <AssetIntelligence asset={asset} loading={status === "loading"} />
            <RightPanel asset={asset} tab={tab} onTab={setTab} />
          </div>
        </main>
      )}
      {view === "piyasalar" && <MarketsView />}
      {view === "harita" && <HeatmapView />}
      {view === "takvim" && <NewsView />}
      <Footer />
      <Nav view={view} onGo={go} className="qt-nav-bottom" />
    </div>
  );
}
