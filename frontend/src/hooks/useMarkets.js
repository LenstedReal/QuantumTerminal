import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MARKETS, gramGold, isNum } from "@/lib/market";

const ORDER = MARKETS.map((m) => m.id);
const ACTIVE_MS = 15000; // the selected market refreshes every 15 s (data itself is cached ~10 s on Vercel)
const OTHERS_EVERY = 4; // the rest every 4th tick (60 s)
const CACHE_AGE = 24 * 3600 * 1000;
const CG = "https://api.coingecko.com/api/v3";

async function getJSON(url, ms = 12000) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" }, signal: ctrl ? ctrl.signal : undefined });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    if (!(r.headers.get("content-type") || "").includes("json")) throw new Error("JSON değil");
    return await r.json();
  } finally {
    if (t) clearTimeout(t);
  }
}

const n = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Browser-side fallbacks for crypto only (the other markets need the server: their sources do not allow browser calls).
async function cryptoDirect() {
  try {
    const list = await getJSON(`${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d%2C30d%2C1y`);
    const rows = (Array.isArray(list) ? list : []).map((c) => ({
      id: `CG:${c.id}`, cg: c.id, tv: null, sym: String(c.symbol || "").toUpperCase(), name: c.name, ex: "CoinGecko", cur: "USD",
      p: n(c.current_price), ch: n(c.price_change_percentage_24h), cha: n(c.price_change_24h), hi: n(c.high_24h), lo: n(c.low_24h),
      vol: n(c.total_volume), mc: n(c.market_cap), rank: n(c.market_cap_rank), rec: null, rsi: null, p1h: n(c.price_change_percentage_1h_in_currency),
      pw: n(c.price_change_percentage_7d_in_currency), pm: n(c.price_change_percentage_30d_in_currency), p1y: n(c.price_change_percentage_1y_in_currency),
      ath: n(c.ath), logo: c.image || null,
    })).filter((r) => r.p !== null);
    if (rows.length) return { rows, src: "CoinGecko (doğrudan)" };
  } catch (e) { /* next */ }
  const all = await getJSON("https://data-api.binance.vision/api/v3/ticker/24hr");
  const rows = (Array.isArray(all) ? all : [])
    .filter((t) => /USDT$/.test(t.symbol) && !/(UP|DOWN|BULL|BEAR)USDT$/.test(t.symbol) && Number(t.quoteVolume) > 0)
    .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume)).slice(0, 200)
    .map((t, i) => {
      const sym = t.symbol.replace(/USDT$/, "");
      return { id: `BN:${sym}`, tv: `BINANCE:${t.symbol}`, sym, name: sym, ex: "Binance", cur: "USD", p: n(Number(t.lastPrice)), ch: n(Number(t.priceChangePercent)),
        cha: n(Number(t.priceChange)), hi: n(Number(t.highPrice)), lo: n(Number(t.lowPrice)), op: n(Number(t.openPrice)), vol: n(Number(t.quoteVolume)), rank: i + 1,
        logo: `https://s3-symbol-logo.tradingview.com/crypto/XTVC${sym}.svg` };
    });
  if (!rows.length) throw new Error("boş");
  return { rows, src: "Binance (doğrudan)" };
}

async function fetchMarket(m) {
  try {
    const j = await getJSON(`/api/scan?m=${m}`);
    if (j && Array.isArray(j.rows) && j.rows.length) return { rows: j.rows, src: j.src || "Sunucu" };
  } catch (e) { /* fall back below */ }
  if (m === "kripto") return cryptoDirect();
  throw new Error("Veri sunucusu yanıt vermedi");
}

async function fetchGlobal() {
  for (const u of ["/api/global", `${CG}/global`]) {
    try {
      const j = await getJSON(u, 8000);
      if (j && j.data && typeof j.data === "object" && Object.keys(j.data).length) return j.data;
    } catch (e) { /* next */ }
  }
  return null;
}

const cacheKey = (m) => `qt-m2-${m}`;
function readCaches() {
  const out = {};
  for (const m of ORDER) {
    try {
      const c = JSON.parse(window.localStorage.getItem(cacheKey(m)) || "null");
      if (c && Array.isArray(c.rows) && c.rows.length && Date.now() - c.at < CACHE_AGE) out[m] = { rows: c.rows, at: c.at, src: c.src, status: "cached" };
    } catch (e) { /* ignore */ }
  }
  return out;
}
function writeCache(m, v) {
  try { window.localStorage.setItem(cacheKey(m), JSON.stringify({ rows: v.rows, at: v.at, src: v.src })); } catch (e) { /* full or private mode */ }
}

/*
 * All markets in one store: { [market]: { rows, at, src, status } }, status = loading | live | cached | stale | error.
 * Rows carry `m` (their market). Last good data is kept on errors and in the browser, so nothing goes blank.
 */
export default function useMarkets(active) {
  const [store, setStore] = useState(() => (typeof window !== "undefined" ? readCaches() : {}));
  const [global, setGlobal] = useState(null);
  const [ticks, setTicks] = useState({});
  const storeRef = useRef(store);
  const busy = useRef({});
  const tick = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  storeRef.current = store;

  const load = useCallback(async (m) => {
    if (busy.current[m]) return;
    busy.current[m] = true;
    setStore((s) => ({ ...s, [m]: { ...(s[m] || { rows: [] }), status: s[m] && s[m].rows && s[m].rows.length ? s[m].status : "loading" } }));
    try {
      const { rows, src } = await fetchMarket(m);
      const prev = new Map(((storeRef.current[m] || {}).rows || []).map((r) => [r.id, r.p]));
      const stamp = Date.now();
      const dir = {};
      const list = rows.map((r) => ({ ...r, m }));
      for (const r of list) {
        const p = prev.get(r.id);
        if (isNum(p) && isNum(r.p) && p !== r.p) dir[r.id] = { d: r.p > p ? "up" : "down", s: stamp };
      }
      const v = { rows: list, at: stamp, src, status: "live" };
      setStore((s) => ({ ...s, [m]: v }));
      writeCache(m, v);
      if (Object.keys(dir).length) setTicks((t) => ({ ...t, ...dir }));
    } catch (e) {
      setStore((s) => {
        const cur = s[m] || { rows: [] };
        return { ...s, [m]: { ...cur, status: cur.rows && cur.rows.length ? "stale" : "error", err: String((e && e.message) || e) } };
      });
    } finally {
      busy.current[m] = false;
    }
  }, []);

  const loadGlobal = useCallback(async () => {
    const g = await fetchGlobal();
    if (g) setGlobal(g);
  }, []);

  useEffect(() => {
    let timer = null;
    let alive = true;
    const first = async () => {
      await load(activeRef.current);
      loadGlobal();
      for (const m of ORDER) {
        if (!alive) return;
        if (m !== activeRef.current) await load(m);
      }
    };
    const step = () => {
      tick.current += 1;
      load(activeRef.current);
      if (tick.current % OTHERS_EVERY === 0) {
        loadGlobal();
        ORDER.filter((m) => m !== activeRef.current).forEach((m, i) => setTimeout(() => load(m), 400 * i));
      }
    };
    const start = () => { clearInterval(timer); timer = setInterval(step, ACTIVE_MS); };
    const onVis = () => { if (document.hidden) clearInterval(timer); else { load(activeRef.current); start(); } };
    const onOnline = () => step();
    first();
    start();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, [load, loadGlobal]);

  // Switching market: refresh it right away if its data is older than a refresh period.
  useEffect(() => {
    const cur = storeRef.current[active];
    if (!cur || !cur.at || Date.now() - cur.at > ACTIVE_MS) load(active);
  }, [active, load]);

  // Computed gram gold joins the commodities list when ounce gold and USD/TRY are both known.
  const markets = useMemo(() => {
    const out = { ...store };
    const fx = (store.fx && store.fx.rows) || [];
    const em = (store.emtia && store.emtia.rows) || [];
    const usdtry = fx.find((r) => r.id === "FX_IDC:USDTRY");
    const gold = em.find((r) => r.id === "TVC:GOLD") || em.find((r) => r.id === "COMEX:GC1!");
    const gram = gramGold(gold, usdtry);
    if (gram && store.emtia) out.emtia = { ...store.emtia, rows: [gram, ...em.filter((r) => r.id !== gram.id)] };
    return out;
  }, [store]);

  const byId = useMemo(() => {
    const map = new Map();
    for (const m of ORDER) for (const r of (markets[m] && markets[m].rows) || []) map.set(r.id, r);
    return map;
  }, [markets]);

  return { markets, byId, global, ticks, reload: load };
}
