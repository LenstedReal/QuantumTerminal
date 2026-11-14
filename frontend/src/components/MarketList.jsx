import React, { useMemo, useState } from "react";
import { closesOf, fmtPct, fmtPrice, tone, trLower } from "@/lib/market";
import { CoinMark, Icon, Sparkline } from "@/components/qt/ui";

const SORTS = [
  { id: "cap", label: "Değer" },
  { id: "gain", label: "Yükselenler" },
  { id: "loss", label: "Düşenler" },
];

export default function MarketList({ coins, ticks, stamp, selectedId, onPick, status }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("cap");

  const rows = useMemo(() => {
    const term = trLower(q).trim();
    let list = (coins || []).filter((c) => !term || trLower(c.name).includes(term) || trLower(c.symbol).includes(term));
    const ch = (c) => (typeof c.price_change_percentage_24h === "number" ? c.price_change_percentage_24h : 0);
    if (sort === "gain") list = [...list].sort((a, b) => ch(b) - ch(a));
    else if (sort === "loss") list = [...list].sort((a, b) => ch(a) - ch(b));
    else list = [...list].sort((a, b) => (a.market_cap_rank || 999) - (b.market_cap_rank || 999));
    return list;
  }, [coins, q, sort]);

  const loading = status === "loading" && (!coins || coins.length === 0);

  return (
    <section className="qt-panel qt-market" aria-labelledby="mk-title" data-testid="market-list">
      <div className="qt-panel-head">
        <h2 id="mk-title"><span className="qt-mod" aria-hidden="true">01</span>Piyasa</h2>
        <span className="qt-muted">İlk 20 kripto</span>
      </div>
      <div className="qt-market-tools">
        <label className="qt-search">
          <Icon name="search" />
          <span className="qt-sr">Kripto ara</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara: bitcoin, sol…" data-testid="market-search" />
        </label>
        <div className="qt-seg" role="group" aria-label="Sıralama">
          {SORTS.map((s) => (
            <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)} data-testid={`sort-${s.id}`}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="qt-market-list" role="list">
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="qt-row is-skeleton" role="listitem" aria-hidden="true"><span /><span /><span /></div>
        ))}
        {!loading && rows.length === 0 && (
          <p className="qt-empty">
            {coins && coins.length ? `“${q}” ile eşleşen kripto yok. Aramayı temizle ya da başka bir ad dene.` : "Piyasa verisi henüz gelmedi. Bağlantı gelince liste kendiliğinden dolacak."}
          </p>
        )}
        {rows.map((c) => {
          const ch = c.price_change_percentage_24h;
          const t = tone(ch);
          const tick = ticks[c.id];
          const sel = c.id === selectedId;
          return (
            <button key={c.id} type="button" role="listitem" className={`qt-row${sel ? " is-selected" : ""}`} aria-current={sel ? "true" : undefined}
              onClick={() => onPick(c.id)} data-testid={`coin-${c.id}`}>
              <span className="qt-row-rank">{c.market_cap_rank || ""}</span>
              <CoinMark coin={c} size={26} />
              <span className="qt-row-name">
                <span className="qt-row-sym">{String(c.symbol || "").toUpperCase()}</span>
                <span className="qt-row-full">{c.name}</span>
              </span>
              <Sparkline values={closesOf(c)} tone={t} w={56} h={24} points={32} className="qt-row-spark" />
              <span className="qt-row-nums">
                <span key={tick ? stamp : "s"} className={`qt-row-price qt-num${tick ? ` flash-${tick}` : ""}`}>{fmtPrice(c.current_price)}</span>
                <span className={`qt-row-ch ${t}`}>{fmtPct(ch)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
