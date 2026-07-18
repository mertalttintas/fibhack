import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  BrainCircuit,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  Users,
  Database,
  Scale,
  Megaphone,
  Activity,
} from "lucide-react";
import { statusColumns, type Department, type DeptTask, type TaskStatus } from "../data/mock";
import { Typewriter } from "../components/Typewriter";
import { cn } from "../lib/utils";

const DEPT_COLORS: Record<string, string> = {
  CRM: "text-fteal-light border-fteal/30 bg-fteal/10",
  "Veri Platformları": "text-fgreen-light border-fgreen/30 bg-fgreen/10",
  Legal: "text-amber border-amber/30 bg-amber/10",
  Pazarlama: "text-coral border-coral/30 bg-coral/10",
};

const DEPT_HEX: Record<string, string> = {
  CRM: "#2FB6A6",
  "Veri Platformları": "#8DC63F",
  Legal: "#F0B429",
  Pazarlama: "#E85D75",
};

const DEPT_ICONS: Record<string, typeof Users> = {
  CRM: Users,
  "Veri Platformları": Database,
  Legal: Scale,
  Pazarlama: Megaphone,
};

const STATUS_HEX: Record<TaskStatus, string> = {
  waiting: "#64748b",
  processing: "#2FB6A6",
  assigned: "#F0B429",
  done: "#8DC63F",
};

const PRIORITY_COLORS: Record<string, string> = {
  Yüksek: "text-coral",
  Orta: "text-amber",
  Düşük: "text-slate-500",
};

function taskCode(id: string) {
  const digits = id.replace(/\D/g, "");
  return `ORC-${(digits.slice(-3) || "000").padStart(3, "0")}`;
}

// Üstte: AI çekirdeğinden departmanlara canlı dağıtım haritası
function DispatchMap({ tasks }: { tasks: DeptTask[] }) {
  const depts: Department[] = ["CRM", "Veri Platformları", "Legal", "Pazarlama"];
  const counts = depts.map((d) => tasks.filter((t) => t.department === d && t.status !== "done").length);
  const nodeX = [300, 480, 660, 840];
  return (
    <div className="glass p-4 mb-6 overflow-x-auto">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
        <Activity size={11} className="text-fteal" /> Canlı Dağıtım Haritası
      </div>
      <svg viewBox="0 0 900 130" className="w-full min-w-[640px]" fill="none">
        {/* Çekirdek → departman hatları */}
        {nodeX.map((x, i) => {
          const d = `M 118 62 C ${118 + (x - 118) * 0.4} 62, ${x - 60} 55, ${x - 26} 55`;
          return (
            <g key={i}>
              <path d={d} stroke={`${DEPT_HEX[depts[i]]}30`} strokeWidth="1.5" />
              {counts[i] > 0 &&
                [0, 1].map((p) => (
                  <circle key={p} r="2.5" fill={DEPT_HEX[depts[i]]} opacity="0.9">
                    <animateMotion dur="2.2s" begin={`${i * 0.3 + p * 1.1}s`} repeatCount="indefinite" path={d} />
                  </circle>
                ))}
            </g>
          );
        })}

        {/* AI çekirdeği */}
        <g>
          <rect x="38" y="34" width="56" height="56" rx="10" transform="rotate(45 66 62)" fill="rgba(47,182,166,0.08)" stroke="#2FB6A6" strokeOpacity="0.7" strokeWidth="1.5" />
          <rect x="50" y="46" width="32" height="32" rx="6" transform="rotate(45 66 62)" fill="rgba(47,182,166,0.18)" />
          <text x="66" y="66" textAnchor="middle" fill="#4FD8C7" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">AI</text>
          <text x="66" y="118" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" letterSpacing="2">ORCHESTRATOR</text>
        </g>

        {/* Departman düğümleri */}
        {depts.map((dept, i) => {
          const x = nodeX[i];
          const c = DEPT_HEX[dept];
          return (
            <g key={dept}>
              <circle cx={x} cy="55" r="22" fill={`${c}10`} stroke={c} strokeOpacity="0.65" strokeWidth="1.5" />
              {counts[i] > 0 && (
                <circle cx={x} cy="55" r="22" fill="none" stroke={c} strokeOpacity="0.35" strokeWidth="1">
                  <animate attributeName="r" values="22;28;22" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.35;0;0.35" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
              <text x={x} y="59" textAnchor="middle" fill={c} fontSize="13" fontFamily="JetBrains Mono" fontWeight="700">
                {counts[i]}
              </text>
              <text x={x} y="99" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="Inter">
                {dept === "Veri Platformları" ? "Veri Plt." : dept}
              </text>
              <text x={x} y="112" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="JetBrains Mono">
                aktif görev
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TaskCard({ task, onClick }: { task: DeptTask; onClick: () => void }) {
  const color = DEPT_HEX[task.department];
  return (
    <motion.button
      layout
      layoutId={task.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="corner-card glass w-full text-left p-3.5 space-y-2 transition-shadow duration-300 hover:shadow-glow-teal-sm"
      style={{ borderLeft: `2px solid ${color}`, boxShadow: `inset 4px 0 14px -8px ${color}66` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono text-slate-500 tracking-wider">{taskCode(task.id)}</span>
        <span className={cn("text-[10px] font-semibold", PRIORITY_COLORS[task.priority])}>● {task.priority}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5", DEPT_COLORS[task.department])}>
          {task.department}
        </span>
        {task.warning && (
          <span className="flex items-center gap-1 text-[10px] text-amber">
            <AlertTriangle size={10} />
          </span>
        )}
      </div>
      <div className="text-[13px] font-semibold text-white leading-snug">{task.title}</div>
      <div className="text-xs text-slate-400 leading-snug">{task.summary}</div>
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          <Clock size={10} /> {task.assignedAt}
        </span>
        {task.details && (
          <span className="text-[9px] font-mono text-fteal-light/70">
            {task.details.subtasks.filter((s) => s.status === "hazır").length}/{task.details.subtasks.length} alt görev
          </span>
        )}
      </div>
    </motion.button>
  );
}

export function TaskBoard({
  tasks,
  onAdvance,
}: {
  tasks: DeptTask[];
  onAdvance: (id: string) => void;
}) {
  const [selected, setSelected] = useState<DeptTask | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // Otomatik demo modu: birkaç saniyede bir bir görev sütunlar arasında ilerler
  useEffect(() => {
    if (!demoMode) return;
    const id = setInterval(() => {
      const movable = tasks.filter((t) => t.status !== "done");
      if (movable.length === 0) return;
      const pick = movable[Math.floor(Math.random() * movable.length)];
      onAdvance(pick.id);
    }, 3500);
    return () => clearInterval(id);
  }, [demoMode, tasks, onAdvance]);

  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s);
  const stats = useMemo(
    () => ({
      active: tasks.filter((t) => t.status !== "done").length,
      done: tasks.filter((t) => t.status === "done").length,
      processing: tasks.filter((t) => t.status === "processing").length,
    }),
    [tasks]
  );

  return (
    <div className="cyber-grid min-h-screen px-8 py-6 relative">
      {/* Zemin parlaması */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(47,182,166,0.07),transparent)]" />

      <div className="relative flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] font-mono text-fteal tracking-[0.3em] uppercase mb-1">
            Orchestrator // Mission Control
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Departman Görev Panosu</h1>
          <p className="text-sm text-slate-400 mt-1">
            AI'ın atadığı görevler ve her kararın gerekçesi — karta tıklayın.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2 flex items-center gap-4 text-[11px] font-mono">
            <span className="text-slate-400">
              AKTİF <span className="text-fteal-light font-bold">{stats.active}</span>
            </span>
            <span className="text-slate-400">
              İŞLENEN <span className="text-amber font-bold">{stats.processing}</span>
            </span>
            <span className="text-slate-400">
              TAMAM <span className="text-fgreen-light font-bold">{stats.done}</span>
            </span>
          </div>
          <button
            onClick={() => setDemoMode((d) => !d)}
            className={cn(
              "flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-all",
              demoMode
                ? "bg-fteal/15 border-fteal/40 text-fteal-light shadow-glow-teal-sm"
                : "border-white/10 text-slate-400 hover:text-slate-200"
            )}
          >
            {demoMode ? <Pause size={13} /> : <Play size={13} />}
            {demoMode ? "Canlı akış açık" : "Canlı akışı başlat"}
          </button>
        </div>
      </div>

      <div className="relative">
        <DispatchMap tasks={tasks} />
      </div>

      <div className="relative grid grid-cols-4 gap-4">
        {statusColumns.map((col) => {
          const colTasks = byStatus(col.key);
          const hex = STATUS_HEX[col.key];
          return (
            <div
              key={col.key}
              className={cn(
                "min-h-[56vh] rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3",
                col.key === "processing" && "scan-col"
              )}
              style={{ borderTop: `2px solid ${hex}`, boxShadow: `inset 0 10px 24px -22px ${hex}` }}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  className={cn("w-2 h-2 rounded-full", col.key === "processing" && "animate-pulse-soft")}
                  style={{ backgroundColor: hex, boxShadow: `0 0 8px ${hex}` }}
                />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-300 font-mono">
                  {col.label}
                </span>
                <span
                  className="text-[10px] font-mono ml-auto px-1.5 py-0.5 rounded border"
                  style={{ color: hex, borderColor: `${hex}55`, backgroundColor: `${hex}12` }}
                >
                  {colTasks.length.toString().padStart(2, "0")}
                </span>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {colTasks.map((t) => (
                    <TaskCard key={t.id} task={t} onClick={() => setSelected(t)} />
                  ))}
                </AnimatePresence>
                {colTasks.length === 0 && (
                  <div className="border border-dashed border-white/10 rounded-2xl h-24 flex items-center justify-center text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                    — Boş —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Karar gerekçesi yan paneli */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 h-full w-[400px] bg-navy-900/95 backdrop-blur-xl border-l border-fteal/20 z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-fteal">
                  <BrainCircuit size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">AI Karar Gerekçesi</span>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono text-slate-500">{taskCode(selected.id)}</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5", DEPT_COLORS[selected.department])}>
                  {selected.department}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{selected.title}</h2>
              <p className="text-sm text-slate-400 mb-5">{selected.summary}</p>

              <div className="glass p-4 border-fteal/25 mb-5">
                <div className="text-[11px] text-fteal font-semibold uppercase tracking-wider mb-2">
                  Neden bu karar?
                </div>
                <p className="text-[13px] text-slate-200 leading-relaxed">
                  <Typewriter text={selected.rationale} key={selected.id} />
                </p>
              </div>

              {selected.details && (
                <>
                  <div className="glass p-4 mb-4">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2.5">
                      Hedef KPI'lar
                    </div>
                    <div className="space-y-1.5">
                      {selected.details.kpis.map((k, i) => (
                        <div key={i} className="flex justify-between text-xs gap-3">
                          <span className="text-slate-400">{k.label}</span>
                          <span className="text-fgreen-light font-mono font-semibold text-right">{k.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass p-4 mb-4">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2.5">
                      Alt Görevler
                    </div>
                    <div className="space-y-1.5">
                      {selected.details.subtasks.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              s.status === "sürüyor" && "bg-fteal animate-pulse-soft",
                              s.status === "planlandı" && "bg-slate-500",
                              s.status === "hazır" && "bg-fgreen"
                            )}
                          />
                          <span className="text-slate-300 flex-1">{s.name}</span>
                          <span className="text-fteal-light font-mono shrink-0">{s.eta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 bg-coral/[0.06] border border-coral/20 rounded-xl px-3 py-2.5 mb-4 leading-snug">
                    <span className="text-coral font-bold uppercase tracking-wider block mb-0.5 text-[10px]">Risk</span>
                    {selected.details.risk}
                  </div>
                </>
              )}

              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <span>Atanma zamanı</span>
                  <span className="text-slate-200 font-mono">{selected.assignedAt}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <span>Öncelik</span>
                  <span className={cn("font-semibold", PRIORITY_COLORS[selected.priority])}>{selected.priority}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2">
                  <span>Karar kaynağı</span>
                  <span className="text-slate-200">Organizational memory · 14 kampanya</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span>Güven skoru</span>
                  <span className="text-fgreen-light font-mono font-semibold">%91</span>
                </div>
              </div>

              {selected.status !== "done" && (
                <button
                  onClick={() => {
                    onAdvance(selected.id);
                    setSelected(null);
                  }}
                  className="mt-6 w-full bg-gradient-to-r from-fteal to-fgreen text-navy-950 font-bold text-sm py-2.5 rounded-xl hover:shadow-glow-green transition-shadow"
                >
                  Görevi bir sonraki aşamaya taşı →
                </button>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
