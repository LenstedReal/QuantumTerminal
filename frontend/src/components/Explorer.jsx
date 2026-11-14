import React, { useMemo, useState } from "react";
import { MARKETS, fmtPct, isNum, marketLabel, priceOf, tone, trLower } from "@/lib/market";
import { Icon, Mark, clockTR } from "@/components/qt/ui";

const SORTS = [
  { id: "def", label: "Sıra" },
  { id: "gain", label: "Yükselen" },
  { id: "loss", label: "Düşen" },
  { id: "az", label: "A-Z" },
];

function sortRows(list, sort) {
  const ch = (r) => (isNum(r.ch) ? r.ch : 0);
  if (sort === "gain") return [...list].sort((a, b) => ch(b) - ch(a));
  if (sort === "loss") return [...list].sort((a, b) => ch(a) - ch(b));
  if (sort === "az") return [...list].sort((a, b) => String(a.sym).localeCompare(String(b.sym), "tr"));
  return list;
}

function Row({ r, sel, fav, onPick, onFav, tick, showMarket }) {
  return (
    <div className={`qt-row${sel ? " is-selected" : ""}`} role="listitem" data-testid={`row-${r.id}`}>
      <button type="button" className={`qt-star${fav ? " is-on" : ""}`} aria-pressed={fav} aria-label={fav ? `${r.sym} favorilerden çıkar` : `${r.sym} favorilere ekle`}
        onClick={() => onFav(r.id)} data-testid={`fav-${r.id}`}>
        <Icon name="star" size={15} />
      </button>
      <button type="button" className="qt-row-main" aria-current={sel ? "true" : undefined} onClick={() => onPick(r.id)}>
        <Mark row={r} size={26} />
        <span className="qt-row-name">
          <span className="qt-row-sym">{r.sym}{showMarket && <span className="qt-badge">{marketLabel(r.m)}</span>}</span>
          <span className="qt-row-full">{r.name}</span>
        </span>
        <span className="qt-row-nums">
          <span key={tick ? tick.s : "s"} className={`qt-row-price qt-num${tick ? ` flash-${tick.d}` : ""}`}>{priceOf(r)}</span>
          <span className={`qt-row-ch qt-num ${tone(r.ch)}`}>{fmtPct(r.ch)}</span>
        </span>
      </button>
    </div>
  );
}

export default function Explorer({ markets, active, onMarket, favs, onFav, selectedId, onPick, ticks, onRetry }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("def");
  const all = useMemo(() => MARKETS.flatMap((m) => (markets[m.id] && markets[m.id].rows) || []), [markets]);
  const byId = useMemo(() => new Map(all.map((r) => [r.id, r])), [all]);
  const term = trLower(q).trim();
  const cur = active === "fav" ? null : markets[active];

  const rows = useMemo(() => {
    if (term) {
      const hit = all.filter((r) => trLower(r.sym).includes(term) || trLower(r.name).includes(term));
      const starts = hit.filter((r) => trLower(r.sym).startsWith(term));
      return sortRows([...starts, ...hit.filter((r) => !starts.includes(r))], sort).slice(0, 100);
    }
    const list = active === "fav" ? favs.map((id) => byId.get(id)).filter(Boolean) : (cur && cur.rows) || [];
    return sortRows(list, sort);
  }, [term, all, active, favs, byId, cur, sort]);

  const total = all.length;
  const loading = !term && active !== "fav" && (!cur || ((cur.status === "loading" || !cur.status) && !(cur.rows && cur.rows.length)));
  const failed = !term && active !== "fav" && cur && cur.status === "error" && !(cur.rows && cur.rows.length);
  const tabs = [{ id: "fav", label: "Favori", count: favs.length }, ...MARKETS.map((m) => ({ id: m.id, label: m.short || m.label, count: ((markets[m.id] && markets[m.id].rows) || []).length }))];

  return (
    <section className="qt-panel qt-market" aria-labelledby="mk-title" data-testid="explorer">
      <div className="qt-panel-head">
        <h2 id="mk-title"><span className="qt-mod" aria-hidden="true">01</span>Piyasa</h2>
        <span className="qt-muted" data-testid="symbol-count">{total} sembol</span>
      </div>
      <div className="qt-market-tools">
        <label className="qt-search">
          <Icon name="search" />
          <span className="qt-sr">Sembol ara</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${total || "Tüm"} sembolde ara: THYAO, AAPL, BTC, altın…`} data-testid="market-search" />
          {q && <button type="button" className="qt-search-x" onClick={() => setQ("")} aria-label="Aramayı temizle"><Icon name="close" size={14} /></button>}
        </label>
        <div className="qt-mtabs" role="tablist" aria-label="Piyasalar">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={!term && active === t.id} onClick={() => { setQ(""); onMarket(t.id); }} data-testid={`mtab-${t.id}`}>
              {t.id === "fav" && <Icon name="star" size={13} />}<span>{t.label}</span><span className="qt-mtab-n">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="qt-seg" role="group" aria-label="Sıralama">
          {SORTS.map((s) => (
            <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)} data-testid={`sort-${s.id}`}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="qt-market-list" role="list" aria-label={term ? "Arama sonuçları" : `${marketLabel(active)} listesi`}>
        {loading && Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="qt-row is-skeleton" role="listitem" aria-hidden="true"><span /><span /><span /></div>
        ))}
        {failed && (
          <div className="qt-empty">
            <p>{marketLabel(active)} verisi şu an alınamadı. Veri sunucusu yanıt vermedi.</p>
            <button type="button" className="qt-btn qt-btn-sm" onClick={() => onRetry(active)}>Tekrar dene</button>
          </div>
        )}
        {!loading && !failed && rows.length === 0 && (
          <p className="qt-empty">
            {term ? `“${q}” ile eşleşen sembol yok.` : active === "fav" ? "Henüz favori yok. Listede bir sembolün yanındaki ★ işaretine dokun." : "Bu piyasada gösterilecek sembol yok."}
          </p>
        )}
        {rows.map((r) => (
          <Row key={r.id} r={r} sel={r.id === selectedId} fav={favs.includes(r.id)} onPick={onPick} onFav={onFav} tick={ticks[r.id]} showMarket={Boolean(term) || active === "fav"} />
        ))}
      </div>

      <p className="qt-src" data-testid="market-source">
        {term ? `${rows.length} sonuç · ${total} sembol içinde`
          : active === "fav" ? "Favoriler bu cihazda saklanır."
            : cur && cur.at ? `${cur.src || "Kaynak"} · ${clockTR(new Date(cur.at))}${cur.status === "stale" ? " · gecikmeli" : ""}` : "Bağlanıyor…"}
      </p>
    </section>
  );
}
