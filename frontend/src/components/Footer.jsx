import React from "react";

export default function Footer() {
  return (
    <footer className="py-3 flex items-center justify-between px-4 z-20 shrink-0" style={{
      background: 'rgba(10,12,18,0.96)',
      borderTop: '1px solid #00f2ff',
      boxShadow: '0 -1px 10px rgba(0,242,255,0.08)'
    }} data-testid="footer">
      <div />
      <div className="text-sm font-bold tracking-[3px] neon-glow" style={{ color: '#cbd5e1' }}>
        by lenstedreal &#10084;&#65039;&#8205;&#129657;
      </div>
      <a href="https://instagram.com/lenstedreal" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider transition-all hover:opacity-80"
        style={{ color: '#00f2ff' }} data-testid="instagram-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
        lenstedreal
      </a>
    </footer>
  );
}
