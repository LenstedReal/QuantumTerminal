import React from "react";

const formatPrice = (p) => {
  if (p >= 1) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return p.toFixed(6);
};

export default function TickerBar({ marketData }) {
  if (!marketData.length) return null;

  const items = marketData.slice(0, 15);
  const doubled = [...items, ...items];

  return (
    <div className="h-7 bg-[#0C0C0E] border-b border-zinc-800/50 overflow-hidden flex items-center shrink-0" data-testid="ticker-bar">
      <div className="ticker-animate flex items-center gap-6 whitespace-nowrap px-4">
        {doubled.map((coin, i) => (
          <div key={`${coin.id}-${i}`} className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-zinc-400 font-semibold uppercase">{coin.symbol}</span>
            <span className="text-white">${formatPrice(coin.current_price)}</span>
            <span className={coin.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400"}>
              {coin.price_change_percentage_24h >= 0 ? "+" : ""}
              {coin.price_change_percentage_24h?.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
