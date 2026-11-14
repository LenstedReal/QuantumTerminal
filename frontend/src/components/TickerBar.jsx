import React from "react";
import { fmtPct, priceOf, tone } from "@/lib/market";

const PICKS = ["BIST:XU100", "FX_IDC:USDTRY", "FX_IDC:EURTRY", "CALC:GRAMALTIN", "TVC:GOLD", "TVC:SILVER", "TVC:UKOIL", "CG:bitcoin", "CG:ethereum",
  "SP:SPX", "NASDAQ:NDX", "TVC:DEU40", "TVC:DXY", "BIST:THYAO", "NASDAQ:NVDA", "NASDAQ:AAPL", "CG:solana", "CG:ripple", "TVC:US10Y", "TVC:TR10Y"];
const short = (r) => (r.m === "fx" || r.m === "endeks" || r.m === "emtia" ? r.name.replace(" (hesaplanan)", "").replace(" endeksi (DXY)", " (DXY)") : r.sym);

export default function TickerBar({ byId, ticks, onPick, loading }) {
  let items = PICKS.map((id) => byId.get(id)).filter(Boolean);
  if (items.length < 8) {
    const extra = [...byId.values()].filter((r) => r.m === "kripto" && !items.includes(r)).slice(0, 16 - items.length);
    items = [...items, ...extra];
  }
  if (!items.length) return loading ? <div className="qt-ticker is-empty" aria-hidden="true" /> : null;
  const loop = [...items, ...items];
  return (
    <div className="qt-ticker" data-testid="ticker-bar" aria-label="Fiyat şeridi">
      <div className="qt-ticker-track" style={{ animationDuration: `${Math.max(40, items.length * 5)}s` }}>
        {loop.map((r, i) => {
          const tick = ticks[r.id];
          return (
            <button type="button" key={`${r.id}-${i}`} className="qt-tick" onClick={() => onPick(r.id)} tabIndex={i < items.length ? 0 : -1}
              aria-hidden={i >= items.length ? "true" : undefined}>
              <span className="qt-tick-sym">{short(r)}</span>
              <span key={tick ? tick.s : "s"} className={`qt-tick-price${tick ? ` flash-${tick.d}` : ""}`}>{priceOf(r)}</span>
              <span className={`qt-tick-ch ${tone(r.ch)}`}>{fmtPct(r.ch)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
