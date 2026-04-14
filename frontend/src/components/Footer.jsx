import React from "react";

export default function Footer() {
  return (
    <footer className="py-4 text-center z-20 shrink-0" style={{
      background: 'rgba(10,12,18,0.96)',
      borderTop: '1px solid #00f2ff'
    }} data-testid="footer">
      <div className="text-base font-bold tracking-[3px]" style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: '#cbd5e1',
        textShadow: '0 0 15px rgba(0,242,255,0.3)'
      }}>
        by lenstedreal &#10084;&#65039;&#8205;&#129657;
      </div>
    </footer>
  );
}
