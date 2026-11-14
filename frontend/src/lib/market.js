// Market math for the terminal: formatting (Turkish locale), indicators and the transparent signal score.
// Everything here is a pure function of CoinGecko /coins/markets data (sparkline=true, 1h/24h/7d changes).

const NBSP = " ";
const MINUS = "−";

export const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/* ---------- formatting ---------- */
export function fmtPrice(v) {
  if (!isNum(v)) return "—";
  const a = Math.abs(v);
  const digits = a >= 1000 ? 2 : a >= 1 ? 2 : a >= 0.01 ? 4 : a >= 0.0001 ? 6 : 8;
  return "$" + v.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtCompact(v) {
  if (!isNum(v)) return "—";
  const a = Math.abs(v);
  const f = (n, u) => "$" + n.toLocaleString("tr-TR", { maximumFractionDigits: n >= 100 ? 0 : 2 }) + NBSP + u;
  if (a >= 1e12) return f(v / 1e12, "tn");
  if (a >= 1e9) return f(v / 1e9, "mr");
  if (a >= 1e6) return f(v / 1e6, "mn");
  return "$" + Math.round(v).toLocaleString("tr-TR");
}

// Turkish style percent: "%2,13" with an explicit sign when asked.
export function fmtPct(v, { digits = 2, sign = true } = {}) {
  if (!isNum(v)) return "—";
  const body = "%" + Math.abs(v).toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (!sign) return (v < 0 ? MINUS : "") + body;
  return (v > 0 ? "+" : v < 0 ? MINUS : "") + body;
}

export const tone = (v) => (!isNum(v) ? "flat" : v > 0 ? "up" : v < 0 ? "down" : "flat");

/* ---------- indicators ---------- */
export function sma(values, n) {
  if (!values || values.length < n) return null;
  let s = 0;
  for (let i = values.length - n; i < values.length; i++) s += values[i];
  return s / n;
}

// Wilder's RSI on closes; returns the latest value (0..100) or null.
export function rsi(closes, period = 14) {
  if (!closes || closes.length <= period) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let ag = gain / period, al = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (al === 0) return ag === 0 ? 50 : 100;
  return 100 - 100 / (1 + ag / al);
}

// Daily volatility in % from hourly closes (std-dev of hourly log returns × √24).
export function dailyVolatility(closes) {
  if (!closes || closes.length < 25) return null;
  const r = [];
  for (let i = 1; i < closes.length; i++) if (closes[i] > 0 && closes[i - 1] > 0) r.push(Math.log(closes[i] / closes[i - 1]));
  if (r.length < 24) return null;
  const m = r.reduce((a, b) => a + b, 0) / r.length;
  const v = r.reduce((a, b) => a + (b - m) * (b - m), 0) / (r.length - 1);
  return Math.sqrt(v) * Math.sqrt(24) * 100;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ---------- classification ---------- */
const STABLE = new Set(["usdt", "usdc", "dai", "fdusd", "usde", "usds", "pyusd", "tusd", "usdd", "busd", "usd1", "usdtb", "gusd", "frax", "lusd", "eurc"]);
export const isStablecoin = (c) => !!c && (STABLE.has(String(c.symbol || "").toLowerCase()) ||
  (isNum(c.current_price) && Math.abs(c.current_price - 1) < 0.02 && /usd|dollar|stable/i.test(String(c.name || ""))));

export function closesOf(coin) {
  const p = coin && coin.sparkline_in_7d && coin.sparkline_in_7d.price;
  return Array.isArray(p) ? p.filter(isNum) : [];
}

export const WEIGHTS = { trend: 0.35, mom7: 0.25, mom24: 0.2, rsi: 0.2 };

export function labelFor(score) {
  if (score >= 45) return { text: "Güçlü yükseliş eğilimi", tone: "up" };
  if (score >= 15) return { text: "Yükseliş eğilimi", tone: "up" };
  if (score > -15) return { text: "Yatay, net yön yok", tone: "flat" };
  if (score > -45) return { text: "Düşüş eğilimi", tone: "down" };
  return { text: "Güçlü düşüş eğilimi", tone: "down" };
}

/*
 * The signal score (−100…100) is a weighted sum of four components, each squashed to −1…1:
 *   trend  = tanh(gap% / 2)   gap = short (24h) average vs long (72h) average of hourly prices
 *   mom7   = tanh(change7d / 12)
 *   mom24  = tanh(change24h / 5)
 *   rsi    = clamp((RSI14 − 50) / 25, −1, 1)
 * It describes the recent trend; it does not predict the future.
 */
export function analyze(coin) {
  if (!coin) return { ok: false, reason: "Bir varlık seç." };
  if (isStablecoin(coin)) {
    return { ok: false, stable: true, reason: `${coin.name} bir sabit coin: fiyatı 1 dolarda tutulmaya çalışılır, bu yüzden eğilim analizi anlamlı değil.` };
  }
  const closes = closesOf(coin);
  if (closes.length < 80) return { ok: false, reason: "Bu varlık için yeterli fiyat geçmişi yok (en az 80 saatlik veri gerekir)." };

  const price = isNum(coin.current_price) ? coin.current_price : closes[closes.length - 1];
  const s24 = sma(closes, 24), s72 = sma(closes, 72);
  const gap = s24 && s72 ? ((s24 - s72) / s72) * 100 : 0;
  const ch24 = isNum(coin.price_change_percentage_24h) ? coin.price_change_percentage_24h : 0;
  const ch7 = isNum(coin.price_change_percentage_7d_in_currency) ? coin.price_change_percentage_7d_in_currency
    : ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;
  const r = rsi(closes, 14);
  const vol = dailyVolatility(closes);
  const lo = Math.min(...closes, price), hi = Math.max(...closes, price);
  const pos = hi > lo ? (price - lo) / (hi - lo) : 0.5;

  const comp = {
    trend: Math.tanh(gap / 2),
    mom7: Math.tanh(ch7 / 12),
    mom24: Math.tanh(ch24 / 5),
    rsi: r == null ? 0 : clamp((r - 50) / 25, -1, 1),
  };
  const raw = Object.keys(WEIGHTS).reduce((s, k) => s + WEIGHTS[k] * comp[k], 0);
  const score = Math.round(clamp(raw, -1, 1) * 100);
  const label = labelFor(score);

  // Confidence: do the components agree, is the move calm enough, is the history complete?
  const meaningful = Object.values(comp).filter((c) => Math.abs(c) >= 0.1);
  const agree = meaningful.length ? meaningful.filter((c) => Math.sign(c) === Math.sign(raw || 1)).length / meaningful.length : 0.5;
  let conf = agree;
  if (vol != null && vol > 6) conf -= 0.2;
  if (closes.length < 140) conf -= 0.15;
  const confidence = Math.abs(score) < 15 ? "düşük" : conf >= 0.75 ? "yüksek" : conf >= 0.5 ? "orta" : "düşük";

  const rsiZone = r == null ? "—" : r >= 70 ? "aşırı alım bölgesi" : r <= 30 ? "aşırı satım bölgesi" : "dengeli bölge";
  const volZone = vol == null ? "—" : vol < 2 ? "sakin" : vol < 5 ? "orta" : "çok oynak";

  const factors = [
    { key: "trend", label: "Ortalama farkı", hint: "24 saatlik ortalama, 72 saatlik ortalamaya göre", display: fmtPct(gap), comp: comp.trend, weight: WEIGHTS.trend },
    { key: "mom7", label: "7 günlük değişim", hint: "Bir hafta önceki fiyata göre", display: fmtPct(ch7), comp: comp.mom7, weight: WEIGHTS.mom7 },
    { key: "mom24", label: "24 saatlik değişim", hint: "Dünkü fiyata göre", display: fmtPct(ch24), comp: comp.mom24, weight: WEIGHTS.mom24 },
    { key: "rsi", label: "RSI (14 saat)", hint: rsiZone, display: r == null ? "—" : r.toLocaleString("tr-TR", { maximumFractionDigits: 0 }), comp: comp.rsi, weight: WEIGHTS.rsi },
  ];

  const parts = [];
  const day = Math.abs(ch24) < 0.01 ? "son 24 saatte yatay seyretti" : `son 24 saatte ${fmtPct(Math.abs(ch24), { sign: false })} ${ch24 >= 0 ? "yükseldi" : "geriledi"}`;
  const week = Math.abs(ch7) < 0.01 ? "bir haftada yatay kaldı" : `bir haftada ${fmtPct(Math.abs(ch7), { sign: false })} değer ${ch7 >= 0 ? "kazandı" : "kaybetti"}`;
  parts.push(`${coin.name} ${day}, ${week}.`);
  if (Math.abs(gap) >= 0.05) parts.push(`Kısa vadeli ortalama uzun vadelinin ${fmtPct(Math.abs(gap), { sign: false })} ${gap >= 0 ? "üstünde" : "altında"}.`);
  if (r != null) parts.push(`RSI ${Math.round(r)} ile ${rsiZone}.`);
  if (r != null && r >= 70) parts.push("Aşırı alım, kısa vadede soluklanma riskine işaret edebilir.");
  if (r != null && r <= 30) parts.push("Aşırı satım, tepki yükselişi ihtimaline işaret edebilir.");

  return {
    ok: true, score, label, confidence, factors, summary: parts.join(" "),
    rsi: r, rsiZone, vol, volZone, range: { lo, hi, pos }, price, points: closes.length,
  };
}

/* ---------- TradingView symbols ---------- */
const BINANCE = new Set(["btc", "eth", "bnb", "sol", "xrp", "doge", "ada", "trx", "avax", "link", "dot", "ton", "shib", "ltc", "bch", "near", "uni", "apt", "icp", "etc", "fil", "atom", "xlm", "sui", "pepe", "hbar", "arb", "op", "inj", "render", "aave", "wld", "ena", "tao", "pol", "trump", "bonk", "wif", "sei", "tia", "jup", "ondo", "kas", "hype", "xmr", "algo", "vet", "cro"]);
const WRAPPED = { wbtc: "BINANCE:BTCUSDT", cbbtc: "BINANCE:BTCUSDT", weth: "BINANCE:ETHUSDT", steth: "BINANCE:ETHUSDT", wsteth: "BINANCE:ETHUSDT", weeth: "BINANCE:ETHUSDT", reth: "BINANCE:ETHUSDT", wbeth: "BINANCE:ETHUSDT" };
const STABLE_TV = { usdt: "BINANCE:USDCUSDT", usdc: "BINANCE:USDCUSDT", fdusd: "BINANCE:FDUSDUSDT", dai: "COINBASE:DAIUSD" };

export function tvSymbolFor(coin) {
  const s = String((coin && coin.symbol) || "").toLowerCase();
  if (!s) return "BINANCE:BTCUSDT";
  if (WRAPPED[s]) return WRAPPED[s];
  if (STABLE_TV[s]) return STABLE_TV[s];
  if (BINANCE.has(s)) return `BINANCE:${s.toUpperCase()}USDT`;
  return `CRYPTO:${s.toUpperCase()}USD`;
}

export const STOCKS = [
  { id: "stock-nvda", symbol: "NVDA", name: "NVIDIA", tv: "NASDAQ:NVDA", venue: "NASDAQ" },
  { id: "stock-aapl", symbol: "AAPL", name: "Apple", tv: "NASDAQ:AAPL", venue: "NASDAQ" },
  { id: "stock-tsla", symbol: "TSLA", name: "Tesla", tv: "NASDAQ:TSLA", venue: "NASDAQ" },
  { id: "stock-googl", symbol: "GOOGL", name: "Alphabet", tv: "NASDAQ:GOOGL", venue: "NASDAQ" },
];

/* ---------- small helpers ---------- */
export function sparkPath(values, w, h, pad = 2) {
  const v = (values || []).filter(isNum);
  if (v.length < 2) return "";
  let lo = Infinity, hi = -Infinity;
  for (const x of v) { if (x < lo) lo = x; if (x > hi) hi = x; }
  const span = hi - lo || 1;
  const step = (w - pad * 2) / (v.length - 1);
  let d = "";
  for (let i = 0; i < v.length; i++) {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (v[i] - lo) / span);
    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d;
}

// Down-sample a long series to at most n points (keeps first/last), for light SVG paths.
export function thin(values, n) {
  const v = (values || []).filter(isNum);
  if (v.length <= n) return v;
  const out = [];
  const step = (v.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) out.push(v[Math.round(i * step)]);
  return out;
}

export function trLower(s) { return String(s || "").toLocaleLowerCase("tr-TR"); }
