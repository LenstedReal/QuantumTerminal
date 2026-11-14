import React, { useState } from "react";
import TVWidget from "@/components/qt/TVWidget";
import Treemap from "@/components/Treemap";
import { Mark } from "@/components/qt/ui";
import { breadth, fmtPct, marketLabel, priceOf, tone } from "@/lib/market";

const TURKEY = ["FX_IDC:USDTRY", "FX_IDC:EURTRY", "FX_IDC:GBPTRY", "CALC:GRAMALTIN", "BIST:XU100", "BIST:XU030", "BIST:XBANK", "TVC:TR10Y"];

function Panel({ num, title, sub, children, className = "", testid }) {
  return (
    <section className={`qt-panel qt-vpanel ${className}`} data-testid={testid}>
      <div className="qt-panel-head">
        <h2><span className="qt-mod" aria-hidden="true">{num}</span>{title}</h2>
        {sub && <span className="qt-muted">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

function Board({ rows, onPick, empty = "Veri bekleniyor." }) {
  if (!rows.length) return <p className="qt-empty">{empty}</p>;
  return (
    <table className="qt-board">
      <thead>
        <tr><th scope="col">Sembol</th><th scope="col">Son</th><th scope="col">Değişim</th><th scope="col" className="qt-hide-s">Gün aralığı</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} onClick={() => onPick(r.id)} data-testid={`board-${r.id}`}>
            <th scope="row">
              <button type="button" className="qt-board-name" onClick={(e) => { e.stopPropagation(); onPick(r.id); }}>
                <Mark row={r} size={20} /><span>{r.m === "fx" || r.m === "endeks" || r.m === "emtia" ? r.name : r.sym}</span>
              </button>
            </th>
            <td className="qt-num">{priceOf(r)}</td>
            <td className={`qt-num ${tone(r.ch)}`}>{fmtPct(r.ch)}</td>
            <td className="qt-num qt-dim qt-hide-s">{r.lo != null && r.hi != null ? `${priceOf({ ...r, p: r.lo })} – ${priceOf({ ...r, p: r.hi })}` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Movers({ market, rows, onPick }) {
  const b = breadth(rows);
  const list = (items) => (
    <ol className="qt-movers-list">
      {items.map((r) => (
        <li key={r.id}>
          <button type="button" onClick={() => onPick(r.id)}>
            <span className="qt-movers-sym">{r.sym}</span><span className="qt-movers-name">{r.name}</span>
            <span className={`qt-num ${tone(r.ch)}`}>{fmtPct(r.ch)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
  return (
    <div className="qt-movers" data-testid={`movers-${market}`}>
      <div className="qt-movers-head">
        <span className="qt-movers-title">{marketLabel(market)}</span>
        <span className="qt-num qt-dim">{b.up} yükselen · {b.down} düşen · ort. <span className={tone(b.avg)}>{fmtPct(b.avg)}</span></span>
      </div>
      {b.total ? (
        <div className="qt-movers-cols">
          <div><span className="qt-movers-k up">En çok yükselen</span>{list(b.gainers)}</div>
          <div><span className="qt-movers-k down">En çok düşen</span>{list(b.losers)}</div>
        </div>
      ) : <p className="qt-empty">Veri bekleniyor.</p>}
    </div>
  );
}

export function MarketsView({ markets, byId, onPick }) {
  const rowsOf = (m) => (markets[m] && markets[m].rows) || [];
  const turkey = TURKEY.map((id) => byId.get(id)).filter(Boolean);
  return (
    <div className="qt-view qt-view-markets" data-testid="view-markets">
      <Panel num="04" title="Türkiye" sub="Dolar, euro, gram altın, BIST, faiz" testid="board-turkey">
        <Board rows={turkey} onPick={onPick} />
      </Panel>
      <Panel num="05" title="Endeksler" sub={`${rowsOf("endeks").length} endeks ve faiz`} testid="board-indices">
        <Board rows={rowsOf("endeks")} onPick={onPick} />
      </Panel>
      <Panel num="06" title="Emtia" sub={`${rowsOf("emtia").length} emtia`} testid="board-commodities">
        <Board rows={rowsOf("emtia")} onPick={onPick} />
      </Panel>
      <Panel num="07" title="Döviz" sub={`${rowsOf("fx").length} parite`} testid="board-fx">
        <Board rows={rowsOf("fx")} onPick={onPick} />
      </Panel>
      <Panel num="08" title="Günün hareketlileri" sub="BIST, ABD hisseleri ve kripto" className="qt-span-2" testid="board-movers">
        <div className="qt-movers-grid">
          {["bist", "us", "kripto"].map((m) => <Movers key={m} market={m} rows={rowsOf(m)} onPick={onPick} />)}
        </div>
      </Panel>
    </div>
  );
}

const HEAT = [
  { id: "bist", label: "BIST" },
  { id: "us", label: "ABD hisseleri" },
  { id: "kripto", label: "Kripto" },
];

export function HeatmapView({ markets, onPick }) {
  const [m, setM] = useState("bist");
  const wide = typeof window === "undefined" || window.innerWidth > 700;
  const rows = (markets[m] && markets[m].rows) || [];
  return (
    <div className="qt-view qt-view-heat" data-testid="view-heatmap">
      <Panel num="09" title="Isı haritası" sub="Kutu büyüklüğü: piyasa değeri · renk: günlük değişim" className="qt-span-2" testid="heat-own">
        <div className="qt-seg qt-seg-inline" role="group" aria-label="Piyasa">
          {HEAT.map((h) => (
            <button key={h.id} type="button" aria-pressed={m === h.id} onClick={() => setM(h.id)} data-testid={`heat-${h.id}`}>{h.label}</button>
          ))}
        </div>
        <div className="qt-heat-wrap">
          <Treemap rows={rows} onPick={onPick} wide={wide} count={m === "kripto" ? 80 : 70} />
        </div>
      </Panel>
      <Panel num="10" title="TradingView kripto ısı haritası" sub="Tüm kripto piyasası" testid="heat-crypto">
        <TVWidget className="qt-vtv" label="Kripto ısı haritası" script="embed-widget-crypto-coins-heatmap.js"
          config={{ dataSource: "Crypto", blockSize: "market_cap_calc", blockColor: "change", locale: "tr", symbolUrl: "", colorTheme: "dark", hasTopBar: true, isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false, width: "100%", height: "100%" }} />
      </Panel>
      <Panel num="11" title="TradingView S&P 500 ısı haritası" sub="Sektörlere göre" testid="heat-stocks">
        <TVWidget className="qt-vtv" label="Hisse ısı haritası" script="embed-widget-stock-heatmap.js"
          config={{ exchanges: [], dataSource: "SPX500", grouping: "sector", blockSize: "market_cap_basic", blockColor: "change", locale: "tr", symbolUrl: "", colorTheme: "dark", hasTopBar: true, isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false, width: "100%", height: "100%" }} />
      </Panel>
    </div>
  );
}

export function NewsView() {
  return (
    <div className="qt-view qt-view-news" data-testid="view-news">
      <Panel num="12" title="Ekonomik takvim" sub="Türkiye, ABD, Euro bölgesi, İngiltere, Japonya, Çin" testid="news-calendar">
        <TVWidget className="qt-vtv qt-vtv-tall" label="Ekonomik takvim" script="embed-widget-events.js"
          config={{ colorTheme: "dark", isTransparent: true, width: "100%", height: "100%", locale: "tr", importanceFilter: "0,1", countryFilter: "tr,us,eu,gb,jp,cn" }} />
      </Panel>
      <Panel num="13" title="Piyasa haberleri" sub="TradingView haber akışı" testid="news-feed">
        <TVWidget className="qt-vtv qt-vtv-tall" label="Haberler" script="embed-widget-timeline.js"
          config={{ feedMode: "all_symbols", isTransparent: true, displayMode: "regular", width: "100%", height: "100%", colorTheme: "dark", locale: "tr" }} />
      </Panel>
    </div>
  );
}
