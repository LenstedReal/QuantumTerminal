import React from "react";
import { analyze, fmtPct, WEIGHTS } from "@/lib/market";
import { Icon } from "@/components/qt/ui";

function Gauge({ score, tone }) {
  const angle = Math.max(-100, Math.min(100, score)) * 1.35;
  return (
    <div className={`qt-gauge ${tone}`} role="img" aria-label={`Sinyal skoru ${score}, eksi 100 ile artı 100 arasında`}>
      <div className="qt-gauge-ring" />
      <div className="qt-gauge-ticks" aria-hidden="true" />
      <div className="qt-gauge-orbit" aria-hidden="true"><span /></div>
      <div className="qt-gauge-needle" style={{ transform: `rotate(${angle}deg)` }} aria-hidden="true"><span /></div>
      <div className="qt-gauge-center">
        <span className="qt-gauge-score">{score > 0 ? `+${score}` : score < 0 ? `−${Math.abs(score)}` : "0"}</span>
        <span className="qt-gauge-scale">−100 … +100</span>
      </div>
    </div>
  );
}

function Factor({ f }) {
  const w = Math.min(1, Math.abs(f.comp)) * 50;
  const side = f.comp >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` };
  return (
    <li className="qt-factor">
      <div className="qt-factor-top">
        <span className="qt-factor-label">{f.label}</span>
        <span className={`qt-factor-val qt-num ${f.comp > 0.05 ? "up" : f.comp < -0.05 ? "down" : "flat"}`}>{f.display}</span>
      </div>
      <div className="qt-factor-bar" aria-hidden="true">
        <span className={`qt-factor-fill ${f.comp >= 0 ? "up" : "down"}`} style={side} />
      </div>
      <span className="qt-factor-hint">{f.hint}</span>
    </li>
  );
}

export default function AssetIntelligence({ asset, loading }) {
  const isStock = asset && asset.kind === "stock";
  const a = !isStock && asset ? analyze(asset) : null;

  return (
    <section className="qt-panel qt-intel" aria-labelledby="intel-title" data-testid="asset-intelligence">
      <div className="qt-panel-head">
        <h2 id="intel-title">Kuantum analiz</h2>
        {a && a.ok && <span className={`qt-conf is-${a.confidence === "yüksek" ? "hi" : a.confidence === "orta" ? "mid" : "lo"}`}>Güven: {a.confidence}</span>}
      </div>

      {!asset && (loading
        ? <div className="qt-intel-empty"><span className="qt-spinner" aria-hidden="true" />Piyasa verisi bekleniyor</div>
        : <div className="qt-intel-empty"><p>Piyasa verisi gelince analiz burada hesaplanır.</p></div>)}

      {isStock && (
        <div className="qt-intel-empty">
          <p>Bu analiz listedeki kripto varlıklar için hesaplanır. {asset.name} için TradingView'ın göstergeleri <strong>Teknik özet</strong> sekmesinde.</p>
        </div>
      )}

      {a && !a.ok && <div className="qt-intel-empty"><p>{a.reason}</p></div>}

      {a && a.ok && (
        <>
          <div className="qt-intel-hero">
            <Gauge score={a.score} tone={a.label.tone} />
            <div className="qt-intel-verdict">
              <span className={`qt-verdict ${a.label.tone}`} data-testid="intel-label">{a.label.text}</span>
              <p className="qt-intel-summary">{a.summary}</p>
            </div>
          </div>

          <ul className="qt-factors">
            {a.factors.map((f) => <Factor key={f.key} f={f} />)}
          </ul>

          <div className="qt-intel-stats">
            <div><span className="qt-k">Günlük oynaklık</span><span className="qt-stat-v"><span className="qt-num">{a.vol == null ? "—" : fmtPct(a.vol, { sign: false, digits: 1 })}</span><span className="qt-k2">{a.volZone}</span></span></div>
            <div><span className="qt-k">Veri</span><span className="qt-stat-v"><span className="qt-num">{a.points} saat</span><span className="qt-k2">son 7 gün</span></span></div>
          </div>
        </>
      )}

      <div className="qt-ai-note" data-testid="ai-note">
        <Icon name="info" size={18} />
        <div>
          <p><strong>Yapay zekâ hata yapabilir.</strong> Bu analiz, yapay zekâ ile kurulmuş bir sistemin fiyat verisinden otomatik hesapladığı bir özettir. Geleceği bilmez, yatırım tavsiyesi değildir.</p>
          <details>
            <summary>Nasıl hesaplanıyor?</summary>
            <p>
              Skor dört göstergenin ağırlıklı toplamıdır: ortalama farkı %{Math.round(WEIGHTS.trend * 100)},
              7 günlük değişim %{Math.round(WEIGHTS.mom7 * 100)}, 24 saatlik değişim %{Math.round(WEIGHTS.mom24 * 100)},
              RSI %{Math.round(WEIGHTS.rsi * 100)}. Her gösterge −1 ile +1 arasına sıkıştırılır, toplam −100 ile +100 arasına
              ölçeklenir. Veri: CoinGecko'nun son 7 günlük saatlik fiyatları. Güven, göstergelerin aynı yönü gösterip
              göstermediğine ve fiyatın ne kadar oynak olduğuna bakar.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
