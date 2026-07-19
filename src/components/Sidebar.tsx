import { Sparkles, KanbanSquare, TrendingUp, History } from "lucide-react";
import { cn } from "../lib/utils";
import { DiamondLogo } from "./DiamondLogo";
import type { Page } from "../App";

const items: { key: Page; label: string; icon: typeof Sparkles }[] = [
  { key: "campaign", label: "Yeni Kampanya", icon: Sparkles },
  { key: "board", label: "Görev Panosu", icon: KanbanSquare },
  { key: "signals", label: "Talep Sinyalleri", icon: TrendingUp },
  { key: "history", label: "Geçmiş Kampanyalar", icon: History },
];

export function Sidebar({
  page,
  onNavigate,
  boardBadge,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
  boardBadge: number;
}) {
  return (
    <aside className="fixed left-0 top-0 h-full w-60 border-r border-[#0d2b45]/[0.07] bg-white/90 backdrop-blur-xl flex flex-col z-40">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#0d2b45]/[0.07]">
        <DiamondLogo size={30} />
        <div className="leading-tight">
          <div className="text-sm font-bold text-[#0d2b45] tracking-tight">deneme</div>
          <div className="text-[10px] text-fteal font-medium tracking-widest uppercase">
            AI Orchestrator
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ key, label, icon: Icon }) => {
          const active = page === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative",
                active
                  ? "bg-fteal/10 text-fteal-light shadow-glow-teal-sm border border-fteal/30"
                  : "text-slate-600 hover:text-slate-800 hover:bg-[#0d2b45]/[0.04] border border-transparent"
              )}
            >
              <Icon size={17} className={active ? "drop-shadow-[0_0_6px_rgba(0,105,180,0.8)]" : ""} />
              {label}
              {key === "board" && boardBadge > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-coral/20 text-coral border border-coral/30 rounded-full px-1.5 py-0.5">
                  {boardBadge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-[#0d2b45]/[0.07]">
        <div className="glass px-3 py-2.5 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fgreen opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-fgreen" />
          </span>
          <div className="text-[11px] leading-tight">
            <div className="text-slate-700 font-medium">Orchestrator aktif</div>
            <div className="text-slate-500">v2.4.1 · uptime 214 gün</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
