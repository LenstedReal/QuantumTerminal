import React, { useState } from "react";
import { Monitor, Globe, Clock } from "lucide-react";

export default function AssetIntelligence({ marketData, systemLogs, loginLogs }) {
  const [tab, setTab] = useState("assets");

  // Build asset items from real market data + static ones
  const btc = marketData.find(c => c.symbol === 'btc');
  const eth = marketData.find(c => c.symbol === 'eth');

  const staticAssets = [
    { symbol: "NVDA.US", order: "$5.50", trend: "Momentum Yükselişi", status: "GÜÇLÜ AL", statusColor: "#00ff6a" },
    { symbol: "GOOGL.US", order: "$3.43", trend: "İşleniyor", status: "BEKLEMEDE", statusColor: "#00f2ff" },
  ];

  const liveAssets = [];
  if (btc) liveAssets.push({
    symbol: "BTC/USD", order: `$${btc.current_price?.toLocaleString()}`,
    trend: btc.price_change_percentage_24h >= 2 ? "Momentum Yükselişi" : btc.price_change_percentage_24h >= 0 ? "Birikim Fazı" : "Dağıtım Fazı",
    status: btc.price_change_percentage_24h >= 0 ? "YÜKSELİŞ" : "DÜŞÜŞ",
    statusColor: btc.price_change_percentage_24h >= 0 ? "#00ff6a" : "#ff003c",
  });
  if (eth) liveAssets.push({
    symbol: "ETH/USD", order: `$${eth.current_price?.toLocaleString()}`,
    trend: eth.price_change_percentage_24h >= 2 ? "Kırılma Sinyali" : "Konsolidasyon",
    status: eth.price_change_percentage_24h >= 0 ? "YÜKSELİŞ" : "DÜŞÜŞ",
    statusColor: eth.price_change_percentage_24h >= 0 ? "#00ff6a" : "#ff003c",
  });

  const allAssets = [...staticAssets, ...liveAssets];

  return (
    <div className="flex flex-col h-full" data-testid="asset-intelligence">
      {/* Module Header */}
      <div className="px-4 py-2.5 flex justify-between items-center shrink-0" style={{
        background: 'rgba(15,23,42,0.5)', borderBottom: '1px solid rgba(30,41,59,0.6)'
      }}>
        <span className="text-[11px] uppercase font-bold tracking-wider" style={{ color: '#00f2ff' }}>
          Varlık İstihbaratı
        </span>
        <span className="text-[11px] font-bold" style={{ color: '#00f2ff' }}>01</span>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(30,41,59,0.6)' }}>
        {[
          { id: "assets", label: "VARLIKLAR" },
          { id: "activity", label: "AKTİVİTE KAYDI" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 text-[9px] font-bold tracking-wider transition-all"
            style={{
              color: tab === t.id ? '#00f2ff' : '#64748b',
              borderBottom: tab === t.id ? '1px solid #00f2ff' : '1px solid transparent',
              background: tab === t.id ? 'rgba(0,242,255,0.03)' : 'transparent'
            }}
            data-testid={`tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === "assets" && (
          <>
            {allAssets.map((asset, i) => (
              <div key={i} className="px-4 py-3" style={{ borderBottom: '1px solid rgba(30,41,59,0.6)', background: 'rgba(255,255,255,0.01)' }} data-testid={`asset-item-${i}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{asset.symbol}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{
                    color: asset.statusColor,
                    border: `1px solid ${asset.statusColor}`,
                    background: `${asset.statusColor}10`
                  }} data-testid={`asset-badge-${i}`}>
                    {asset.status}
                  </span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: '#64748b' }}>
                  Order: {asset.order}<br />
                  {asset.trend.includes("İşleniyor") ? `Durum: ${asset.trend}` : `Trend: ${asset.trend}`}
                </p>
              </div>
            ))}
          </>
        )}

        {tab === "activity" && (
          <div className="px-2 py-1">
            {loginLogs.length === 0 && (
              <div className="text-[10px] py-4 text-center" style={{ color: '#64748b' }}>Henüz giriş aktivitesi yok</div>
            )}
            {loginLogs.map((log, i) => (
              <div key={i} className="py-2 px-2 text-[10px]" style={{ borderBottom: '1px solid rgba(30,41,59,0.3)', fontFamily: "'JetBrains Mono', monospace" }} data-testid={`login-log-${i}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Monitor className="w-2.5 h-2.5" style={{ color: log.success ? '#00ff6a' : '#ff003c' }} />
                  <span style={{ color: log.success ? '#00ff6a' : '#ff003c' }}>{log.success ? "BAŞARILI" : "BAŞARISIZ"}</span>
                  <span style={{ color: '#64748b' }}>{log.email}</span>
                </div>
                <div className="flex items-center gap-3 ml-4" style={{ color: '#475569' }}>
                  <span><Globe className="w-2.5 h-2.5 inline mr-0.5" />{log.ip_address}</span>
                  <span>{log.device_type} - {log.device}</span>
                </div>
                <div className="ml-4 mt-0.5" style={{ color: '#374151' }}>
                  <Clock className="w-2.5 h-2.5 inline mr-0.5" />{new Date(log.timestamp).toLocaleString("tr-TR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Log Box */}
      <div className="shrink-0" style={{ background: '#000', borderTop: '1px solid rgba(30,41,59,0.6)', height: '100px' }} data-testid="system-log-box">
        <div className="h-full overflow-y-auto px-3 py-2">
          {systemLogs.map(log => (
            <div key={log.id} className="text-[10px] leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>
              <span style={{ color: '#00f2ff', marginRight: '5px' }}>[{log.time}]</span>
              {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
