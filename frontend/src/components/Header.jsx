import React from "react";
import { Logo, clockTR, useNow } from "@/components/qt/ui";

const STATUS = {
  loading: { text: "Bağlanıyor", cls: "is-wait" },
  live: { text: "Canlı", cls: "is-live" },
  stale: { text: "Gecikmeli veri", cls: "is-warn" },
  offline: { text: "Bağlantı yok", cls: "is-down" },
  error: { text: "Veri alınamadı", cls: "is-down" },
};

export default function Header({ status, updatedAt, onRefresh, source, children }) {
  const now = useNow(1000);
  const st = STATUS[status] || STATUS.loading;
  return (
    <header className="qt-top" data-testid="header">
      <a className="qt-brand" href="/" aria-label="LENSTEDREAL Quantum Terminal ana sayfa">
        <Logo size={32} />
        <span className="qt-brand-text">
          <span className="qt-brand-name">LENSTEDREAL</span>
          <span className="qt-brand-sub">Quantum Terminal V11</span>
        </span>
      </a>
      {children}
      <div className="qt-top-right">
        <button type="button" className={`qt-status ${st.cls}`} onClick={onRefresh} title={source ? `Şimdi yenile · kaynak: ${source}` : "Şimdi yenile"} data-testid="sync-status">
          <span className="qt-status-dot" aria-hidden="true" />
          <span>{st.text}</span>
          {updatedAt && <span className="qt-status-time">güncelleme {clockTR(updatedAt)}</span>}
        </button>
        <div className="qt-clock" aria-label="İstanbul saati" data-testid="clock">
          <span className="qt-clock-time">{clockTR(now)}</span>
          <span className="qt-clock-zone">İstanbul</span>
        </div>
      </div>
    </header>
  );
}
