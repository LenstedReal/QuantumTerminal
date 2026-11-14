import React, { useEffect, useRef, useState } from "react";
import { sparkPath, thin } from "@/lib/market";

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Quantum mark: a nucleus with two tilted orbits. */
export function Logo({ size = 30 }) {
  return (
    <svg className="qt-logo" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="qtg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3ee6f5" />
          <stop offset="1" stopColor="#f6c453" />
        </linearGradient>
      </defs>
      <ellipse cx="20" cy="20" rx="17" ry="7" fill="none" stroke="url(#qtg)" strokeWidth="1.6" transform="rotate(-28 20 20)" />
      <ellipse cx="20" cy="20" rx="17" ry="7" fill="none" stroke="url(#qtg)" strokeWidth="1.6" opacity=".55" transform="rotate(32 20 20)" />
      <circle cx="20" cy="20" r="4.2" fill="url(#qtg)" />
      <circle className="qt-logo-e" cx="35" cy="14" r="1.8" fill="#3ee6f5" />
    </svg>
  );
}

const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4" /></>,
  chart: <><path d="M4 19V5M4 19h16" /><path d="m7 14 4-4 3 3 5-6" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};
export function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[name]}</svg>
  );
}

/* Small 7-day line. */
export function Sparkline({ values, tone = "flat", w = 92, h = 28, points = 48, className = "" }) {
  const d = sparkPath(thin(values, points), w, h);
  if (!d) return <span className={`qt-spark ${className}`} style={{ width: w, height: h }} aria-hidden="true" />;
  return (
    <svg className={`qt-spark ${className}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} className={`qt-spark-line ${tone}`} pathLength="1" />
    </svg>
  );
}

/* Number that "decodes" into its new value when it changes. */
export function Scramble({ text, className = "" }) {
  const [shown, setShown] = useState(text);
  const first = useRef(true);
  useEffect(() => {
    if (first.current || reduceMotion()) { first.current = false; setShown(text); return undefined; }
    let raf = 0;
    const start = performance.now(), dur = 520, target = String(text);
    const frame = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const keep = Math.floor(target.length * p);
      let out = "";
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        out += i < keep || !/\d/.test(ch) ? ch : String((Math.random() * 10) | 0);
      }
      setShown(out);
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return <span className={className}>{shown}</span>;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const clockTR = (d) =>
  d ? d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Istanbul" }) : "—";

/* Coin logo with a lettered fallback when the image cannot load. */
export function CoinMark({ coin, size = 26 }) {
  const [broken, setBroken] = useState(false);
  const letter = String((coin && (coin.symbol || coin.name)) || "?").charAt(0).toUpperCase();
  if (!coin || !coin.image || broken) {
    return <span className="qt-coinmark is-letter" style={{ width: size, height: size }} aria-hidden="true">{letter}</span>;
  }
  return (
    <img className="qt-coinmark" src={coin.image} alt="" width={size} height={size} loading="lazy" decoding="async"
      referrerPolicy="no-referrer" onError={() => setBroken(true)} />
  );
}

export function safeStore(key, value) {
  try {
    if (value === undefined) return window.localStorage.getItem(key);
    window.localStorage.setItem(key, value);
  } catch (e) { /* private mode */ }
  return null;
}
