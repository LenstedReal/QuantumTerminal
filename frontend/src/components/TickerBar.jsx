import React from "react";

const formatPrice = (p) => {
  if (!p) return "--";
  if (p >= 1) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + p.toFixed(6);
};

export default function TickerBar({ marketData }) {
  if (!marketData || marketData.length === 0) return null;

  const items = marketData.slice(0, 15);
  const doubled = [...items, ...items];

  return (
    <div className="h-6 overflow-hidden flex items-center shrink-0" style={{ background: 'rgba(7,10,16,0.9)', borderBottom: '1px solid rgba(30,41,59,0.4)' }} data-testid="ticker-bar">
      <div className="ticker-animate flex items-center gap-5 whitespace-nowrap px-4">
        {doubled.map((coin, i) => {
          const ch = coin.price_change_percentage_24h;
          return (
            <div key={`${coin.id}-${i}`} className="flex items-center gap-1.5 text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ color: '#64748b' }}>{coin.symbol?.toUpperCase()}</span>
              <span style={{ color: '#cbd5e1' }}>{formatPrice(coin.current_price)}</span>
              <span style={{ color: ch >= 0 ? '#00ff6a' : '#ff003c' }}>
                {ch >= 0 ? "+" : ""}{ch?.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
