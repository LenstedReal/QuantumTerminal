import React, { useEffect, useRef, useState } from "react";

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
  grid: <><rect x="3.5" y="3.5" width="7" height="9" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.5" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /><rect x="3.5" y="15.5" width="7" height="5" rx="1.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
};
export function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{PATHS[name]}</svg>
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

/* Instrument logo with a lettered fallback when there is no image or it cannot load. */
export function Mark({ row, size = 26 }) {
  const [broken, setBroken] = useState(false);
  const letter = String((row && (row.sym || row.name)) || "?").replace(/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/g, "").charAt(0).toUpperCase() || "?";
  if (row && row.logo && row.logo2 && !broken) {
    return (
      <span className="qt-pair" style={{ width: size, height: size }} aria-hidden="true">
        <img src={row.logo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
        <img src={row.logo2} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      </span>
    );
  }
  if (!row || !row.logo || broken) {
    return <span className={`qt-coinmark is-letter is-${row ? row.m : "x"}`} style={{ width: size, height: size }} aria-hidden="true">{letter}</span>;
  }
  return (
    <img className="qt-coinmark" src={row.logo} alt="" width={size} height={size} loading="lazy" decoding="async"
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
