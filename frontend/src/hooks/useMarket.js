import { useCallback, useEffect, useRef, useState } from "react";

const CG = "https://api.coingecko.com/api/v3";
const BN = "https://data-api.binance.vision/api/v3";
const PAPRIKA = "https://api.coinpaprika.com/v1";
const REFRESH_MS = 30000;
const CACHE_KEY = "qt-cache-v1";
const CACHE_MAX_AGE = 24 * 3600 * 1000;

const MARKETS_QS = "vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d";

// Fallback list for Binance (only long-listed USDT pairs: one unknown symbol would fail the whole request).
const BINANCE_COINS = [
  ["bitcoin", "BTC", "Bitcoin"], ["ethereum", "ETH", "Ethereum"], ["binancecoin", "BNB", "BNB"], ["solana", "SOL", "Solana"],
  ["ripple", "XRP", "XRP"], ["dogecoin", "DOGE", "Dogecoin"], ["cardano", "ADA", "Cardano"], ["tron", "TRX", "TRON"],
  ["avalanche-2", "AVAX", "Avalanche"], ["chainlink", "LINK", "Chainlink"], ["polkadot", "DOT", "Polkadot"], ["bitcoin-cash", "BCH", "Bitcoin Cash"],
  ["litecoin", "LTC", "Litecoin"], ["near", "NEAR", "NEAR Protocol"], ["shiba-inu", "SHIB", "Shiba Inu"], ["uniswap", "UNI", "Uniswap"],
  ["stellar", "XLM", "Stellar"], ["cosmos", "ATOM", "Cosmos Hub"], ["ethereum-classic", "ETC", "Ethereum Classic"], ["filecoin", "FIL", "Filecoin"],
];

async function getJSON(url, ms = 8000) {
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

const validCoins = (m) => (Array.isArray(m) ? m.filter((c) => c && c.id && typeof c.current_price === "number" && Number.isFinite(c.current_price)) : []);

async function binanceMarkets() {
  const list = JSON.stringify(BINANCE_COINS.map(([, s]) => `${s}USDT`));
  const data = await getJSON(`${BN}/ticker/24hr?symbols=${encodeURIComponent(list)}`);
  const by = new Map((Array.isArray(data) ? data : []).map((d) => [d.symbol, d]));
  return BINANCE_COINS.map(([id, s, name], i) => {
    const d = by.get(`${s}USDT`);
    if (!d) return null;
    const ch = Number(d.priceChangePercent);
    return {
      id, symbol: s.toLowerCase(), name, image: null, current_price: Number(d.lastPrice), market_cap: null, market_cap_rank: i + 1,
      total_volume: Number(d.quoteVolume), price_change_percentage_24h: ch, price_change_percentage_24h_in_currency: ch,
      price_change_percentage_1h_in_currency: null, price_change_percentage_7d_in_currency: null, sparkline_in_7d: { price: [] },
    };
  }).filter(Boolean);
}

async function paprikaGlobal() {
  const d = await getJSON(`${PAPRIKA}/global`);
  if (!d || typeof d.market_cap_usd !== "number") throw new Error("boş");
  return {
    data: {
      total_market_cap: { usd: d.market_cap_usd }, total_volume: { usd: d.volume_24h_usd },
      market_cap_percentage: { btc: d.bitcoin_dominance_percentage }, market_cap_change_percentage_24h_usd: d.market_cap_change_24h,
    },
  };
}

// Each source: [name shown in the status tooltip, loader]. Same-origin Vercel cache first (shared, no CORS issues).
const MARKET_SOURCES = [
  ["Vercel önbellek", () => getJSON("/api/markets", 6000)],
  ["CoinGecko", () => getJSON(`${CG}/coins/markets?${MARKETS_QS}`)],
  ["Binance (yedek)", binanceMarkets],
];
const GLOBAL_SOURCES = [
  ["Vercel önbellek", () => getJSON("/api/global", 6000)],
  ["CoinGecko", () => getJSON(`${CG}/global`)],
  ["CoinPaprika (yedek)", paprikaGlobal],
];

async function firstGood(sources, check) {
  for (const [name, load] of sources) {
    try {
      const ok = check(await load());
      if (ok) return { value: ok, source: name };
    } catch (e) { /* try the next source */ }
  }
  return { value: null, source: null };
}

function readCache() {
  try {
    const c = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
    if (!c || !Array.isArray(c.coins) || !c.coins.length || Date.now() - c.t > CACHE_MAX_AGE) return null;
    return c;
  } catch (e) {
    return null;
  }
}

function writeCache(coins, global) {
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), coins, global })); } catch (e) { /* full or private mode */ }
}

/*
 * Live market data:
 * - several sources in order (Vercel cache, CoinGecko, Binance/CoinPaprika fallbacks), first good answer wins
 * - last good data is kept in the browser, so a reload during an outage still shows prices ("stale" instead of empty)
 * - 30 s refresh, paused while the tab is hidden, instant refresh when it comes back or the network returns
 * - per-coin tick direction for the price flash
 */
export default function useMarket() {
  const cached = useRef(typeof window !== "undefined" ? readCache() : null);
  const [coins, setCoins] = useState(() => (cached.current ? cached.current.coins : []));
  const [global, setGlobal] = useState(() => (cached.current ? cached.current.global : null));
  const [status, setStatus] = useState("loading"); // loading | live | stale | error | offline
  const [updatedAt, setUpdatedAt] = useState(() => (cached.current ? new Date(cached.current.t) : null));
  const [ticks, setTicks] = useState({});
  const [source, setSource] = useState(null);
  const prev = useRef(cached.current ? Object.fromEntries(cached.current.coins.map((c) => [c.id, c.current_price])) : {});
  const hasData = useRef(Boolean(cached.current));
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus(hasData.current ? "offline" : "error");
      busy.current = false;
      return;
    }
    try {
      const [m, g] = await Promise.all([
        firstGood(MARKET_SOURCES, (v) => { const l = validCoins(v); return l.length ? l : null; }),
        firstGood(GLOBAL_SOURCES, (v) => (v && v.data && typeof v.data === "object" && Object.keys(v.data).length ? v.data : null)),
      ]);
      if (g.value) setGlobal(g.value);
      if (m.value) {
        const list = m.value;
        const dir = {};
        for (const c of list) {
          const p = prev.current[c.id];
          if (typeof p === "number" && p !== c.current_price) dir[c.id] = c.current_price > p ? "up" : "down";
          prev.current[c.id] = c.current_price;
        }
        setTicks(dir);
        setCoins(list);
        setSource(m.source);
        hasData.current = true;
        setUpdatedAt(new Date());
        setStatus("live");
        writeCache(list, g.value || null);
      } else {
        setStatus(hasData.current ? "stale" : "error");
      }
    } catch (e) {
      setStatus(hasData.current ? "stale" : "error");
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    let timer = null;
    const start = () => { clearInterval(timer); timer = setInterval(load, REFRESH_MS); };
    const onVis = () => {
      if (document.hidden) clearInterval(timer);
      else { load(); start(); }
    };
    const onOnline = () => { load(); };
    const onOffline = () => setStatus(hasData.current ? "offline" : "error");
    load();
    start();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [load]);

  return { coins, global, status, updatedAt, ticks, reload: load, source };
}
