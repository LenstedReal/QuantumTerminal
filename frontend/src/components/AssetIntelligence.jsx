import React, { useState } from "react";
import { TrendingUp, TrendingDown, Flame, Loader2, Search } from "lucide-react";

const formatPrice = (p) => {
  if (!p) return "--";
  if (p >= 1) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + p.toFixed(6);
};

const formatMcap = (val) => {
  if (!val) return "--";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toFixed(0)}`;
};

function CoinRow({ coin, index }) {
  const change = coin.price_change_percentage_24h;
  const isUp = change >= 0;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 transition-colors duration-75 border-b border-zinc-800/30 cursor-pointer ${coin._priceDir === 'up' ? 'flash-green' : coin._priceDir === 'down' ? 'flash-red' : ''}`}
      data-testid={`asset-row-${coin.id}`}
    >
      <span className="text-[10px] text-zinc-600 font-mono w-4 text-right">{index + 1}</span>
      <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white uppercase">{coin.symbol}</span>
          <span className="text-[10px] text-zinc-500 truncate">{coin.name}</span>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">{formatMcap(coin.market_cap)}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-mono text-white">{formatPrice(coin.current_price)}</div>
        <div className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {isUp ? "+" : ""}{change?.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function TrendingItem({ item }) {
  const coin = item.item;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800/50 transition-colors duration-75" data-testid={`trending-${coin.id}`}>
      <span className="text-[10px] text-orange-400 font-mono">#{coin.market_cap_rank || '--'}</span>
      <img src={coin.small} alt={coin.symbol} className="w-4 h-4 rounded-full" />
      <span className="text-[11px] text-white font-medium uppercase">{coin.symbol}</span>
      <span className="text-[10px] text-zinc-500 truncate flex-1">{coin.name}</span>
    </div>
  );
}

export default function AssetIntelligence({ marketData, trending, loading }) {
  const [tab, setTab] = useState("markets");
  const [search, setSearch] = useState("");

  const filteredData = marketData.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" data-testid="asset-intelligence">
      {/* Panel Header */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">
          Asset Intelligence
        </div>
        <div className="text-[9px] text-zinc-600 font-mono">01</div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 shrink-0">
        <button
          onClick={() => setTab("markets")}
          className={`flex-1 py-2 text-[10px] font-bold tracking-wider transition-colors duration-75 ${
            tab === "markets" ? "text-blue-400 border-b border-blue-400 bg-blue-400/5" : "text-zinc-500 hover:text-zinc-300"
          }`}
          data-testid="tab-markets"
        >
          MARKETS
        </button>
        <button
          onClick={() => setTab("trending")}
          className={`flex-1 py-2 text-[10px] font-bold tracking-wider transition-colors duration-75 flex items-center justify-center gap-1 ${
            tab === "trending" ? "text-orange-400 border-b border-orange-400 bg-orange-400/5" : "text-zinc-500 hover:text-zinc-300"
          }`}
          data-testid="tab-trending"
        >
          <Flame className="w-3 h-3" /> TRENDING
        </button>
      </div>

      {/* Search */}
      {tab === "markets" && (
        <div className="px-3 py-2 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 bg-zinc-900 rounded px-2 py-1">
            <Search className="w-3 h-3 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none flex-1 font-mono"
              data-testid="asset-search-input"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
        ) : tab === "markets" ? (
          filteredData.map((coin, i) => <CoinRow key={coin.id} coin={coin} index={i} />)
        ) : (
          trending.slice(0, 10).map((item, i) => <TrendingItem key={i} item={item} />)
        )}
      </div>
    </div>
  );
}
