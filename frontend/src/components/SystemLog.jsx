import React from "react";

export default function SystemLog({ logs, source }) {
  return (
    <section className="qt-panel qt-log" aria-labelledby="log-title" data-testid="system-log">
      <div className="qt-panel-head">
        <h2 id="log-title"><span className="qt-mod" aria-hidden="true">03</span>Sistem kaydı</h2>
        <span className="qt-muted">{source ? `kaynak: ${source}` : "bağlanıyor"}</span>
      </div>
      <ol className="qt-log-list" aria-live="polite">
        {logs.map((l) => (
          <li key={l.id} className={`qt-log-item is-${l.tone}`}>
            <span className="qt-log-time qt-num">[{l.time}]</span>
            <span className="qt-log-text">{l.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
