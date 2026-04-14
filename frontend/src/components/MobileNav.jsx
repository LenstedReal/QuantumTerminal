import React from "react";
import { BarChart3, LineChart, Activity, Terminal } from "lucide-react";

const tabs = [
  { id: "chart", label: "Chart", icon: LineChart },
  { id: "assets", label: "Assets", icon: BarChart3 },
  { id: "metrics", label: "Metrics", icon: Activity },
  { id: "logs", label: "Logs", icon: Terminal },
];

export default function MobileNav({ activePanel, setActivePanel }) {
  return (
    <nav className="lg:hidden flex items-center bg-[#121214] border-t border-zinc-800 shrink-0 z-30" data-testid="mobile-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const active = activePanel === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors duration-75 ${
              active ? "text-blue-400" : "text-zinc-600"
            }`}
            data-testid={`mobile-nav-${tab.id}`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[9px] font-bold tracking-wider uppercase">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
