import React, { useRef, useEffect } from "react";
import { Terminal } from "lucide-react";

const levelColors = {
  INFO: "text-zinc-400",
  SUCCESS: "text-emerald-400",
  ERROR: "text-red-400",
  WARN: "text-yellow-400",
};

export default function SystemLogs({ logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div className="flex flex-col shrink-0 h-[160px] lg:h-[140px] border-t border-zinc-800" data-testid="system-logs">
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#0A0A0C]">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-zinc-500" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">System Logs</span>
        </div>
        <span className="text-[9px] text-zinc-600 font-mono">{logs.length} entries</span>
      </div>

      {/* Log Entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-black/40 px-3 py-1 min-h-0">
        {logs.map(log => {
          const t = new Date(log.timestamp);
          const time = t.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          return (
            <div key={log.id} className="flex gap-2 py-0.5 text-[11px] font-mono leading-relaxed" data-testid="log-entry">
              <span className="text-blue-400 shrink-0">[{time}]</span>
              <span className={`shrink-0 ${levelColors[log.level] || 'text-zinc-400'}`}>[{log.level}]</span>
              <span className="text-zinc-400">{log.message}</span>
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="text-zinc-600 text-[11px] font-mono py-2">Awaiting system events...</div>
        )}
      </div>
    </div>
  );
}
