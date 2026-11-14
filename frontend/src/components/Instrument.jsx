import React from "react";
import { embeddable, fmtCompact, fmtNum, fmtPct, isNum, marketLabel, priceOf, tone, tvFor, tvLink } from "@/lib/market";
import { Icon, Mark, Scramble } from "@/components/qt/ui";
import TVWidget from "@/components/qt/TVWidget";

const QUICK = ["CG:bitcoin", "CG:ethereum", "FX_IDC:USDTRY", "CALC:GRAMALTIN", "BIST:XU100", "SP:SPX", "TVC:GOLD", "NASDAQ:NVDA", "BIST:THYAO", "TVC:UKOIL"];

function Change({ label, v }) {
  if (!isNum(v)) return null;
  return (
    <span className={`qt-chg ${tone(v)}`}>
      <span className="qt-chg-k">{label}</span>
      <span className="qt-num">{fmtPct(v)}</span>
    </span>
  );
}

function Range({ label, lo, hi, p, fmt }) {
  if (!isNum(lo) || !isNum(hi) || !isNum(p) || hi <= lo) return null;
  const pos = Math.max(0, Math.min(1, (p - lo) / (hi - lo)));
  return (
    <div className="qt-range" aria-label={`${label}: en düşük ${fmt(lo)}, en yüksek ${fmt(hi)}`}>
      <span className="qt-range-k">{label}</span>
      <span className="qt-range-end qt-num">{fmt(lo)}</span>
      <span className="qt-range-bar"><span className="qt-range-fill" style={{ width: `${pos * 100}%` }} /><span className="qt-range-dot" style={{ left: `${pos * 100}%` }} /></span>
      <span className="qt-range-end qt-num">{fmt(hi)}</span>
    </div>
  );
}

export default function Instrument({ row, byId, favs, onFav, onPick, tick, loading }) {
  const fav = row ? favs.includes(row.id) : false;
  const fmt = (v) => priceOf(row ? { ...row, p: v } : { p: v });
  const quickIds = (favs.length ? favs : QUICK).filter((id) => byId.has(id)).slice(0, 10);
  const prevClose = row && isNum(row.p) && isNum(row.cha) ? row.p - row.cha : null;
  const stats = row ? [
    ["Önceki kapanış", isNum(prevClose) && row.m !== "kripto" ? fmt(prevClose) : null],
    ["Açılış", isNum(row.op) ? fmt(row.op) : null],
    [row.m === "kripto" ? "24s hacim" : "Hacim", isNum(row.vol) ? fmtCompact(row.vol, row.m === "kripto" ? "USD" : null) : null],
    ["Piyasa değeri", isNum(row.mc) ? fmtCompact(row.mc, row.cur || "USD") : null],
    ["Sıra", isNum(row.rank) ? `#${row.rank}` : null],
    ["Sektör", row.sec],
    ["Tüm zamanların zirvesi", isNum(row.ath) ? fmt(row.ath) : null],
    ["Değişim (tutar)", isNum(row.cha) ? `${row.cha > 0 ? "+" : row.cha < 0 ? "−" : ""}${fmt(Math.abs(row.cha))}` : null],
  ].filter(([, v]) => v) : [];

  return (
    <section className="qt-panel qt-chart" aria-labelledby="chart-title" data-testid="instrument">
      <div className="qt-panel-head">
        <h2 id="chart-title"><span className="qt-mod" aria-hidden="true">02</span>Quantum core chart</h2>
        <span className="qt-muted">{row ? `${marketLabel(row.m)} · ${row.ex || ""}` : "TradingView"}</span>
      </div>

      <div className="qt-asset">
        <div className="qt-asset-id">
          {row ? <Mark row={row} size={40} /> : <span className="qt-coinmark is-pending" style={{ width: 40, height: 40 }} aria-hidden="true" />}
          <div className="qt-asset-names">
            <h1 className="qt-asset-name" data-testid="asset-name">{row ? row.name : loading ? "Yükleniyor" : "Piyasa verisi bekleniyor"}</h1>
            <span className="qt-asset-sym">{row ? [row.sym, row.ex, row.cur].filter(Boolean).join(" · ") : "Veri gelince burada görünecek"}</span>
          </div>
          {row && (
            <button type="button" className={`qt-favbtn${fav ? " is-on" : ""}`} aria-pressed={fav} onClick={() => onFav(row.id)} data-testid="fav-toggle">
              <Icon name="star" size={15} /><span>{fav ? "Favoride" : "Favorile"}</span>
            </button>
          )}
        </div>

        {row && (
          <div className="qt-asset-price">
            <span key={tick ? tick.s : "s"} className={`qt-big qt-num${tick ? ` flash-${tick.d}` : ""}`} data-testid="asset-price">
              <Scramble text={priceOf(row)} />
            </span>
          </div>
        )}
        {row && (
          <div className="qt-chgs">
            <Change label={row.m === "kripto" ? "1s" : null} v={row.m === "kripto" ? row.p1h : null} />
            <Change label={row.m === "kripto" ? "24s" : "Gün"} v={row.ch} />
            <Change label="Hafta" v={row.pw} />
            <Change label="Ay" v={row.pm} />
            <Change label="Yılbaşından" v={row.py} />
            <Change label="1 yıl" v={row.p1y} />
          </div>
        )}
        {row && row.calc && <p className="qt-asset-note">Hesaplanan değer: {row.note}. Grafik TradingView'ın gram altın serisi.</p>}

        {row && (
          <div className="qt-ranges">
            <Range label={row.m === "kripto" ? "24 saatlik aralık" : "Gün içi aralık"} lo={row.lo} hi={row.hi} p={row.p} fmt={fmt} />
            <Range label="52 haftalık aralık" lo={row.l52} hi={row.h52} p={row.p} fmt={fmt} />
          </div>
        )}

        {stats.length > 0 && (
          <dl className="qt-stats" data-testid="asset-stats">
            {stats.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd className="qt-num">{v}</dd></div>))}
          </dl>
        )}
      </div>

      {quickIds.length > 0 && (
        <div className="qt-quick" role="group" aria-label={favs.length ? "Favoriler" : "Hızlı seçim"}>
          {quickIds.map((id) => {
            const r = byId.get(id);
            return (
              <button key={id} type="button" className="qt-chip" aria-pressed={row && row.id === id} onClick={() => onPick(id)} data-testid={`chip-${id}`}>
                {r.m === "fx" || r.m === "endeks" || r.m === "emtia" ? r.name.replace(" (hesaplanan)", "") : r.sym}
              </button>
            );
          })}
        </div>
      )}

      {row && !embeddable(row) ? (
        <div className="qt-chart-tv qt-tv-out" data-testid="chart-out">
          <p>Borsa İstanbul grafikleri lisans kuralı gereği başka sitelere gömülemiyor.</p>
          <a className="qt-btn" href={tvLink(row)} target="_blank" rel="noopener noreferrer">{row.sym} grafiğini TradingView'da aç</a>
        </div>
      ) : (
      <TVWidget
        className="qt-chart-tv"
        label="Grafik"
        script="embed-widget-advanced-chart.js"
        config={{
          autosize: true,
          symbol: tvFor(row),
          interval: "D",
          timezone: "Europe/Istanbul",
          theme: "dark",
          style: "1",
          locale: "tr",
          backgroundColor: "rgba(7, 10, 16, 1)",
          gridColor: "rgba(30, 41, 59, 0.5)",
          allow_symbol_change: true,
          calendar: false,
          hide_volume: false,
          support_host: "https://www.tradingview.com",
        }}
      />
      )}
      {row && isNum(row.p) && <span className="qt-sr">{`${row.name}: ${priceOf(row)}, ${fmtNum(row.ch, 2)} yüzde`}</span>}
    </section>
  );
}
