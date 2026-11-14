// Server-side helpers: TradingView scanner (stocks, BIST, FX, commodities, indices with technicals), CoinGecko and Binance.
// Every upstream call has a timeout; callers try sources in order and use the first one that answers.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const FULL = ["name", "description", "close", "change", "change_abs", "high", "low", "open", "volume", "market_cap_basic", "currency", "sector",
  "Recommend.All", "RSI", "Perf.W", "Perf.1M", "Perf.YTD", "price_52_week_high", "price_52_week_low", "logoid", "exchange"];
const BASIC = ["name", "description", "close", "change", "change_abs", "high", "low", "open", "Recommend.All", "RSI", "Perf.W", "Perf.1M",
  "Perf.YTD", "price_52_week_high", "price_52_week_low", "exchange"];
const MIN = ["name", "description", "close", "change", "change_abs", "high", "low"];

async function fetchJSON(url, init = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { ...init, signal: ctrl.signal, headers: { accept: "application/json", "user-agent": UA, ...(init.headers || {}) } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const LOGO = "https://s3-symbol-logo.tradingview.com/";
const logoUrl = (id) => (typeof id === "string" && id ? `${LOGO}${id}.svg` : null);
const TV_HEADERS = { "content-type": "application/json", origin: "https://www.tradingview.com", referer: "https://www.tradingview.com/" };

function tvRow(ticker, cols, d, names) {
  const o = {};
  cols.forEach((c, i) => { o[c] = d ? d[i] : undefined; });
  const [ex, code] = String(ticker).split(":");
  return {
    id: ticker, tv: ticker, sym: o.name || code, name: (names && names[ticker]) || o.description || o.name || code, ex: o.exchange || ex,
    cur: typeof o.currency === "string" ? o.currency : null, p: num(o.close), ch: num(o.change), cha: num(o.change_abs),
    hi: num(o.high), lo: num(o.low), op: num(o.open), vol: num(o.volume), mc: num(o.market_cap_basic), sec: typeof o.sector === "string" ? o.sector : null,
    rec: num(o["Recommend.All"]), rsi: num(o.RSI), pw: num(o["Perf.W"]), pm: num(o["Perf.1M"]), py: num(o["Perf.YTD"]),
    h52: num(o.price_52_week_high), l52: num(o.price_52_week_low),
    logo: logoUrl(o.logoid),
  };
}

// One scan request; on error retries with smaller column sets and, if given, without filters.
async function tvScan(screener, body, { cols = FULL, names } = {}) {
  const sets = cols === FULL ? [FULL, BASIC, MIN] : cols === BASIC ? [BASIC, MIN] : [cols];
  const bodies = body.filter ? [body, { ...body, filter: undefined }] : [body];
  let last;
  for (const b of bodies) {
    for (const c of sets) {
      try {
        const j = await fetchJSON(`https://scanner.tradingview.com/${screener}/scan`, {
          method: "POST",
          headers: TV_HEADERS,
          body: JSON.stringify({ ...b, columns: c, options: { lang: "tr" } }),
        });
        if (!j || !Array.isArray(j.data)) throw new Error("boş yanıt");
        return j.data.map((x) => tvRow(x.s, c, x.d, names)).filter((r) => r.p !== null);
      } catch (e) {
        last = e;
      }
    }
  }
  throw last || new Error("tarama olmadı");
}

// Real TradingView logos, asked separately so a logo problem never costs the prices:
// forex pairs get both country flags, everything else its own logo. Any failure just means no logo.
async function tvLogos(screener, tickers) {
  const map = new Map();
  if (!tickers.length) return map;
  const pair = screener === "forex";
  const cols = pair ? ["base_currency_logoid", "currency_logoid"] : ["logoid"];
  try {
    const j = await fetchJSON(`https://scanner.tradingview.com/${screener}/scan`, {
      method: "POST", headers: TV_HEADERS,
      body: JSON.stringify({ symbols: { tickers, query: { types: [] } }, columns: cols, range: [0, tickers.length] }),
    });
    for (const x of (j && Array.isArray(j.data) ? j.data : [])) {
      const d = x.d || [];
      const logo = logoUrl(d[0]);
      const logo2 = pair ? logoUrl(d[1]) : null;
      if (logo) map.set(x.s, { logo, logo2 });
    }
  } catch (e) { /* no logos, prices still fine */ }
  return map;
}

function withLogos(rows, logos) {
  for (const r of rows) {
    const l = logos.get(r.id);
    if (l) { r.logo = r.logo || l.logo; if (l.logo2) r.logo2 = l.logo2; }
  }
  return rows;
}

// Fixed lists ([ticker, Turkish name]) are asked by ticker; unknown tickers are simply left out by TradingView.
async function tvTickers(groups) {
  const order = [];
  const names = {};
  const jobs = groups.map(async ([screener, list]) => {
    list.forEach(([t, n]) => { order.push(t); names[t] = n; });
    const tickers = list.map(([t]) => t);
    const [rows, logos] = await Promise.all([
      tvScan(screener, { symbols: { tickers, query: { types: [] } }, range: [0, list.length] }, { cols: BASIC, names }).catch(() => []),
      tvLogos(screener, tickers),
    ]);
    return withLogos(rows, logos);
  });
  const found = new Map((await Promise.all(jobs)).flat().map((r) => [r.id, r]));
  return order.map((t) => found.get(t)).filter(Boolean);
}

module.exports = { fetchJSON, tvScan, tvTickers, tvLogos, withLogos, tvRow, num, logoUrl, FULL, BASIC, MIN };
