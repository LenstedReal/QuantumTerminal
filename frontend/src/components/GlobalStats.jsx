import React from "react";
import { fmtCompact, fmtPct, isNum, tone } from "@/lib/market";

export default function GlobalStats({ global }) {
  const g = global || {};
  const cap = g.total_market_cap && g.total_market_cap.usd;
  const vol = g.total_volume && g.total_volume.usd;
  const capCh = g.market_cap_change_percentage_24h_usd;
  const dom = g.market_cap_percentage || {};
  const items = [
    { k: "Toplam piyasa değeri", v: fmtCompact(cap), sub: isNum(capCh) ? fmtPct(capCh) : null, t: tone(capCh) },
    { k: "24 saatlik hacim", v: fmtCompact(vol) },
    { k: "Bitcoin payı", v: isNum(dom.btc) ? fmtPct(dom.btc, { sign: false, digits: 1 }) : "—" },
    { k: "Ethereum payı", v: isNum(dom.eth) ? fmtPct(dom.eth, { sign: false, digits: 1 }) : "—" },
  ];
  return (
    <dl className="qt-global" data-testid="global-stats">
      {items.map((it) => (
        <div className="qt-global-item" key={it.k}>
          <dt>{it.k}</dt>
          <dd>
            <span className="qt-num">{it.v}</span>
            {it.sub && <span className={`qt-global-sub ${it.t}`}>{it.sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
