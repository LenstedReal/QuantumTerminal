import React, { useState } from "react";
import { tvSymbolFor } from "@/lib/market";
import TVWidget from "@/components/qt/TVWidget";

const MARKETS = [
  { id: "crypto", label: "Kripto" },
  { id: "america", label: "ABD hisseleri" },
];

export default function RightPanel({ asset, tab, onTab }) {
  const [market, setMarket] = useState("crypto");
  const symbol = asset ? (asset.kind === "stock" ? asset.tv : tvSymbolFor(asset)) : "BINANCE:BTCUSDT";

  const screener = market === "crypto"
    ? { width: "100%", height: "100%", defaultColumn: "overview", screener_type: "crypto_mkt", displayCurrency: "USD", colorTheme: "dark", locale: "tr", isTransparent: true }
    : { width: "100%", height: "100%", defaultColumn: "overview", defaultScreen: "most_capitalized", market: "america", showToolbar: false, colorTheme: "dark", locale: "tr", isTransparent: true };

  return (
    <section className="qt-panel qt-widgets" aria-label="TradingView araçları" data-testid="right-panel">
      <div className="qt-tabs" role="tablist" aria-label="Görünüm">
        <button type="button" role="tab" aria-selected={tab === "tech"} onClick={() => onTab("tech")} data-testid="tab-tech">Teknik özet</button>
        <button type="button" role="tab" aria-selected={tab === "screener"} onClick={() => onTab("screener")} data-testid="tab-screener">Tarayıcı</button>
      </div>

      {tab === "tech" && (
        <div className="qt-widget-body" role="tabpanel">
          <TVWidget
            label="Teknik özet"
            script="embed-widget-technical-analysis.js"
            config={{ interval: "1h", width: "100%", height: "100%", isTransparent: true, symbol, showIntervalTabs: true, locale: "tr", colorTheme: "dark" }}
          />
        </div>
      )}

      {tab === "screener" && (
        <div className="qt-widget-body" role="tabpanel">
          <div className="qt-seg qt-seg-inline" role="group" aria-label="Piyasa">
            {MARKETS.map((m) => (
              <button key={m.id} type="button" aria-pressed={market === m.id} onClick={() => setMarket(m.id)} data-testid={`screener-${m.id}`}>{m.label}</button>
            ))}
          </div>
          <TVWidget label="Tarayıcı" script="embed-widget-screener.js" config={screener} />
        </div>
      )}
    </section>
  );
}
