import React from "react";
import { breadth, fmtCompact, fmtPct, isNum, marketLabel, tone } from "@/lib/market";

export default function Pulse({ market, rows, global, onPick }) {
  const b = breadth(rows);
  const g = market === "kripto" && global ? global : null;
  const capCh = g ? g.market_cap_change_percentage_24h_usd : null;
  const top = b.gainers[0];
  const low = b.losers[0];
  const w = b.total ? { up: (b.up / b.total) * 100, flat: (b.flat / b.total) * 100 } : null;
  return (
    <section className="qt-panel qt-pulse" aria-label={`${marketLabel(market)} piyasa nabzı`} data-testid="pulse">
      <dl className="qt-pulse-grid">
        <div className="qt-pulse-item qt-pulse-breadth">
          <dt>{marketLabel(market)}: yükselen / düşen</dt>
          <dd><span className="qt-num up">{b.up}</span><span className="qt-num qt-dim"> / </span><span className="qt-num down">{b.down}</span>{b.flat > 0 && <span className="qt-num qt-dim"> · {b.flat} sabit</span>}</dd>
          {w && <span className="qt-breadth" aria-hidden="true"><span className="is-up" style={{ width: `${w.up}%` }} /><span className="is-flat" style={{ width: `${w.flat}%` }} /></span>}
        </div>
        <div className="qt-pulse-item">
          <dt>Ortalama değişim</dt>
          <dd className={`qt-num ${tone(b.avg)}`}>{fmtPct(b.avg)}</dd>
        </div>
        <div className="qt-pulse-item">
          <dt>En çok yükselen</dt>
          <dd>{top ? <button type="button" className="qt-link" onClick={() => onPick(top.id)}>{top.sym} <span className="qt-num up">{fmtPct(top.ch)}</span></button> : "—"}</dd>
        </div>
        <div className="qt-pulse-item">
          <dt>En çok düşen</dt>
          <dd>{low ? <button type="button" className="qt-link" onClick={() => onPick(low.id)}>{low.sym} <span className={`qt-num ${tone(low.ch)}`}>{fmtPct(low.ch)}</span></button> : "—"}</dd>
        </div>
        {g && (
          <>
            <div className="qt-pulse-item">
              <dt>Toplam kripto değeri</dt>
              <dd><span className="qt-num">{fmtCompact(g.total_market_cap && g.total_market_cap.usd)}</span> {isNum(capCh) && <span className={`qt-num qt-small ${tone(capCh)}`}>{fmtPct(capCh)}</span>}</dd>
            </div>
            <div className="qt-pulse-item">
              <dt>Bitcoin payı</dt>
              <dd className="qt-num">{fmtPct(g.market_cap_percentage && g.market_cap_percentage.btc, { sign: false, digits: 1 })}</dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}
