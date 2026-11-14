// GET /api/scan?m=kripto|us|bist|fx|emtia|endeks  ->  { m, at, src, rows: [...] }
// Shared CDN cache (s-maxage 10 s): every visitor gets the same answer, upstream sees at most a few calls per minute.
const { fetchJSON, tvScan, tvTickers, tvLogos, withLogos, num, logoUrl } = require("./_tv");

const FX = [
  ["FX_IDC:USDTRY", "Dolar / TL"], ["FX_IDC:EURTRY", "Euro / TL"], ["FX_IDC:GBPTRY", "Sterlin / TL"], ["FX_IDC:CHFTRY", "İsviçre frangı / TL"],
  ["FX_IDC:JPYTRY", "Japon yeni / TL"], ["FX_IDC:CADTRY", "Kanada doları / TL"], ["FX_IDC:AUDTRY", "Avustralya doları / TL"], ["FX_IDC:SARTRY", "Suudi riyali / TL"],
  ["FX_IDC:RUBTRY", "Rus rublesi / TL"], ["FX_IDC:CNYTRY", "Çin yuanı / TL"], ["FX_IDC:AEDTRY", "BAE dirhemi / TL"], ["FX_IDC:EURUSD", "Euro / Dolar"],
  ["FX_IDC:GBPUSD", "Sterlin / Dolar"], ["FX_IDC:USDJPY", "Dolar / Japon yeni"], ["FX_IDC:USDCHF", "Dolar / İsviçre frangı"], ["FX_IDC:AUDUSD", "Avustralya doları / Dolar"],
  ["FX_IDC:USDCAD", "Dolar / Kanada doları"], ["FX_IDC:NZDUSD", "Yeni Zelanda doları / Dolar"], ["FX_IDC:EURGBP", "Euro / Sterlin"], ["FX_IDC:EURJPY", "Euro / Japon yeni"],
  ["FX_IDC:GBPJPY", "Sterlin / Japon yeni"], ["FX_IDC:EURCHF", "Euro / İsviçre frangı"], ["FX_IDC:AUDJPY", "Avustralya doları / Japon yeni"], ["FX_IDC:EURAUD", "Euro / Avustralya doları"],
  ["FX_IDC:EURCAD", "Euro / Kanada doları"], ["FX_IDC:GBPCHF", "Sterlin / İsviçre frangı"], ["FX_IDC:USDCNY", "Dolar / Çin yuanı"], ["FX_IDC:USDRUB", "Dolar / Rus rublesi"],
  ["FX_IDC:USDINR", "Dolar / Hindistan rupisi"], ["FX_IDC:USDBRL", "Dolar / Brezilya reali"], ["FX_IDC:USDMXN", "Dolar / Meksika pesosu"], ["FX_IDC:USDZAR", "Dolar / G. Afrika randı"],
  ["FX_IDC:USDSAR", "Dolar / Suudi riyali"], ["FX_IDC:USDAED", "Dolar / BAE dirhemi"], ["FX_IDC:USDKRW", "Dolar / Kore wonu"], ["FX_IDC:USDPLN", "Dolar / Polonya zlotisi"],
  ["FX_IDC:USDSEK", "Dolar / İsveç kronu"], ["FX_IDC:USDNOK", "Dolar / Norveç kronu"], ["FX_IDC:USDSGD", "Dolar / Singapur doları"], ["FX_IDC:USDHKD", "Dolar / Hong Kong doları"],
];
const COMMODITIES = [
  ["cfd", [["TVC:GOLD", "Altın (ons)"], ["TVC:SILVER", "Gümüş (ons)"], ["TVC:PLATINUM", "Platin"], ["TVC:PALLADIUM", "Paladyum"],
    ["TVC:UKOIL", "Brent petrol"], ["TVC:USOIL", "WTI petrol"]]],
  ["futures", [["COMEX:GC1!", "Altın vadeli"], ["COMEX:SI1!", "Gümüş vadeli"], ["COMEX:HG1!", "Bakır vadeli"], ["NYMEX:NG1!", "Doğalgaz vadeli"],
    ["NYMEX:CL1!", "WTI vadeli"], ["ICEEUR:BRN1!", "Brent vadeli"], ["NYMEX:RB1!", "Benzin vadeli"], ["NYMEX:HO1!", "Isıtma yağı vadeli"],
    ["CBOT:ZW1!", "Buğday vadeli"], ["CBOT:ZC1!", "Mısır vadeli"], ["CBOT:ZS1!", "Soya fasulyesi vadeli"], ["ICEUS:KC1!", "Kahve vadeli"],
    ["ICEUS:SB1!", "Şeker vadeli"], ["ICEUS:CC1!", "Kakao vadeli"], ["ICEUS:CT1!", "Pamuk vadeli"]]],
];
const INDICES = [
  ["turkey", [["BIST:XU100", "BIST 100"], ["BIST:XU030", "BIST 30"], ["BIST:XU050", "BIST 50"], ["BIST:XBANK", "BIST Banka"], ["BIST:XUSIN", "BIST Sınai"],
    ["BIST:XHOLD", "BIST Holding"], ["BIST:XUTEK", "BIST Teknoloji"]]],
  ["america", [["SP:SPX", "S&P 500"], ["NASDAQ:NDX", "Nasdaq 100"], ["DJ:DJI", "Dow Jones"], ["NASDAQ:IXIC", "Nasdaq Bileşik"], ["CBOE:VIX", "VIX korku endeksi"]]],
  ["cfd", [["TVC:DXY", "Dolar endeksi (DXY)"], ["TVC:DEU40", "DAX 40"], ["TVC:UKX", "FTSE 100"], ["TVC:CAC40", "CAC 40"], ["TVC:SX5E", "Euro Stoxx 50"],
    ["TVC:NI225", "Nikkei 225"], ["TVC:HSI", "Hang Seng"], ["TVC:SHCOMP", "Şanghay Bileşik"], ["TVC:US10Y", "ABD 10 yıllık faiz"],
    ["TVC:US02Y", "ABD 2 yıllık faiz"], ["TVC:TR10Y", "Türkiye 10 yıllık faiz"], ["TVC:DE10Y", "Almanya 10 yıllık faiz"]]],
];

const STOCK_FILTER = (exchanges) => [
  { left: "type", operation: "in_range", right: ["stock", "dr"] },
  ...(exchanges ? [{ left: "exchange", operation: "in_range", right: exchanges }] : []),
  { left: "is_primary", operation: "equal", right: true },
];

async function stocks(market, exchanges, count) {
  const rows = await tvScan(market, { markets: [market], filter: STOCK_FILTER(exchanges), sort: { sortBy: "market_cap_basic", sortOrder: "desc" }, range: [0, count] });
  const missing = rows.filter((r) => !r.logo).map((r) => r.id);
  return missing.length ? withLogos(rows, await tvLogos(market, missing)) : rows;
}

const CG_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d%2C30d%2C1y";

function cgRow(c) {
  return {
    id: `CG:${c.id}`, cg: c.id, tv: null, sym: String(c.symbol || "").toUpperCase(), name: c.name, ex: "CoinGecko", cur: "USD",
    p: num(c.current_price), ch: num(c.price_change_percentage_24h), cha: num(c.price_change_24h), hi: num(c.high_24h), lo: num(c.low_24h), op: null,
    vol: num(c.total_volume), mc: num(c.market_cap), rank: num(c.market_cap_rank), sec: null, rec: null, rsi: null,
    p1h: num(c.price_change_percentage_1h_in_currency), pw: num(c.price_change_percentage_7d_in_currency), pm: num(c.price_change_percentage_30d_in_currency),
    p1y: num(c.price_change_percentage_1y_in_currency), py: null, h52: null, l52: null, ath: num(c.ath), logo: c.image || null,
  };
}

async function crypto() {
  try {
    const list = await fetchJSON(CG_URL, {}, 9000);
    const rows = (Array.isArray(list) ? list : []).map(cgRow).filter((r) => r.p !== null);
    if (!rows.length) throw new Error("boş");
    // TradingView technicals (rating, RSI) for the coins that trade against USDT on Binance.
    try {
      const tickers = rows.slice(0, 160).map((r) => `BINANCE:${r.sym}USDT`);
      const tech = await tvScan("crypto", { symbols: { tickers, query: { types: [] } }, range: [0, tickers.length] }, { cols: ["name", "close", "Recommend.All", "RSI", "Perf.YTD", "price_52_week_high", "price_52_week_low"] });
      const by = new Map(tech.map((t) => [t.id.split(":")[1].replace(/USDT$/, ""), t]));
      for (const r of rows) {
        const t = by.get(r.sym);
        if (t) Object.assign(r, { rec: t.rec, rsi: t.rsi, py: t.py, h52: t.h52, l52: t.l52, tv: t.id });
      }
    } catch (e) { /* technicals are optional */ }
    const noLogo = rows.filter((r) => !r.logo && r.tv);
    if (noLogo.length) {
      const logos = await tvLogos("crypto", noLogo.map((r) => r.tv));
      for (const r of noLogo) { const l = logos.get(r.tv); if (l) r.logo = l.logo; }
    }
    return { src: "CoinGecko + TradingView", rows };
  } catch (e) {
    const all = await fetchJSON("https://data-api.binance.vision/api/v3/ticker/24hr", {}, 9000);
    const rows = (Array.isArray(all) ? all : [])
      .filter((t) => /USDT$/.test(t.symbol) && !/(UP|DOWN|BULL|BEAR)USDT$/.test(t.symbol) && Number(t.quoteVolume) > 0)
      .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume)).slice(0, 200)
      .map((t, i) => {
        const sym = t.symbol.replace(/USDT$/, "");
        return { id: `BN:${sym}`, tv: `BINANCE:${t.symbol}`, sym, name: sym, ex: "Binance", cur: "USD", p: num(Number(t.lastPrice)), ch: num(Number(t.priceChangePercent)),
          cha: num(Number(t.priceChange)), hi: num(Number(t.highPrice)), lo: num(Number(t.lowPrice)), op: num(Number(t.openPrice)), vol: num(Number(t.quoteVolume)),
          mc: null, rank: i + 1, sec: null, rec: null, rsi: null, pw: null, pm: null, py: null, h52: null, l52: null, logo: logoUrl(`crypto/XTVC${sym}`) };
      });
    if (!rows.length) throw e;
    return { src: "Binance (yedek)", rows };
  }
}

const MARKETS = {
  kripto: crypto,
  us: async () => ({ src: "TradingView", rows: await stocks("america", ["NASDAQ", "NYSE", "AMEX"], 200) }),
  bist: async () => ({ src: "TradingView", rows: await stocks("turkey", null, 150) }),
  fx: async () => ({ src: "TradingView", rows: await tvTickers([["forex", FX]]) }),
  emtia: async () => ({ src: "TradingView", rows: await tvTickers(COMMODITIES) }),
  endeks: async () => ({ src: "TradingView", rows: await tvTickers(INDICES) }),
};

module.exports = async (req, res) => {
  const m = String((req.query && req.query.m) || "").toLowerCase();
  const run = MARKETS[m];
  if (!run) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(400).json({ error: "bilinmeyen piyasa", markets: Object.keys(MARKETS) });
  }
  try {
    const out = await run();
    if (!out.rows.length) throw new Error("boş");
    res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=60");
    return res.status(200).json({ m, at: Date.now(), src: out.src, rows: out.rows });
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "kaynak yanıt vermedi", detail: String((e && e.message) || e) });
  }
};
module.exports.MARKETS = MARKETS;
module.exports.lists = { FX, COMMODITIES, INDICES };
