import React, { useMemo } from "react";
import { fmtPct, isNum, priceOf } from "@/lib/market";

// Squarified treemap (Bruls, Huizing, van Wijk): items sorted by value, laid out in rows with the best aspect ratios.
export function squarify(items, W, H) {
  const list = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const total = list.reduce((s, i) => s + i.value, 0);
  if (!total) return [];
  const scale = (W * H) / total;
  const nodes = list.map((item) => ({ item, area: item.value * scale }));
  const out = [];
  let rect = { x: 0, y: 0, w: W, h: H };
  const worst = (row, len) => {
    const s = row.reduce((a, r) => a + r.area, 0);
    const max = Math.max(...row.map((r) => r.area));
    const min = Math.min(...row.map((r) => r.area));
    return Math.max((len * len * max) / (s * s), (s * s) / (len * len * min));
  };
  const place = (row) => {
    const s = row.reduce((a, r) => a + r.area, 0);
    if (rect.w >= rect.h) {
      const cw = s / rect.h;
      let y = rect.y;
      for (const r of row) { const h = r.area / cw; out.push({ ...r.item, x: rect.x, y, w: cw, h }); y += h; }
      rect = { x: rect.x + cw, y: rect.y, w: rect.w - cw, h: rect.h };
    } else {
      const rh = s / rect.w;
      let x = rect.x;
      for (const r of row) { const w = r.area / rh; out.push({ ...r.item, x, y: rect.y, w, h: rh }); x += w; }
      rect = { x: rect.x, y: rect.y + rh, w: rect.w, h: rect.h - rh };
    }
  };
  let row = [];
  let i = 0;
  while (i < nodes.length) {
    const len = Math.min(rect.w, rect.h);
    if (!row.length || worst([...row, nodes[i]], len) <= worst(row, len)) { row.push(nodes[i]); i += 1; } else { place(row); row = []; }
  }
  if (row.length) place(row);
  return out;
}

const color = (ch) => {
  if (!isNum(ch)) return "hsl(215, 28%, 17%)";
  const t = Math.min(1, Math.abs(ch) / 5);
  return ch >= 0 ? `hsl(148, ${55 + t * 30}%, ${13 + t * 22}%)` : `hsl(350, ${60 + t * 30}%, ${14 + t * 24}%)`;
};

export default function Treemap({ rows, onPick, wide = true, count = 60 }) {
  const W = wide ? 1000 : 600;
  const H = wide ? 560 : 820;
  const tiles = useMemo(() => {
    const items = rows.filter((r) => isNum(r.mc) || isNum(r.vol)).map((r) => ({ r, value: isNum(r.mc) ? r.mc : r.vol }))
      .sort((a, b) => b.value - a.value).slice(0, count);
    return squarify(items, W, H);
  }, [rows, W, H, count]);
  if (!tiles.length) return <p className="qt-empty">Isı haritası için piyasa değeri verisi henüz gelmedi.</p>;
  return (
    <div className="qt-treemap" style={{ aspectRatio: `${W} / ${H}` }} data-testid="treemap">
      {tiles.map(({ r, x, y, w, h }) => {
        const big = w * h > (W * H) / 90;
        const mid = w * h > (W * H) / 400;
        return (
          <button key={r.id} type="button" className="qt-tile" onClick={() => onPick(r.id)} title={`${r.name}: ${priceOf(r)} (${fmtPct(r.ch)})`}
            aria-label={`${r.name}, ${fmtPct(r.ch)}`}
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(w / W) * 100}%`, height: `${(h / H) * 100}%`, background: color(r.ch) }}>
            {mid && <span className="qt-tile-sym" style={{ fontSize: big ? "clamp(12px, 1.6vw, 20px)" : "11px" }}>{r.sym}</span>}
            {mid && <span className="qt-tile-ch qt-num">{fmtPct(r.ch, { digits: 1 })}</span>}
          </button>
        );
      })}
    </div>
  );
}
