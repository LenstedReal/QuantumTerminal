import React from "react";
import { closesOf, fmtPct, fmtPrice, isNum, STOCKS, tone, tvSymbolFor } from "@/lib/market";
import { CoinMark, Scramble } from "@/components/qt/ui";
import TVWidget from "@/components/qt/TVWidget";

const QUICK = ["bitcoin", "ethereum", "solana", "ripple"];

function Change({ label, v }) {
  return (
    <span className={`qt-chg ${tone(v)}`}>
      <span className="qt-chg-k">{label}</span>
      <span className="qt-num">{fmtPct(v)}</span>
    </span>
  );
}

export default function ChartPanel({ asset, coins, onPick, tick, stamp, loading }) {
  const isStock = asset && asset.kind === "stock";
  const coin = !isStock ? asset : null;
  const tv = isStock ? asset.tv : tvSymbolFor(coin);
  const closes = coin ? closesOf(coin) : [];
  const lo = closes.length ? Math.min(...closes) : null;
  const hi = closes.length ? Math.max(...closes) : null;
  const pos = coin && isNum(lo) && isNum(hi) && hi > lo ? Math.max(0, Math.min(1, (coin.current_price - lo) / (hi - lo))) : null;
  const quick = QUICK.map((id) => (coins || []).find((c) => c.id === id)).filter(Boolean);

  return (
    <section className="qt-panel qt-chart" aria-label="Grafik" data-testid="chart-panel">
      <div className="qt-asset">
        <div className="qt-asset-id">
          {coin ? <CoinMark coin={coin} size={40} /> : asset ? <span className="qt-coinmark is-letter is-stock" style={{ width: 40, height: 40 }} aria-hidden="true">{asset.symbol.charAt(0)}</span> : <span className="qt-coinmark is-pending" style={{ width: 40, height: 40 }} aria-hidden="true" />}
          <div className="qt-asset-names">
            <h1 className="qt-asset-name">{asset ? asset.name : loading ? "Yükleniyor" : "Piyasa verisi bekleniyor"}</h1>
            <span className="qt-asset-sym">{asset ? (isStock ? `${asset.venue}: ${asset.symbol}` : `${String(asset.symbol).toUpperCase()} / USD`) : "BTC / USD grafiği"}</span>
          </div>
        </div>

        {coin && (
          <div className="qt-asset-price">
            <span key={tick ? stamp : "s"} className={`qt-big qt-num${tick ? ` flash-${tick}` : ""}`} data-testid="asset-price">
              <Scramble text={fmtPrice(coin.current_price)} />
            </span>
            <div className="qt-chgs">
              <Change label="1s" v={coin.price_change_percentage_1h_in_currency} />
              <Change label="24s" v={coin.price_change_percentage_24h} />
              <Change label="7g" v={coin.price_change_percentage_7d_in_currency} />
            </div>
          </div>
        )}
        {isStock && <p className="qt-asset-note">Hisse fiyatı ve geçmişi grafikte, TradingView verisiyle.</p>}

        {pos != null && (
          <div className="qt-range" aria-label={`7 günlük aralık: en düşük ${fmtPrice(lo)}, en yüksek ${fmtPrice(hi)}`}>
            <span className="qt-range-end qt-num">{fmtPrice(lo)}</span>
            <span className="qt-range-bar"><span className="qt-range-fill" style={{ width: `${pos * 100}%` }} /><span className="qt-range-dot" style={{ left: `${pos * 100}%` }} /></span>
            <span className="qt-range-end qt-num">{fmtPrice(hi)}</span>
            <span className="qt-range-k">7 günlük aralık</span>
          </div>
        )}
      </div>

      <div className="qt-quick" role="group" aria-label="Hızlı seçim">
        {quick.map((c) => (
          <button key={c.id} type="button" className="qt-chip" aria-pressed={asset && asset.id === c.id} onClick={() => onPick(c.id)} data-testid={`chip-${String(c.symbol).toUpperCase()}`}>
            {String(c.symbol).toUpperCase()}
          </button>
        ))}
        {quick.length > 0 && <span className="qt-quick-sep" aria-hidden="true" />}
        {STOCKS.map((s) => (
          <button key={s.id} type="button" className="qt-chip is-stock" aria-pressed={asset && asset.id === s.id} onClick={() => onPick(s.id)} data-testid={`chip-${s.symbol}`}>
            {s.symbol}
          </button>
        ))}
      </div>

      <TVWidget
        className="qt-chart-tv"
        label="Grafik"
        script="embed-widget-advanced-chart.js"
        config={{
          autosize: true,
          symbol: tv,
          interval: "D",
          timezone: "Europe/Istanbul",
          theme: "dark",
          style: "1",
          locale: "tr",
          backgroundColor: "rgba(9, 15, 28, 1)",
          gridColor: "rgba(120, 160, 200, 0.06)",
          allow_symbol_change: true,
          calendar: false,
          hide_volume: false,
          support_host: "https://www.tradingview.com",
        }}
      />
    </section>
  );
}
