import { useCallback, useEffect, useRef, useState } from "react";

const CG = "https://api.coingecko.com/api/v3";
// Prefer the backend proxy (cached, rate-limit tolerant) when it is configured; otherwise, or when it fails,
// ask CoinGecko directly from the browser.
const BACKEND = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = BACKEND ? `${BACKEND}/api` : null;
const REFRESH_MS = 30000;

const MARKETS_QS = "vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d";

async function getJSON(url, ms = 12000) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" }, signal: ctrl ? ctrl.signal : undefined });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    if (t) clearTimeout(t);
  }
}

async function firstOk(urls) {
  let last;
  for (const u of urls) {
    try { return await getJSON(u); } catch (e) { last = e; }
  }
  throw last || new Error("no source");
}

/*
 * Live market data with:
 * - 30 s refresh, paused while the tab is hidden (saves the free API quota), immediate refresh when it comes back
 * - last good data kept on errors / rate limits ("stale" status instead of an empty screen)
 * - per-coin tick direction (up/down) for the flash effect
 */
export default function useMarket() {
  const [coins, setCoins] = useState([]);
  const [global, setGlobal] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | live | stale | error | offline
  const [updatedAt, setUpdatedAt] = useState(null);
  const [ticks, setTicks] = useState({});
  const prev = useRef({});
  const hasData = useRef(false);
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
      const marketUrls = [API && `${API}/market-data`, `${CG}/coins/markets?${MARKETS_QS}`].filter(Boolean);
      const globalUrls = [API && `${API}/global-stats`, `${CG}/global`].filter(Boolean);
      const [m, g] = await Promise.all([firstOk(marketUrls).catch(() => null), firstOk(globalUrls).catch(() => null)]);
      const list = Array.isArray(m) ? m.filter((c) => c && c.id && typeof c.current_price === "number") : null;
      if (list && list.length) {
        const dir = {};
        for (const c of list) {
          const p = prev.current[c.id];
          if (typeof p === "number" && p !== c.current_price) dir[c.id] = c.current_price > p ? "up" : "down";
          prev.current[c.id] = c.current_price;
        }
        setTicks(dir);
        setCoins(list);
        hasData.current = true;
        setUpdatedAt(new Date());
        setStatus("live");
      } else {
        setStatus(hasData.current ? "stale" : "error");
      }
      const gd = g && g.data && typeof g.data === "object" ? g.data : null;
      if (gd && Object.keys(gd).length) setGlobal(gd);
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

  return { coins, global, status, updatedAt, ticks, reload: load };
}
