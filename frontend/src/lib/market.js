/* Market model shared by the whole interface: markets, formatting (Turkish), symbol mapping and the transparent analysis. */

export const MARKETS = [
  { id: "kripto", label: "Kripto", note: "CoinGecko ilk 250, 24 saatlik" },
  { id: "us", label: "ABD hisseleri", short: "ABD", note: "Piyasa değerine göre ilk 200" },
  { id: "bist", label: "BIST", note: "Piyasa değerine göre ilk 150" },
  { id: "fx", label: "Döviz", note: "TL çiftleri, majörler, gelişen piyasalar" },
  { id: "emtia", label: "Emtia", note: "Değerli metaller, enerji, tarım" },
  { id: "endeks", label: "Endeksler", short: "Endeks", note: "Borsa endeksleri ve tahvil faizleri" },
];
export const marketLabel = (id) => (MARKETS.find((m) => m.id === id) || { label: id }).label;

export const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const clamp = (v, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));
const NBSP = " ";
const MINUS = "−";

function decimals(v) {
  const a = Math.abs(v);
  if (a >= 1000) return 2;
  if (a >= 1) return 2;
  if (a >= 0.01) return 4;
  if (a >= 0.0001) return 6;
  return 8;
}

export function fmtNum(v, digits) {
  if (!isNum(v)) return "—";
  const d = digits == null ? decimals(v) : digits;
  return v.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

const CUR = { USD: ["$", ""], EUR: ["€", ""], GBP: ["£", ""], TRY: ["", `${NBSP}₺`] };

// Price in the instrument's own terms: "$190,50", "312,50 ₺", FX rates and index points without a sign.
export function fmtPrice(v, cur = "USD", digits) {
  if (!isNum(v)) return "—";
  const s = fmtNum(v, digits);
  if (!cur) return s;
  const c = CUR[cur];
  return c ? `${c[0]}${s}${c[1]}` : `${s}${NBSP}${cur}`;
}

export function priceOf(r) {
  if (!r) return "—";
  if (r.m === "fx") return fmtNum(r.p, Math.abs(r.p) < 20 ? 4 : 2);
  if (r.m === "endeks") return fmtNum(r.p, 2);
  return fmtPrice(r.p, r.cur || (r.m === "kripto" ? "USD" : null));
}

export function fmtCompact(v, cur = "USD") {
  if (!isNum(v)) return "—";
  const a = Math.abs(v);
  const [n, u] = a >= 1e12 ? [v / 1e12, "tn"] : a >= 1e9 ? [v / 1e9, "mr"] : a >= 1e6 ? [v / 1e6, "mn"] : a >= 1e3 ? [v / 1e3, "bin"] : [v, ""];
  const s = n.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + (u ? `${NBSP}${u}` : "");
  if (!cur) return s;
  const c = CUR[cur];
  return c ? `${c[0]}${s}${c[1]}` : `${s}${NBSP}${cur}`;
}

export function fmtPct(v, { digits = 2, sign = true } = {}) {
  if (!isNum(v)) return "—";
  const s = Math.abs(v).toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const pre = !sign ? "" : v > 0 ? "+" : v < 0 ? MINUS : "";
  return `${pre}%${s}`;
}

export const tone = (v) => (!isNum(v) || Math.abs(v) < 0.005 ? "flat" : v > 0 ? "up" : "down");

export const trLower = (s) => String(s || "").toLocaleLowerCase("tr-TR");

/* ---------- symbols ---------- */
const BINANCE = new Set("btc eth bnb sol xrp doge ada trx avax link dot bch ltc near uni xlm atom etc fil apt arb op sui ton shib pepe icp hbar inj kas render rndr imx stx vet algo grt ftm aave mkr qnt egld sand mana axs theta xtz eos flow chz neo ksm zec dash comp snx crv ldo gala enj 1inch bat rune kava cake ens wld sei tia jup pyth bonk floki wif ordi pendle ena".split(" "));
const STABLES = new Set("usdt usdc dai fdusd tusd usdd usde pyusd busd usdp gusd frax lusd eurc eurt usds usd0 rlusd usdtb susde".split(" "));

export const isStable = (r) => r && r.m === "kripto" && STABLES.has(trLower(r.sym));

const EMBED = { "SP:SPX": "FOREXCOM:SPXUSD", "DJ:DJI": "FOREXCOM:DJI", "NASDAQ:NDX": "FOREXCOM:NSXUSD", "NASDAQ:IXIC": "FOREXCOM:NSXUSD", "CBOE:VIX": "TVC:VIX", "FX_IDC:XAUTRYG": "OANDA:XAUUSD" };
// BIST data may not be shown in embedded TradingView widgets (licence): those open on tradingview.com instead.
export const embeddable = (r) => !(r && (r.m === "bist" || /^BIST:/.test(r.tv || r.id || "")));
export const tvLink = (r) => `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvFor(r))}`;
export function tvFor(r) {
  if (!r) return "BINANCE:BTCUSDT";
  if (r.tv) return EMBED[r.tv] || r.tv;
  const s = trLower(r.sym);
  if (s === "wbtc" || s === "cbbtc") return "BINANCE:BTCUSDT";
  if (s === "steth" || s === "wsteth" || s === "weth" || s === "weeth") return "BINANCE:ETHUSDT";
  if (STABLES.has(s)) return s === "usdt" ? "BINANCE:USDCUSDT" : `CRYPTO:${s.toUpperCase()}USD`;
  if (BINANCE.has(s)) return `BINANCE:${s.toUpperCase()}USDT`;
  return `CRYPTO:${s.toUpperCase()}USD`;
}

/* ---------- gram gold (computed): ounce gold in USD x USD/TRY / 31.1035 ---------- */
export const OUNCE_G = 31.1034768;
export function gramGold(gold, usdtry) {
  if (!gold || !usdtry || !isNum(gold.p) || !isNum(usdtry.p)) return null;
  const p = (gold.p * usdtry.p) / OUNCE_G;
  const ch = isNum(gold.ch) && isNum(usdtry.ch) ? ((1 + gold.ch / 100) * (1 + usdtry.ch / 100) - 1) * 100 : null;
  return {
    id: "CALC:GRAMALTIN", tv: "FX_IDC:XAUTRYG", m: "emtia", sym: "GRAM", name: "Gram altın (hesaplanan)", ex: "Hesaplama", cur: "TRY",
    p, ch, cha: isNum(ch) ? p - p / (1 + ch / 100) : null, calc: true,
    note: `${gold.name} × Dolar/TL ÷ 31,1035`,
  };
}

/* ---------- analysis ---------- */
export const WEIGHTS = { rec: 0.35, pw: 0.25, ch: 0.2, rsi: 0.2 };

export function recLabel(v) {
  if (!isNum(v)) return "—";
  return v >= 0.5 ? "Güçlü al" : v >= 0.1 ? "Al" : v > -0.1 ? "Nötr" : v > -0.5 ? "Sat" : "Güçlü sat";
}

export function labelFor(score) {
  if (score >= 45) return { text: "Güçlü yükseliş eğilimi", tone: "up" };
  if (score >= 15) return { text: "Yükseliş eğilimi", tone: "up" };
  if (score > -15) return { text: "Yatay, net yön yok", tone: "flat" };
  if (score > -45) return { text: "Düşüş eğilimi", tone: "down" };
  return { text: "Güçlü düşüş eğilimi", tone: "down" };
}

export const rsiZone = (r) => (!isNum(r) ? "—" : r >= 70 ? "aşırı alım bölgesi" : r <= 30 ? "aşırı satım bölgesi" : "dengeli bölge");

const pctWord = (v, up, down) => `${fmtPct(Math.abs(v), { sign: false })} ${v >= 0 ? up : down}`;

/*
 * Transparent score from real data, -100..+100:
 *   35% TradingView technical rating (26 indicators), 25% weekly change, 20% daily change, 20% RSI(14).
 * Missing inputs are left out and the remaining weights are rescaled; fewer inputs lower the confidence.
 */
export function analyzeQuote(r) {
  if (!r) return { ok: false, reason: "Bir sembol seç." };
  if (isStable(r)) return { ok: false, stable: true, reason: `${r.name} bir sabit coin: fiyatı 1 dolarda tutulmaya çalışılır, bu yüzden eğilim analizi anlamlı değil.` };
  const day = r.m === "kripto" ? "Son 24 saate göre" : "Önceki kapanışa göre";
  const all = [
    { key: "rec", label: "Teknik puan", hint: "TradingView: 26 gösterge (ortalamalar, osilatörler)", v: r.rec, comp: isNum(r.rec) ? clamp(r.rec) : null, display: isNum(r.rec) ? `${recLabel(r.rec)} (${fmtNum(r.rec, 2)})` : "veri yok" },
    { key: "pw", label: "Haftalık değişim", hint: "Bir hafta önceye göre", v: r.pw, comp: isNum(r.pw) ? Math.tanh(r.pw / 8) : null, display: fmtPct(r.pw) },
    { key: "ch", label: r.m === "kripto" ? "24 saatlik değişim" : "Günlük değişim", hint: day, v: r.ch, comp: isNum(r.ch) ? Math.tanh(r.ch / 4) : null, display: fmtPct(r.ch) },
    { key: "rsi", label: "RSI (14)", hint: rsiZone(r.rsi), v: r.rsi, comp: isNum(r.rsi) ? clamp((r.rsi - 50) / 25) : null, display: isNum(r.rsi) ? fmtNum(r.rsi, 0) : "veri yok" },
  ].map((f) => ({ ...f, weight: WEIGHTS[f.key] }));
  const have = all.filter((f) => f.comp !== null);
  if (have.length < 2) return { ok: false, reason: "Bu sembol için analiz edecek kadar veri gelmedi." };
  const wsum = have.reduce((s, f) => s + f.weight, 0);
  const raw = have.reduce((s, f) => s + f.weight * f.comp, 0) / wsum;
  const score = Math.round(clamp(raw) * 100);
  const label = labelFor(score);
  const strong = have.filter((f) => Math.abs(f.comp) > 0.1);
  let conf = strong.length ? strong.filter((f) => Math.sign(f.comp) === Math.sign(raw || 1)).length / strong.length : 0.5;
  conf -= 0.15 * (4 - have.length); // each missing input lowers the confidence
  const confidence = Math.abs(score) < 15 ? "düşük" : conf >= 0.75 ? "yüksek" : conf >= 0.5 ? "orta" : "düşük";

  const parts = [];
  if (isNum(r.ch)) parts.push(`${r.name} ${r.m === "kripto" ? "son 24 saatte" : "bugün"} ${Math.abs(r.ch) < 0.01 ? "yatay" : pctWord(r.ch, "yükseldi", "geriledi")}${isNum(r.pw) ? `, bir haftada ${Math.abs(r.pw) < 0.01 ? "yatay kaldı" : pctWord(r.pw, "değer kazandı", "değer kaybetti")}` : ""}.`);
  if (isNum(r.rec)) parts.push(`TradingView teknik puanı: ${recLabel(r.rec).toLocaleLowerCase("tr-TR")}.`);
  if (isNum(r.rsi)) parts.push(`RSI ${Math.round(r.rsi)} ile ${rsiZone(r.rsi)}.`);
  if (isNum(r.rsi) && r.rsi >= 70) parts.push("Aşırı alım, kısa vadede soluklanma riskine işaret edebilir.");
  if (isNum(r.rsi) && r.rsi <= 30) parts.push("Aşırı satım, tepki yükselişi ihtimaline işaret edebilir.");

  return {
    ok: true, score, label, confidence, factors: all, summary: parts.join(" "),
    missing: all.filter((f) => f.comp === null).map((f) => f.label),
  };
}

/* ---------- market breadth ---------- */
export function breadth(rows) {
  const list = (rows || []).filter((r) => isNum(r.ch));
  const up = list.filter((r) => r.ch > 0.005).length;
  const down = list.filter((r) => r.ch < -0.005).length;
  const avg = list.length ? list.reduce((s, r) => s + r.ch, 0) / list.length : null;
  const sorted = [...list].sort((a, b) => b.ch - a.ch);
  return { total: list.length, up, down, flat: list.length - up - down, avg, gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse() };
}
