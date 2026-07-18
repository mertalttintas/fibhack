import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Users,
  Database,
  Scale,
  Megaphone,
  AlertTriangle,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
  X,
  Target,
  ListChecks,
  CalendarClock,
  ShieldAlert,
  Layers,
  Cpu,
  Send,
  MessageSquareText,
  Route,
  FileText,
  Lightbulb,
} from "lucide-react";
import { DiamondLogo } from "../components/DiamondLogo";
import { CountUp } from "../components/CountUp";
import {
  analysisSteps,
  exampleIdeas,
  generateDeptCards,
  liveMetrics,
  localRefine,
  memoryBanner,
  type AnalyzeResult,
  type CampaignBrief,
  type DeptCard,
  type DeptTask,
  type RefineResult,
} from "../data/mock";
import { cn } from "../lib/utils";

const DEPT_ICONS: Record<string, typeof Users> = {
  CRM: Users,
  "Veri Platformları": Database,
  Legal: Scale,
  Pazarlama: Megaphone,
};

const DEPT_NODE_COLORS: Record<string, string> = {
  CRM: "#2FB6A6",
  "Veri Platformları": "#8DC63F",
  Legal: "#F0B429",
  Pazarlama: "#E85D75",
};

const PRIORITY_BADGE: Record<string, string> = {
  Yüksek: "text-coral border-coral/40 bg-coral/10",
  Orta: "text-amber border-amber/40 bg-amber/10",
  Düşük: "text-slate-400 border-slate-500/40 bg-slate-500/10",
};

const SUBTASK_STATUS: Record<string, string> = {
  planlandı: "text-slate-400 border-slate-500/40 bg-slate-500/10",
  sürüyor: "text-fteal-light border-fteal/40 bg-fteal/10",
  hazır: "text-fgreen-light border-fgreen/40 bg-fgreen/10",
};

type Phase = "input" | "refining" | "review" | "analyzing" | "results";

interface ChatMsg {
  role: "user" | "ai";
  text: string;
}

function briefToPrompt(b: CampaignBrief): string {
  return `${b.title}\nAmaç: ${b.objective}\nHedef segment: ${b.segment}\nKanallar: ${b.channels}\nZamanlama: ${b.timing}\nBaşarı ölçütü: ${b.kpi}`;
}

async function refineIdea(idea: string, feedback?: string, previousBrief?: CampaignBrief): Promise<RefineResult> {
  const minDelay = new Promise((r) => setTimeout(r, 1800));
  try {
    const req = fetch("/api/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, feedback, previousBrief }),
    });
    const [res] = await Promise.all([req, minDelay]);
    if (!res.ok) throw new Error(`api ${res.status}`);
    const data = await res.json();
    if (!data.brief || !Array.isArray(data.routing)) throw new Error("empty");
    return { ...data, live: true };
  } catch {
    await minDelay;
    return localRefine(idea, feedback);
  }
}

async function analyzeIdea(idea: string): Promise<AnalyzeResult> {
  const minDelay = new Promise((r) => setTimeout(r, 3600));
  try {
    const req = fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });
    const [res] = await Promise.all([req, minDelay]);
    if (!res.ok) throw new Error(`api ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.cards) || data.cards.length === 0) throw new Error("empty");
    return { summary: data.summary, memory: data.memory, cards: data.cards, live: true };
  } catch {
    await minDelay;
    return {
      summary: "Analiz, organizational memory ve talep sinyalleri temel alınarak hazırlandı.",
      memory: memoryBanner,
      cards: generateDeptCards(idea),
      live: false,
    };
  }
}

// Onay sonrası dağıtım animasyonu — sadece onaylanan departman düğümleri parlar
function FlowLines({ routed }: { routed?: string[] }) {
  const depts = ["CRM", "Veri Platformları", "Legal", "Pazarlama"];
  const labels = ["CRM", "Veri Plt.", "Legal", "Pazarlama"];
  const paths = [
    "M 300 90 C 180 130, 120 170, 70 220",
    "M 300 90 C 260 150, 230 190, 220 230",
    "M 300 90 C 340 150, 370 190, 380 230",
    "M 300 90 C 420 130, 480 170, 530 220",
  ];
  const isRouted = (d: string) => !routed || routed.includes(d);
  return (
    <svg viewBox="0 0 600 260" className="w-full max-w-2xl mx-auto" fill="none">
      {paths.map((d, i) => (
        <g key={i} opacity={isRouted(depts[i]) ? 1 : 0.2}>
          <path d={d} stroke="rgba(47,182,166,0.18)" strokeWidth="1.5" />
          {isRouted(depts[i]) &&
            [0, 1, 2].map((p) => (
              <circle key={p} r="3" fill={DEPT_NODE_COLORS[depts[i]]} opacity="0.9">
                <animateMotion dur="1.8s" begin={`${i * 0.15 + p * 0.6}s`} repeatCount="indefinite" path={d} />
              </circle>
            ))}
        </g>
      ))}
      {[70, 220, 380, 530].map((x, i) => (
        <g key={i} opacity={isRouted(depts[i]) ? 1 : 0.25}>
          <circle
            cx={x}
            cy={i === 0 || i === 3 ? 222 : 232}
            r="16"
            fill={`${DEPT_NODE_COLORS[depts[i]]}14`}
            stroke={DEPT_NODE_COLORS[depts[i]]}
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
          <text
            x={x}
            y={(i === 0 || i === 3 ? 222 : 232) + 34}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontFamily="Inter"
          >
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DeptCardView({ card, index, onOpen }: { card: DeptCard; index: number; onOpen: () => void }) {
  const Icon = DEPT_ICONS[card.department] ?? Users;
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 + index * 0.18, duration: 0.45, ease: "easeOut" }}
      onClick={onOpen}
      className="glass glass-hover p-5 flex flex-col gap-3 text-left cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-fteal/10 border border-fteal/30 flex items-center justify-center">
            <Icon size={17} className="text-fteal-light" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-fteal font-semibold">
              {card.department}
            </div>
            <div className="text-sm font-semibold text-white">{card.title}</div>
          </div>
        </div>
        {card.warning && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber bg-amber/10 border border-amber/30 rounded-full px-2 py-1">
            <AlertTriangle size={11} /> Dikkat
          </span>
        )}
      </div>

      <ul className="space-y-1.5 text-[13px] text-slate-300">
        {card.items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-fteal mt-0.5">▸</span>
            {it}
          </li>
        ))}
      </ul>

      {card.warning && (
        <div className="text-xs text-amber/90 bg-amber/[0.07] border border-amber/20 rounded-lg px-3 py-2">
          ⚠ {card.warning}
        </div>
      )}

      <div className="mt-auto pt-2 border-t border-white/[0.07] flex items-center justify-between">
        {card.metric ? (
          <div className="flex items-baseline gap-2">
            <CountUp
              value={Math.round(card.metric.value)}
              suffix={card.metric.suffix}
              className="text-2xl font-bold text-fgreen-light font-mono"
            />
            <span className="text-xs text-slate-500">{card.metric.label}</span>
          </div>
        ) : (
          <span />
        )}
        <span className="text-[11px] text-fteal-light flex items-center gap-1">
          Detayı aç <ArrowRight size={11} />
        </span>
      </div>
    </motion.button>
  );
}

function DetailModal({ card, onClose }: { card: DeptCard; onClose: () => void }) {
  const Icon = DEPT_ICONS[card.department] ?? Users;
  const d = card.details;
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-x-0 top-[6vh] mx-auto w-[min(760px,92vw)] max-h-[88vh] overflow-y-auto glass !bg-navy-900/95 border-fteal/25 z-50 p-6"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-fteal/10 border border-fteal/30 flex items-center justify-center">
              <Icon size={20} className="text-fteal-light" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-fteal font-semibold">{card.department}</div>
              <h2 className="text-lg font-bold text-white">{card.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="glass p-4 border-fteal/20 mb-4">
          <div className="text-[11px] text-fteal font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <BrainCircuit size={13} /> AI Karar Gerekçesi
          </div>
          <p className="text-[13px] text-slate-200 leading-relaxed">{card.rationale}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="glass p-4">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Target size={13} className="text-fgreen" /> Hedef KPI'lar
            </div>
            <div className="space-y-2">
              {d.kpis.map((k, i) => (
                <div key={i} className="flex justify-between text-xs gap-3">
                  <span className="text-slate-400">{k.label}</span>
                  <span className="text-fgreen-light font-mono font-semibold text-right">{k.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass p-4">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers size={13} className="text-fteal" /> Veri Kaynakları
            </div>
            <div className="flex flex-wrap gap-1.5">
              {d.dataSources.map((s, i) => (
                <span key={i} className="text-[10px] text-slate-300 bg-white/[0.05] border border-white/10 rounded-full px-2 py-1">
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CalendarClock size={13} className="text-amber" /> Zaman Planı
            </div>
            <p className="text-xs text-slate-300 font-mono">{d.timeline}</p>
          </div>
        </div>

        <div className="glass p-4 mb-4">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ListChecks size={13} className="text-fteal" /> Alt Görevler
          </div>
          <div className="space-y-2">
            {d.subtasks.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                <span className={cn("shrink-0 text-[10px] font-semibold border rounded-full px-2 py-0.5", SUBTASK_STATUS[s.status])}>
                  {s.status}
                </span>
                <span className="text-slate-200 flex-1">{s.name}</span>
                <span className="text-slate-500 shrink-0">{s.owner}</span>
                <span className="text-fteal-light font-mono shrink-0">{s.eta}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 items-start bg-coral/[0.06] border border-coral/20 rounded-xl px-4 py-3">
          <ShieldAlert size={15} className="text-coral shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] uppercase tracking-wider text-coral font-bold block mb-0.5">Risk Değerlendirmesi</span>
            <span className="text-xs text-slate-300 leading-snug">{d.risk}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export function NewCampaign({
  onTasksCreated,
  goToBoard,
}: {
  onTasksCreated: (t: DeptTask[]) => void;
  goToBoard: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("input");
  const [idea, setIdea] = useState("");
  const [feedback, setFeedback] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [refine, setRefine] = useState<RefineResult | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [openCard, setOpenCard] = useState<DeptCard | null>(null);
  const [sent, setSent] = useState(false);
  const submittedIdea = useRef("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "analyzing") return;
    setStepIndex(0);
    const id = setInterval(() => setStepIndex((s) => (s + 1) % analysisSteps.length), 900);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, phase]);

  // Adım 1: fikir gönderilir → AI tartışma + brief üretir (dağıtım YOK)
  const submit = async (text: string) => {
    if (!text.trim()) return;
    submittedIdea.current = text;
    setIdea(text);
    setSent(false);
    setChat([{ role: "user", text }]);
    setPhase("refining");
    const r = await refineIdea(text);
    setRefine(r);
    setChat((c) => [...c, { role: "ai", text: r.aiComment }]);
    setPhase("review");
  };

  // Revizyon: kullanıcı feedback yazar → brief güncellenir
  const revise = async () => {
    if (!feedback.trim() || !refine) return;
    const fb = feedback;
    setFeedback("");
    setChat((c) => [...c, { role: "user", text: fb }]);
    setPhase("refining");
    const r = await refineIdea(submittedIdea.current, fb, refine.brief);
    setRefine(r);
    setChat((c) => [...c, { role: "ai", text: r.aiComment }]);
    setPhase("review");
  };

  // Adım 2: kullanıcı ONAYLAR → görevler departmanlara dağıtılır
  const approve = async () => {
    if (!refine) return;
    setPhase("analyzing");
    const r = await analyzeIdea(briefToPrompt(refine.brief));
    setResult(r);
    setPhase("results");
  };

  const sendToBoard = () => {
    if (!result || !refine) return;
    const now = new Date();
    const ts = `Bugün ${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const priorityOf = (dept: string) =>
      refine.routing.find((r) => r.department === dept)?.priority ?? "Orta";
    const newTasks: DeptTask[] = result.cards.map((c, i) => ({
      id: `nt-${Date.now()}-${i}`,
      department: c.department,
      title: c.title,
      summary: c.items[0],
      status: "waiting",
      assignedAt: ts,
      priority: priorityOf(c.department),
      rationale: c.rationale,
      warning: c.warning ? "Mevzuat riski" : undefined,
      details: c.details,
    }));
    onTasksCreated(newTasks);
    setSent(true);
  };

  const routedDepts = refine?.routing.map((r) => r.department);

  return (
    <div className="max-w-6xl mx-auto px-8 py-6">
      {/* Üst şerit: canlı metrikler */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <BrainCircuit size={16} className="text-fteal" />
          Karar Orkestratörü
        </div>
        <div className="flex items-center gap-5 text-[11px] text-slate-400 glass px-4 py-2">
          {liveMetrics.map((m, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-fgreen animate-pulse-soft" />
              {m.label}:{" "}
              <CountUp value={m.value} suffix={m.suffix ?? ""} className="text-fteal-light font-semibold font-mono" />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-3xl mx-auto text-center pt-8"
          >
            <div className="flex justify-center mb-6">
              <DiamondLogo size={64} />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
              Kampanya fikrinizi yazın,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fteal-light to-fgreen">
                birlikte şekillendirelim.
              </span>
            </h1>
            <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">
              AI fikrinizi doğrudan dağıtmaz: önce sizinle tartışır, yapılandırılmış bir brief'e
              çevirir ve hangi departmanlara gideceğini gösterir. <span className="text-fteal-light">Siz onaylamadan hiçbir görev atanmaz.</span>
            </p>

            <div className="glass p-2 shadow-glow-teal-sm focus-within:shadow-glow-teal transition-shadow">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(idea);
                  }
                }}
                rows={3}
                placeholder="Örn: Üniversite öğrencilerine özel, kira ödemelerinde puan kazandıran bir kredi kartı kampanyası başlatalım…"
                className="w-full bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 text-sm p-3"
              />
              <div className="flex justify-end p-1">
                <button
                  onClick={() => submit(idea)}
                  className="flex items-center gap-2 bg-gradient-to-r from-fteal to-fgreen text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl hover:shadow-glow-green transition-shadow"
                >
                  <MessageSquareText size={15} /> AI ile Tartış
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {exampleIdeas.map((ex, i) => (
                <button key={i} className="chip max-w-xs truncate" onClick={() => submit(ex)} title={ex}>
                  {ex.length > 52 ? ex.slice(0, 52) + "…" : ex}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {(phase === "refining" || phase === "review") && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto"
          >
            {/* Sohbet balonları */}
            <div className="space-y-3 mb-5">
              {chat.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                      m.role === "user"
                        ? "bg-fteal/15 border border-fteal/30 text-slate-100 rounded-br-sm"
                        : "glass text-slate-200 rounded-bl-sm"
                    )}
                  >
                    {m.role === "ai" && (
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-fteal font-bold mb-1.5">
                        <BrainCircuit size={11} /> Orchestrator
                      </div>
                    )}
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {phase === "refining" && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-[13px] text-slate-400">
                    <span className="w-3 h-3 rounded-full border-2 border-fteal border-t-transparent animate-spin inline-block" />
                    AI fikrinizi değerlendiriyor…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Brief + dağıtım planı — sadece review'da */}
            {phase === "review" && refine && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <div className="glass p-5 mb-4 border-fteal/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] text-fteal font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={13} /> Yapılandırılmış Kampanya Brief'i
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-1",
                        refine.live
                          ? "text-fgreen-light border-fgreen/40 bg-fgreen/10"
                          : "text-slate-400 border-white/15 bg-white/[0.04]"
                      )}
                    >
                      <Cpu size={11} /> {refine.live ? "Canlı AI" : "Simülasyon"}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-3">{refine.brief.title}</div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                    {[
                      ["Amaç", refine.brief.objective],
                      ["Hedef Segment", refine.brief.segment],
                      ["Kanallar", refine.brief.channels],
                      ["Zamanlama", refine.brief.timing],
                    ].map(([k, v], i) => (
                      <div key={i}>
                        <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold mb-0.5">{k}</div>
                        <div className="text-slate-200 leading-snug">{v}</div>
                      </div>
                    ))}
                    <div className="col-span-2">
                      <div className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold mb-0.5">Başarı Ölçütü</div>
                      <div className="text-fgreen-light font-mono leading-snug">{refine.brief.kpi}</div>
                    </div>
                  </div>
                  {refine.suggestions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/[0.07]">
                      <div className="text-[10px] text-amber font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Lightbulb size={11} /> AI Önerileri — isterseniz aşağıdan talep edin
                      </div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {refine.suggestions.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-amber">▸</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Dağıtım planı */}
                <div className="glass p-5 mb-4">
                  <div className="text-[11px] text-fteal font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Route size={13} /> Dağıtım Planı — onayınızla şu departmanlara gidecek
                  </div>
                  <div className="space-y-2">
                    {refine.routing.map((r, i) => {
                      const Icon = DEPT_ICONS[r.department] ?? Users;
                      const color = DEPT_NODE_COLORS[r.department];
                      return (
                        <motion.div
                          key={r.department}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + i * 0.1 }}
                          className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                            style={{ backgroundColor: `${color}18`, borderColor: `${color}55` }}
                          >
                            <Icon size={15} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white">{r.department}</div>
                            <div className="text-[11px] text-slate-400 leading-snug">{r.reason}</div>
                          </div>
                          <span className={cn("shrink-0 text-[10px] font-bold border rounded-full px-2 py-0.5", PRIORITY_BADGE[r.priority])}>
                            {r.priority}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Revizyon girişi + onay */}
                <div className="glass p-2 mb-3 flex items-end gap-2">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        revise();
                      }
                    }}
                    rows={1}
                    placeholder="Değişiklik isteyin… (örn: hedef kitleyi 25-35 yaş yap, SMS'i de ekle)"
                    className="flex-1 bg-transparent resize-none outline-none text-slate-100 placeholder:text-slate-500 text-[13px] p-2.5"
                  />
                  <button
                    onClick={revise}
                    disabled={!feedback.trim()}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-fteal/40 text-fteal-light hover:bg-fteal/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={13} /> Revize Et
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setPhase("input");
                      setIdea("");
                      setChat([]);
                      setRefine(null);
                    }}
                    className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Vazgeç
                  </button>
                  <button
                    onClick={approve}
                    className="flex items-center gap-2 bg-gradient-to-r from-fteal to-fgreen text-navy-950 font-bold text-sm px-6 py-3 rounded-xl hover:shadow-glow-green transition-shadow"
                  >
                    <CheckCircle2 size={16} /> Onayla ve {refine.routing.length} Departmana Dağıt <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto text-center pt-6"
          >
            <div className="flex justify-center mb-2">
              <DiamondLogo size={56} />
            </div>
            <div className="text-xs text-fgreen-light font-semibold uppercase tracking-widest mb-2">
              ✓ Onaylandı — görevler departmanlara dağıtılıyor
            </div>
            <FlowLines routed={routedDepts} />
            <div className="mt-6 space-y-2">
              {analysisSteps.map((s, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: i === stepIndex ? 1 : 0.35 }}
                  className={cn(
                    "flex items-center justify-center gap-2 text-sm",
                    i === stepIndex ? "text-fteal-light" : "text-slate-500"
                  )}
                >
                  {i === stepIndex ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
                  ) : (
                    <CheckCircle2 size={14} className="opacity-60" />
                  )}
                  {s}
                </motion.div>
              ))}
            </div>
            <p className="mt-6 text-[11px] text-slate-500">
              AI yapılandırılmış karar çıktısı üretiyor — bu birkaç saniye sürebilir.
            </p>
          </motion.div>
        )}

        {phase === "results" && result && refine && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Onaylanan brief</div>
                <div className="text-lg font-semibold text-white">{refine.brief.title}</div>
                <p className="text-sm text-slate-400 mt-1">{result.summary}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-full px-2.5 py-1",
                  result.live
                    ? "text-fgreen-light border-fgreen/40 bg-fgreen/10"
                    : "text-slate-400 border-white/15 bg-white/[0.04]"
                )}
              >
                <Cpu size={11} />
                {result.live ? "Canlı AI analizi" : "Simülasyon modu"}
              </span>
            </div>

            {/* Dağıtılan departmanlar şeridi */}
            <div className="flex flex-wrap gap-2 mb-6">
              {refine.routing.map((r) => {
                const color = DEPT_NODE_COLORS[r.department];
                return (
                  <span
                    key={r.department}
                    className="flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-3 py-1.5"
                    style={{ color, borderColor: `${color}55`, backgroundColor: `${color}12` }}
                  >
                    <CheckCircle2 size={12} /> {r.department} · {r.priority}
                  </span>
                );
              })}
            </div>

            {/* Organizational memory banner */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass border-amber/30 bg-amber/[0.05] p-4 mb-6 flex gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-amber/15 border border-amber/40 flex items-center justify-center shrink-0">
                <BrainCircuit size={17} className="text-amber" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber mb-1">{result.memory.title}</div>
                <p className="text-[13px] text-slate-300 leading-relaxed">{result.memory.text}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.memory.refs.map((r, i) => (
                    <span key={i} className="text-[10px] font-mono text-amber/80 bg-amber/10 border border-amber/20 rounded-full px-2 py-0.5">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.cards.map((c, i) => (
                <DeptCardView key={c.department + i} card={c} index={i} onOpen={() => setOpenCard(c)} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex items-center justify-between mt-8"
            >
              <button
                onClick={() => {
                  setPhase("input");
                  setIdea("");
                  setChat([]);
                  setRefine(null);
                }}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Yeni fikir gir
              </button>
              {sent ? (
                <button
                  onClick={goToBoard}
                  className="flex items-center gap-2 bg-fgreen/15 border border-fgreen/40 text-fgreen-light font-semibold text-sm px-5 py-2.5 rounded-xl hover:shadow-glow-green transition-shadow"
                >
                  <CheckCircle2 size={15} /> Panoya eklendi — Görev Panosuna git <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={sendToBoard}
                  className="flex items-center gap-2 bg-gradient-to-r from-fteal to-fgreen text-navy-950 font-bold text-sm px-5 py-2.5 rounded-xl hover:shadow-glow-green transition-shadow"
                >
                  Görevleri Panoya Gönder <ArrowRight size={15} />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openCard && <DetailModal card={openCard} onClose={() => setOpenCard(null)} />}
      </AnimatePresence>
    </div>
  );
}
