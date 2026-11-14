import React, { useEffect, useRef, useState } from "react";

/*
 * TradingView embed: one container per (script, config). The old widget is removed before a new one is added,
 * so symbol changes never stack iframes. Shows a loading state until the iframe appears and a clear message
 * with a retry when the script is blocked (ad blockers, no network).
 */
export default function TVWidget({ script, config, label, className = "" }) {
  const host = useRef(null);
  const [state, setState] = useState("loading"); // loading | ready | failed
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(config);

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    el.innerHTML = "";
    setState("loading");

    const wrap = document.createElement("div");
    wrap.className = "tradingview-widget-container";
    wrap.style.height = "100%";
    wrap.style.width = "100%";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    inner.style.width = "100%";
    const s = document.createElement("script");
    s.src = `https://s3.tradingview.com/external-embedding/${script}`;
    s.type = "text/javascript";
    s.async = true;
    s.innerHTML = key;
    let done = false;
    s.onerror = () => { if (!done) { done = true; setState("failed"); } };
    wrap.appendChild(inner);
    wrap.appendChild(s);
    el.appendChild(wrap);

    const obs = new MutationObserver(() => {
      if (!done && el.querySelector("iframe")) { done = true; setState("ready"); obs.disconnect(); }
    });
    obs.observe(el, { childList: true, subtree: true });
    const timer = setTimeout(() => { if (!done) { done = true; setState("failed"); obs.disconnect(); } }, 15000);

    return () => { obs.disconnect(); clearTimeout(timer); el.innerHTML = ""; };
  }, [script, key, attempt]);

  return (
    <div className={`qt-tv ${className}`} data-state={state}>
      <div ref={host} className="qt-tv-host" />
      {state !== "ready" && (
        <div className="qt-tv-veil" role="status">
          {state === "loading" ? (
            <><span className="qt-spinner" aria-hidden="true" />{label} yükleniyor</>
          ) : (
            <>
              <span>{label} yüklenemedi. Reklam engelleyici TradingView'ı engelliyor olabilir.</span>
              <button type="button" className="qt-btn qt-btn-sm" onClick={() => setAttempt((a) => a + 1)}>Tekrar dene</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
