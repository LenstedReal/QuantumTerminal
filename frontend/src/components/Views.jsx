import React from "react";
import TVWidget from "@/components/qt/TVWidget";

const sym = (s, d) => ({ s, d });

const OVERVIEW = {
  colorTheme: "dark",
  dateRange: "1D",
  showChart: true,
  locale: "tr",
  width: "100%",
  height: "100%",
  largeChartUrl: "",
  isTransparent: true,
  showSymbolLogo: true,
  showFloatingTooltip: true,
  plotLineColorGrowing: "rgba(61, 220, 151, 1)",
  plotLineColorFalling: "rgba(255, 107, 129, 1)",
  gridLineColor: "rgba(120, 160, 200, 0.06)",
  scaleFontColor: "rgba(169, 184, 202, 1)",
  belowLineFillColorGrowing: "rgba(61, 220, 151, 0.12)",
  belowLineFillColorFalling: "rgba(255, 107, 129, 0.12)",
  belowLineFillColorGrowingBottom: "rgba(61, 220, 151, 0)",
  belowLineFillColorFallingBottom: "rgba(255, 107, 129, 0)",
  symbolActiveColor: "rgba(62, 230, 245, 0.12)",
  tabs: [
    { title: "Türkiye", symbols: [sym("BIST:XU100", "BIST 100"), sym("BIST:XU030", "BIST 30"), sym("FX:USDTRY", "Dolar / TL"), sym("FX:EURTRY", "Euro / TL"), sym("FX_IDC:XAUTRYG", "Gram altın")] },
    { title: "Endeksler", symbols: [sym("FOREXCOM:SPXUSD", "S&P 500"), sym("FOREXCOM:NSXUSD", "Nasdaq 100"), sym("FOREXCOM:DJI", "Dow Jones"), sym("INDEX:DEU40", "DAX"), sym("INDEX:NKY", "Nikkei 225")] },
    { title: "Emtia", symbols: [sym("OANDA:XAUUSD", "Altın (ons)"), sym("OANDA:XAGUSD", "Gümüş (ons)"), sym("TVC:UKOIL", "Brent petrol"), sym("TVC:USOIL", "WTI petrol"), sym("OANDA:XPTUSD", "Platin")] },
    { title: "Döviz", symbols: [sym("FX:USDTRY", "USD / TRY"), sym("FX:EURTRY", "EUR / TRY"), sym("FX:EURUSD", "EUR / USD"), sym("FX:GBPUSD", "GBP / USD"), sym("FX:USDJPY", "USD / JPY")] },
    { title: "Kripto", symbols: [sym("BINANCE:BTCUSDT", "Bitcoin"), sym("BINANCE:ETHUSDT", "Ethereum"), sym("BINANCE:SOLUSDT", "Solana"), sym("BINANCE:XRPUSDT", "XRP"), sym("BINANCE:BNBUSDT", "BNB")] },
  ],
};

const TAPE = {
  symbols: [
    { proName: "BIST:XU100", title: "BIST 100" }, { proName: "FX:USDTRY", title: "Dolar/TL" }, { proName: "FX:EURTRY", title: "Euro/TL" },
    { proName: "FX_IDC:XAUTRYG", title: "Gram altın" }, { proName: "OANDA:XAUUSD", title: "Altın ons" }, { proName: "TVC:UKOIL", title: "Brent" },
    { proName: "FOREXCOM:SPXUSD", title: "S&P 500" }, { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" }, { proName: "BINANCE:BTCUSDT", title: "Bitcoin" },
  ],
  showSymbolLogo: true,
  isTransparent: true,
  displayMode: "adaptive",
  colorTheme: "dark",
  locale: "tr",
};

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

export function MarketsView() {
  return (
    <div className="qt-view qt-view-markets" data-testid="view-markets">
      <div className="qt-panel qt-tape" data-testid="markets-tape">
        <TVWidget className="qt-tape-tv" label="Piyasa şeridi" script="embed-widget-ticker-tape.js" config={TAPE} />
      </div>
      <Panel num="04" title="Küresel piyasalar" sub="Türkiye, endeksler, emtia, döviz, kripto" className="qt-span-2" testid="markets-overview">
        <TVWidget className="qt-vtv qt-vtv-tall" label="Piyasa özeti" script="embed-widget-market-overview.js" config={OVERVIEW} />
      </Panel>
      <Panel num="05" title="Çapraz kurlar" sub="Başlıca para birimleri" testid="markets-fx">
        <TVWidget className="qt-vtv" label="Çapraz kurlar" script="embed-widget-forex-cross-rates.js"
          config={{ width: "100%", height: "100%", currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "TRY"], isTransparent: true, colorTheme: "dark", locale: "tr" }} />
      </Panel>
      <Panel num="06" title="BIST tarayıcı" sub="Borsa İstanbul" testid="markets-bist">
        <TVWidget className="qt-vtv" label="BIST tarayıcı" script="embed-widget-screener.js"
          config={{ width: "100%", height: "100%", defaultColumn: "overview", defaultScreen: "most_capitalized", market: "turkey", showToolbar: true, colorTheme: "dark", locale: "tr", isTransparent: true }} />
      </Panel>
    </div>
  );
}

export function HeatmapView() {
  return (
    <div className="qt-view qt-view-heat" data-testid="view-heatmap">
      <Panel num="07" title="Kripto ısı haritası" sub="Kutu büyüklüğü: piyasa değeri · renk: 24 saatlik değişim" className="qt-span-2" testid="heat-crypto">
        <TVWidget className="qt-vtv qt-vtv-tall" label="Kripto ısı haritası" script="embed-widget-crypto-coins-heatmap.js"
          config={{ dataSource: "Crypto", blockSize: "market_cap_calc", blockColor: "change", locale: "tr", symbolUrl: "", colorTheme: "dark", hasTopBar: true, isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false, width: "100%", height: "100%" }} />
      </Panel>
      <Panel num="08" title="ABD hisse ısı haritası" sub="S&P 500" className="qt-span-2" testid="heat-stocks">
        <TVWidget className="qt-vtv qt-vtv-tall" label="Hisse ısı haritası" script="embed-widget-stock-heatmap.js"
          config={{ exchanges: [], dataSource: "SPX500", grouping: "sector", blockSize: "market_cap_basic", blockColor: "change", locale: "tr", symbolUrl: "", colorTheme: "dark", hasTopBar: true, isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false, width: "100%", height: "100%" }} />
      </Panel>
    </div>
  );
}

export function NewsView() {
  return (
    <div className="qt-view qt-view-news" data-testid="view-news">
      <Panel num="09" title="Ekonomik takvim" sub="Türkiye, ABD, Euro bölgesi, İngiltere, Japonya, Çin" testid="news-calendar">
        <TVWidget className="qt-vtv qt-vtv-tall" label="Ekonomik takvim" script="embed-widget-events.js"
          config={{ colorTheme: "dark", isTransparent: true, width: "100%", height: "100%", locale: "tr", importanceFilter: "0,1", countryFilter: "tr,us,eu,gb,jp,cn" }} />
      </Panel>
      <Panel num="10" title="Piyasa haberleri" sub="TradingView haber akışı" testid="news-feed">
        <TVWidget className="qt-vtv qt-vtv-tall" label="Haberler" script="embed-widget-timeline.js"
          config={{ feedMode: "all_symbols", isTransparent: true, displayMode: "regular", width: "100%", height: "100%", colorTheme: "dark", locale: "tr" }} />
      </Panel>
    </div>
  );
}
