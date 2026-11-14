import React, { useCallback, useEffect, useMemo, useState } from "react";
import "@/styles/quantum.css";
import useMarkets from "@/hooks/useMarkets";
import { MARKETS, marketLabel } from "@/lib/market";
import { Icon, clockTR, safeStore } from "@/components/qt/ui";
import Header from "@/components/Header";
import TickerBar from "@/components/TickerBar";
import Explorer from "@/components/Explorer";
import Pulse from "@/components/Pulse";
import Instrument from "@/components/Instrument";
import Analysis from "@/components/Analysis";
import RightPanel from "@/components/RightPanel";
import Footer from "@/components/Footer";
import { HeatmapView, MarketsView, NewsView } from "@/components/Views";

const VIEWS = [
  { id: "terminal", label: "Terminal", icon: "chart" },
  { id: "piyasalar", label: "Piyasalar", icon: "globe" },
  { id: "harita", label: "Isı haritası", icon: "grid" },
  { id: "takvim", label: "Takvim", icon: "calendar" },
];
const DEFAULT_ID = "CG:bitcoin";
const ID_RE = /^[A-Za-z0-9_]{1,12}:[A-Za-z0-9._!&-]{1,40}$/;
const OLD_COIN_RE = /^[a-z0-9-]{2,60}$/;

const hashNow = () => (typeof window !== "undefined" ? decodeURIComponent(window.location.hash.slice(1)) : "");
const viewFromHash = () => {
  const m = /^\/([a-z]+)$/.exec(hashNow());
  return m && VIEWS.some((v) => v.id === m[1]) ? m[1] : "terminal";
};
const idFromHash = () => {
  const h = hashNow();
  if (ID_RE.test(h)) return h;
  if (OLD_COIN_RE.test(h)) return `CG:${h}`; // links from the earlier version: #bitcoin
  return null;
};
const initialId = () => {
  const saved = safeStore("qt-selected");
  return idFromHash() || (saved && ID_RE.test(saved) ? saved : DEFAULT_ID);
};
const initialMarket = () => {
  const saved = safeStore("qt-market");
  return saved === "fav" || MARKETS.some((m) => m.id === saved) ? saved : "kripto";
};
const initialFavs = () => {
  try {
    const list = JSON.parse(safeStore("qt-favs") || "[]");
    return Array.isArray(list) ? list.filter((id) => typeof id === "string" && ID_RE.test(id)).slice(0, 200) : [];
  } catch (e) {
    return [];
  }
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

export default function Dashboard() {
  const [selectedId, setSelectedId] = useState(initialId);
  const [market, setMarket] = useState(initialMarket);
  const [favs, setFavs] = useState(initialFavs);
  const [view, setView] = useState(viewFromHash);
  const [tab, setTab] = useState("tech");

  const dataMarket = market === "fav" ? "kripto" : market;
  const { markets, byId, global, ticks, reload } = useMarkets(dataMarket);

  const row = useMemo(() => {
    const hit = byId.get(selectedId);
    if (hit) return hit;
    const loadedAll = MARKETS.every((m) => markets[m.id] && markets[m.id].status && markets[m.id].status !== "loading");
    if (!loadedAll) return null; // its market may still be on the way
    const first = (markets[dataMarket] && markets[dataMarket].rows) || [];
    return first[0] || [...byId.values()][0] || null;
  }, [byId, selectedId, markets, dataMarket]);

  const pick = useCallback((id) => {
    setSelectedId(id);
    setView("terminal");
    safeStore("qt-selected", id);
    try { window.history.replaceState(null, "", `#${id}`); } catch (e) { /* ignore */ }
    const main = document.querySelector(".qt-center");
    if (main && window.matchMedia && window.matchMedia("(max-width: 900px)").matches) main.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const pickMarket = useCallback((m) => {
    setMarket(m);
    safeStore("qt-market", m);
  }, []);

  const toggleFav = useCallback((id) => {
    setFavs((list) => {
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      safeStore("qt-favs", JSON.stringify(next));
      return next;
    });
  }, []);

  const go = useCallback((id) => {
    setView(id);
    try { window.history.replaceState(null, "", id === "terminal" ? `#${selectedId}` : `#/${id}`); } catch (e) { /* ignore */ }
    window.scrollTo(0, 0);
  }, [selectedId]);

  useEffect(() => {
    const onHash = () => {
      if (hashNow().startsWith("/")) { setView(viewFromHash()); return; }
      setView("terminal");
      const id = idFromHash();
      if (id) setSelectedId(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.title = row ? `${row.sym} · LENSTEDREAL Quantum Terminal` : "LENSTEDREAL Quantum Terminal";
  }, [row]);

  const cur = markets[dataMarket] || {};
  const total = byId.size;
  const anyLoading = MARKETS.some((m) => !markets[m.id] || markets[m.id].status === "loading" || markets[m.id].status === "cached");
  const status = cur.status === "live" ? "live" : cur.status === "stale" ? "stale" : cur.status === "error" ? (total ? "stale" : "error") : "loading";
  const allFailed = !total && MARKETS.every((m) => markets[m.id] && markets[m.id].status === "error");
  const failed = MARKETS.filter((m) => markets[m.id] && markets[m.id].status === "error" && !(markets[m.id].rows && markets[m.id].rows.length));
  const pulseMarket = market === "fav" ? (row ? row.m : "kripto") : market;

  return (
    <div className="qt" data-testid="dashboard">
      <div className="qt-bg" aria-hidden="true" />
      <Header status={status} updatedAt={cur.at ? new Date(cur.at) : null} onRefresh={() => MARKETS.forEach((m) => reload(m.id))} source={cur.src}>
        <Nav view={view} onGo={go} className="qt-nav-top" />
      </Header>
      <TickerBar byId={byId} ticks={ticks} onPick={pick} loading={anyLoading} />

      {allFailed && (
        <div className="qt-banner is-down" role="alert">
          Piyasa verisi alınamadı. İnternet bağlantını kontrol et; terminal 15 saniyede bir kendiliğinden yeniden dener.
          <button type="button" className="qt-btn qt-btn-sm" onClick={() => MARKETS.forEach((m) => reload(m.id))}>Şimdi dene</button>
        </div>
      )}
      {!allFailed && cur.status === "stale" && (
        <div className="qt-banner is-warn" role="status">
          {marketLabel(dataMarket)} verisi şu an yenilenemiyor. Son alınan veriler gösteriliyor ({clockTR(cur.at ? new Date(cur.at) : null)}).
        </div>
      )}
      {!allFailed && failed.length > 0 && cur.status !== "stale" && (
        <div className="qt-banner is-warn" role="status" data-testid="partial-banner">
          Şu an alınamayan piyasa: {failed.map((m) => m.label).join(", ")}. Diğerleri çalışıyor; bunlar 1 dakikada bir yeniden denenir.
        </div>
      )}

      {view === "terminal" && (
        <main className="qt-main" data-testid="terminal-grid">
          <div className="qt-left">
            <Explorer markets={markets} active={market} onMarket={pickMarket} favs={favs} onFav={toggleFav} selectedId={row ? row.id : selectedId}
              onPick={pick} ticks={ticks} onRetry={reload} />
          </div>
          <div className="qt-center">
            <Pulse market={pulseMarket} rows={(markets[pulseMarket] && markets[pulseMarket].rows) || []} global={global} onPick={pick} />
            <Instrument row={row} byId={byId} favs={favs} onFav={toggleFav} onPick={pick} tick={row ? ticks[row.id] : null} loading={anyLoading} />
          </div>
          <div className="qt-side">
            <Analysis row={row} loading={anyLoading} />
            <RightPanel asset={row} tab={tab} onTab={setTab} />
          </div>
        </main>
      )}
      {view === "piyasalar" && <MarketsView markets={markets} byId={byId} onPick={pick} />}
      {view === "harita" && <HeatmapView markets={markets} onPick={pick} />}
      {view === "takvim" && <NewsView />}

      <Footer />
      <Nav view={view} onGo={go} className="qt-nav-bottom" />
    </div>
  );
}
