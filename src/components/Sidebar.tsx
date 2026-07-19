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
    <aside
      className="fixed left-0 top-0 z-40 flex h-full w-60 flex-col text-white shadow-[4px_0_24px_rgba(13,43,69,0.12)]"
      style={{ background: "linear-gradient(165deg, #0058A3 0%, #0069B4 34%, #2E9C64 72%, #7AB929 100%)" }}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/15 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/95 shadow-sm">
          <DiamondLogo size={26} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-white">deneme</div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-white/70">
            AI Orchestrator
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {items.map(({ key, label, icon: Icon }) => {
          const active = page === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                active
                  ? "bg-white text-[#0069B4] shadow-[0_4px_14px_rgba(13,43,69,0.18)] font-semibold"
                  : "text-white/80 hover:bg-white/[0.12] hover:text-white"
              )}
            >
              <Icon size={17} />
              {label}
              {key === "board" && boardBadge > 0 && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    active ? "bg-[#0069B4]/10 text-[#0069B4]" : "border border-white/40 bg-white/20 text-white"
                  )}
                >
                  {boardBadge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pb-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/25 shadow-[0_8px_24px_rgba(13,43,69,0.2)]">
          <img src="/rabbit-full.png" alt="Fiba maskot" className="h-48 w-full object-cover object-top" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c4d12]/85 via-[#1c4d12]/40 to-transparent px-3 pb-2.5 pt-10">
            <div className="text-[11px] font-bold leading-tight text-white">Team-bot görevde</div>
            <div className="mt-0.5 text-[9px] text-white/80">Kampanyalar tavşan hızında 🍒</div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15 px-5 py-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
          <div className="relative shrink-0">
            <img src="/rabbit-face.png" alt="Fiba maskot" className="h-9 w-9 rounded-xl border border-white/40 object-cover" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
          </div>
          <div className="text-[11px] leading-tight">
            <div className="font-medium text-white">Orchestrator aktif</div>
            <div className="text-white/65">v2.4.1 · uptime 214 gün</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
