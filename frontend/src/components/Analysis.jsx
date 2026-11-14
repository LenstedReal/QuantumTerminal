import React from "react";
import { WEIGHTS, analyzeQuote } from "@/lib/market";
import { Icon } from "@/components/qt/ui";

function Gauge({ score, tone }) {
  const angle = Math.max(-100, Math.min(100, score)) * 1.35;
  return (
    <div className={`qt-gauge ${tone}`} role="img" aria-label={`Skor ${score}, eksi 100 ile artı 100 arasında`}>
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
  const has = f.comp !== null;
  const w = has ? Math.min(1, Math.abs(f.comp)) * 50 : 0;
  const side = has && f.comp >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` };
  return (
    <li className={`qt-factor${has ? "" : " is-missing"}`}>
      <div className="qt-factor-top">
        <span className="qt-factor-label">{f.label}</span>
        <span className={`qt-factor-val qt-num ${!has ? "flat" : f.comp > 0.05 ? "up" : f.comp < -0.05 ? "down" : "flat"}`}>{f.display}</span>
      </div>
      <div className="qt-factor-bar" aria-hidden="true">
        {has && <span className={`qt-factor-fill ${f.comp >= 0 ? "up" : "down"}`} style={side} />}
      </div>
      <span className="qt-factor-hint">{f.hint}</span>
    </li>
  );
}

export default function Analysis({ row, loading }) {
  const a = row ? analyzeQuote(row) : null;
  return (
    <section className="qt-panel qt-intel" aria-labelledby="intel-title" data-testid="analysis">
      <div className="qt-panel-head">
        <h2 id="intel-title"><span className="qt-mod" aria-hidden="true">03</span>Kuantum analiz</h2>
        {a && a.ok && <span className={`qt-conf is-${a.confidence === "yüksek" ? "hi" : a.confidence === "orta" ? "mid" : "lo"}`}>Güven: {a.confidence}</span>}
      </div>

      {!row && (loading
        ? <div className="qt-intel-empty"><span className="qt-spinner" aria-hidden="true" />Piyasa verisi bekleniyor</div>
        : <div className="qt-intel-empty"><p>Piyasa verisi gelince analiz burada hesaplanır.</p></div>)}
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
          {a.missing.length > 0 && <p className="qt-intel-missing">Bu sembol için gelmeyen veri: {a.missing.join(", ")}. Skor diğerlerinden hesaplandı.</p>}
        </>
      )}

      <div className="qt-ai-note" data-testid="ai-note">
        <Icon name="info" size={18} />
        <div>
          <p><strong>Yapay zekâ hata yapabilir.</strong> Bu analiz, yapay zekâ ile kurulmuş bir sistemin piyasa verisinden otomatik hesapladığı bir özettir. Geleceği bilmez, yatırım tavsiyesi değildir.</p>
          <details>
            <summary>Nasıl hesaplanıyor?</summary>
            <p>
              Skor dört verinin ağırlıklı toplamıdır: TradingView teknik puanı %{Math.round(WEIGHTS.rec * 100)} (26 göstergenin
              ortak sonucu), haftalık değişim %{Math.round(WEIGHTS.pw * 100)}, günlük değişim %{Math.round(WEIGHTS.ch * 100)}, RSI
              %{Math.round(WEIGHTS.rsi * 100)}. Her veri −1 ile +1 arasına sıkıştırılır, toplam −100 ile +100 arasına ölçeklenir.
              Gelmeyen veri hesaba katılmaz ve güven düşer. Güven, verilerin aynı yönü gösterip göstermediğine bakar.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
