import { useCallback, useEffect, useRef, useState } from "react";

const CG = "https://api.coingecko.com/api/v3";
const BN = "https://data-api.binance.vision/api/v3";
const PAPRIKA = "https://api.coinpaprika.com/v1";
// Optional old FastAPI backend; tried last because it is often not deployed.
const BACKEND = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = BACKEND ? `${BACKEND}/api` : null;
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
    const type = r.headers.get("content-type") || "";
    if (!type.includes("json")) throw new Error("JSON değil");
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

// Each source: [name shown in the system log, loader]. Same-origin Vercel proxy first (shared cache, no CORS).
const MARKET_SOURCES = [
  ["Vercel önbellek", () => getJSON("/api/markets", 6000)],
  ["CoinGecko", () => getJSON(`${CG}/coins/markets?${MARKETS_QS}`)],
  ["Binance (yedek)", binanceMarkets],
  ...(API ? [["Sunucu", () => getJSON(`${API}/market-data`)]] : []),
];
const GLOBAL_SOURCES = [
  ["Vercel önbellek", () => getJSON("/api/global", 6000)],
  ["CoinGecko", () => getJSON(`${CG}/global`)],
  ["CoinPaprika (yedek)", paprikaGlobal],
  ...(API ? [["Sunucu", () => getJSON(`${API}/global-stats`)]] : []),
];

async function firstGood(sources, check) {
  const failed = [];
  for (const [name, load] of sources) {
    try {
      const v = await load();
      const ok = check(v);
      if (ok) return { value: ok, source: name, failed };
      failed.push(name);
    } catch (e) {
      failed.push(name);
    }
  }
  return { value: null, source: null, failed };
}

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (!c || !Array.isArray(c.coins) || !c.coins.length || Date.now() - c.t > CACHE_MAX_AGE) return null;
    return c;
  } catch (e) {
    return null;
  }
}

function writeCache(coins, global) {
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), coins, global })); } catch (e) { /* full or private mode */ }
}

const nowTR = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Istanbul" });

/*
 * Live market data:
 * - several sources in order (Vercel cache, CoinGecko, Binance/CoinPaprika fallbacks), first good answer wins
 * - last good data is kept in the browser, so a reload during an outage still shows prices ("stale" instead of empty)
 * - 30 s refresh, paused while the tab is hidden, instant refresh when it comes back or the network returns
 * - per-coin tick direction for the flash effect, and a real event log for the "Sistem kaydı" panel
 */
export default function useMarket() {
  const cached = useRef(typeof window !== "undefined" ? readCache() : null);
  const [coins, setCoins] = useState(() => (cached.current ? cached.current.coins : []));
  const [global, setGlobal] = useState(() => (cached.current ? cached.current.global : null));
  const [status, setStatus] = useState("loading"); // loading | live | stale | error | offline
  const [updatedAt, setUpdatedAt] = useState(() => (cached.current ? new Date(cached.current.t) : null));
  const [ticks, setTicks] = useState({});
  const [source, setSource] = useState(null);
  const [logs, setLogs] = useState(() => [{ id: 1, time: nowTR(), tone: "info", text: "LENSTEDREAL Quantum Terminal V11 başlatıldı." }]);
  const prev = useRef(cached.current ? Object.fromEntries(cached.current.coins.map((c) => [c.id, c.current_price])) : {});
  const hasData = useRef(Boolean(cached.current));
  const busy = useRef(false);
  const logId = useRef(2);
  const warned = useRef(new Set());

  const log = useCallback((text, tone = "info") => {
    const id = logId.current++;
    setLogs((l) => [{ id, time: nowTR(), tone, text }, ...l].slice(0, 60));
  }, []);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus(hasData.current ? "offline" : "error");
      log("İnternet bağlantısı yok. Son alınan veriler gösteriliyor.", "warn");
      busy.current = false;
      return;
    }
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    try {
      const [m, g] = await Promise.all([
        firstGood(MARKET_SOURCES, (v) => { const l = validCoins(v); return l.length ? l : null; }),
        firstGood(GLOBAL_SOURCES, (v) => (v && v.data && typeof v.data === "object" && Object.keys(v.data).length ? v.data : null)),
      ]);
      const ms = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0);
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
        if (g.value) setGlobal(g.value);
        writeCache(list, g.value || null);
        const moved = Object.keys(dir).length;
        const fresh = m.failed.filter((n) => !warned.current.has(n));
        fresh.forEach((n) => warned.current.add(n));
        if (fresh.length) log(`${fresh.join(", ")} yanıt vermedi, sıradaki kaynak kullanıldı.`, "info");
        log(`${list.length} varlık güncellendi · kaynak: ${m.source} · ${ms} ms${moved ? ` · ${moved} fiyat değişti` : ""}`, "ok");
      } else {
        setStatus(hasData.current ? "stale" : "error");
        log(hasData.current ? "Hiçbir kaynak yanıt vermedi. Son alınan veriler korunuyor." : "Hiçbir kaynak yanıt vermedi. 30 saniye sonra yeniden denenecek.", "down");
        if (g.value) setGlobal(g.value);
      }
    } catch (e) {
      setStatus(hasData.current ? "stale" : "error");
      log(`Senkronizasyon hatası: ${e && e.message ? e.message : "bilinmiyor"}`, "down");
    } finally {
      busy.current = false;
    }
  }, [log]);

  useEffect(() => {
    let timer = null;
    const start = () => { clearInterval(timer); timer = setInterval(load, REFRESH_MS); };
    const onVis = () => {
      if (document.hidden) clearInterval(timer);
      else { load(); start(); }
    };
    const onOnline = () => { log("Bağlantı geri geldi, veriler yenileniyor.", "ok"); load(); };
    const onOffline = () => { setStatus(hasData.current ? "offline" : "error"); log("İnternet bağlantısı koptu.", "warn"); };
    if (hasData.current) log("Önceki oturumdan kalan veriler gösteriliyor, canlı veri isteniyor.", "info");
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
  }, [load, log]);

  return { coins, global, status, updatedAt, ticks, reload: load, source, logs, log };
}
