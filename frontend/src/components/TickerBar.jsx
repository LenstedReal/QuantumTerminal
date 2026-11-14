import React from "react";
import { fmtPrice, fmtPct, tone } from "@/lib/market";

export default function TickerBar({ coins, ticks, stamp, onPick, loading }) {
  if (!coins || coins.length === 0) return loading ? <div className="qt-ticker is-empty" aria-hidden="true" /> : null;
  const items = coins.slice(0, 16);
  const loop = [...items, ...items];
  return (
    <div className="qt-ticker" data-testid="ticker-bar" aria-label="Fiyat şeridi">
      <div className="qt-ticker-track">
        {loop.map((c, i) => {
          const ch = c.price_change_percentage_24h;
          const tick = ticks[c.id];
          return (
            <button type="button" key={`${c.id}-${i}`} className="qt-tick" onClick={() => onPick(c.id)} tabIndex={i < items.length ? 0 : -1}
              aria-hidden={i >= items.length ? "true" : undefined}>
              <span className="qt-tick-sym">{String(c.symbol || "").toUpperCase()}</span>
              <span key={tick ? stamp : "s"} className={`qt-tick-price${tick ? ` flash-${tick}` : ""}`}>{fmtPrice(c.current_price)}</span>
              <span className={`qt-tick-ch ${tone(ch)}`}>{fmtPct(ch)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
