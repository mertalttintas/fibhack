import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  Fingerprint,
  Layers3,
  LoaderCircle,
  MessagesSquare,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { statusColumns, type CampaignJob, type DeptCard, type DeptTask, type TaskStatus, type TraceEvent } from "../data/mock";
import { ProcessingTheater } from "../components/ProcessingTheater";
import { cn } from "../lib/utils";

const DEPARTMENTS = ["CRM", "Veri Platformları", "Legal", "Pazarlama"] as const;
const DEPT: Record<string, { color: string; soft: string; short: string; teams: string }> = {
  CRM: { color: "#53DBC3", soft: "rgba(83,219,195,.10)", short: "Müşteri & Segment", teams: "#crm-kampanyalar" },
  "Veri Platformları": { color: "#A7E052", soft: "rgba(167,224,82,.10)", short: "Veri & Ölçüm", teams: "#veri-platformlari" },
  Legal: { color: "#FFCC4D", soft: "rgba(255,204,77,.10)", short: "Uyum & Risk", teams: "#legal-uyum" },
  Pazarlama: { color: "#F47C98", soft: "rgba(244,124,152,.10)", short: "Kanal & İçerik", teams: "#pazarlama-kanal" },
};

const CAMPAIGN_STATE = {
  pending: { label: "Beklemede", color: "#FFCC4D" },
  processing: { label: "AI işliyor", color: "#53DBC3" },
  completed: { label: "Tamamlandı", color: "#A7E052" },
  error: { label: "Hata", color: "#F47C98" },
};

const PROVIDER: Record<string, string> = { openai: "OpenAI", claude: "Anthropic", gemini: "Gemini" };

function time(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function NeuralCore({ active }: { active: boolean }) {
  const nodes = [
    [18, 48], [34, 22], [35, 75], [52, 44], [66, 20], [69, 70], [84, 43],
  ];
  const links = [[0,1],[0,2],[0,3],[1,3],[1,4],[2,3],[2,5],[3,4],[3,5],[3,6],[4,6],[5,6]];
  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border border-fteal/15 bg-[#061426]">
      <div className={cn("absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(47,182,166,.16),transparent_45%)] transition-opacity", active ? "opacity-100" : "opacity-40")} />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        {links.map(([a,b], index) => <motion.line key={index} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#53DBC3" strokeWidth=".45" initial={false} animate={{ opacity: active ? [.12,.55,.12] : .1 }} transition={{ duration: 1.8, delay: index * .08, repeat: active ? Infinity : 0 }} />)}
        {nodes.map(([x,y], index) => <g key={index}><motion.circle cx={x} cy={y} r={index === 3 ? 4.2 : 2.2} fill={index === 3 ? "#A7E052" : "#53DBC3"} animate={active ? { r: index === 3 ? [3.4,5,3.4] : [1.7,2.8,1.7], opacity: [.55,1,.55] } : { opacity: .4 }} transition={{ duration: 1.5 + index * .09, repeat: active ? Infinity : 0 }} /><circle cx={x} cy={y} r={index === 3 ? 8 : 5} fill="none" stroke={index === 3 ? "#A7E052" : "#53DBC3"} strokeWidth=".35" opacity=".22" /></g>)}
      </svg>
      <div className="absolute inset-0 grid place-items-center"><div className="mt-1 rounded-full border border-fteal/25 bg-[#07192d]/85 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.18em] text-fteal-light backdrop-blur">{active ? "Neural orchestration active" : "AI core standby"}</div></div>
      {active && <motion.div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-fteal/60 to-transparent" animate={{ top: ["5%", "95%", "5%"] }} transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }} />}
    </div>
  );
}

function CampaignQueue({ campaigns, selectedId, onSelect, onNew }: { campaigns: CampaignJob[]; selectedId?: string; onSelect: (id: string) => void; onNew: () => void }) {
  return (
    <aside className="rounded-[22px] border border-white/[.07] bg-[#08172a]/85 p-3">
      <div className="flex items-center justify-between px-2 py-2"><div><div className="text-xs font-semibold text-white">Kampanya kuyruğu</div><div className="mt-1 text-[9px] text-slate-600">{campaigns.length} kayıt</div></div><button onClick={onNew} className="grid h-8 w-8 place-items-center rounded-lg border border-fteal/20 bg-fteal/[.06] text-fteal-light hover:bg-fteal/10"><Plus size={14} /></button></div>
      <div className="mt-2 space-y-2">
        {campaigns.map((campaign) => {
          const state = CAMPAIGN_STATE[campaign.status];
          const active = campaign.id === selectedId;
          return <button key={campaign.id} onClick={() => onSelect(campaign.id)} className={cn("w-full rounded-xl border p-3 text-left transition", active ? "border-fteal/30 bg-fteal/[.065]" : "border-white/[.055] bg-white/[.018] hover:border-white/[.12]")}><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider" style={{ color: state.color }}><span className={cn("h-1.5 w-1.5 rounded-full", campaign.status === "processing" && "animate-pulse")} style={{ background: state.color }} />{state.label}</span><span className="font-mono text-[8px] text-slate-700">{time(campaign.createdAt)}</span></div><div className="line-clamp-2 text-[11px] font-medium leading-[17px] text-slate-200">{campaign.title}</div><div className="mt-2 flex items-center justify-between gap-2">{campaign.provider ? <span className="flex items-center gap-1 text-[8px] text-slate-600"><Sparkles size={8} /> {PROVIDER[campaign.provider] ?? campaign.provider} · {campaign.model}</span> : <span />}{typeof campaign.score === "number" && <span className="shrink-0 rounded-md border border-fgreen/20 bg-fgreen/[.05] px-1.5 py-0.5 font-mono text-[8px] text-fgreen-light">skor {campaign.score}</span>}</div></button>;
        })}
        {campaigns.length === 0 && <div className="grid h-44 place-items-center rounded-xl border border-dashed border-white/[.07] px-5 text-center"><div><Target className="mx-auto mb-2 text-slate-700" size={20} /><div className="text-[10px] leading-4 text-slate-600">Henüz kampanya yok.<br />Yeni bir fikir oluşturun.</div></div></div>}
      </div>
    </aside>
  );
}

function PipelineRibbon({ events }: { events: TraceEvent[] }) {
  const stages = [
    ["intake", "Niyet"], ["segment", "Segment"], ["memory", "Benzerlik"], ["channels", "Kanal skoru"],
    ["rules", "Risk"], ["model", "AI sentez"], ["validation", "4/4 kontrol"], ["dispatch", "Dağıtım"],
  ];
  return <div className="grid grid-cols-4 gap-1.5 xl:grid-cols-8">{stages.map(([id, label], index) => { const event = events.find((item) => item.id === id); return <div key={id} className={cn("relative overflow-hidden rounded-xl border px-2 py-2.5 transition", event?.status === "done" ? "border-fgreen/18 bg-fgreen/[.035]" : event?.status === "running" ? "border-fteal/30 bg-fteal/[.07]" : "border-white/[.055] bg-white/[.015]")}><div className="mb-1 flex items-center justify-between"><span className="font-mono text-[7px] text-slate-700">0{index + 1}</span>{event?.status === "done" ? <Check size={8} className="text-fgreen-light" /> : event?.status === "running" ? <LoaderCircle size={8} className="animate-spin text-fteal" /> : <span className="h-1 w-1 rounded-full bg-slate-800" />}</div><div className={cn("truncate text-[8px] font-medium", event ? "text-slate-300" : "text-slate-700")}>{label}</div>{event?.status === "running" && <motion.div className="absolute inset-x-0 bottom-0 h-px bg-fteal" animate={{ opacity: [.25,1,.25] }} transition={{ duration: 1, repeat: Infinity }} />}</div>; })}</div>;
}

function Trace({ events, processing, selectedId, onSelect }: { events: TraceEvent[]; processing: boolean; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <div className="relative space-y-1.5">
      <div className="absolute bottom-4 left-[15px] top-4 w-px bg-gradient-to-b from-fteal/45 via-fteal/15 to-transparent" />
      <AnimatePresence initial={false}>
        {events.map((event) => <motion.button onClick={() => onSelect(event.id)} key={event.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={cn("relative flex w-full gap-3 rounded-xl border px-1.5 py-2 text-left transition", selectedId === event.id ? "border-fteal/20 bg-fteal/[.045]" : "border-transparent hover:bg-white/[.02]")}><div className={cn("relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-lg border bg-[#08172a]", event.status === "running" ? "border-fteal/35 text-fteal-light" : event.status === "error" ? "border-coral/35 text-coral" : "border-fgreen/25 text-fgreen-light")}>{event.status === "running" ? <LoaderCircle size={12} className="animate-spin" /> : event.status === "error" ? <AlertTriangle size={11} /> : <Check size={11} />}</div><div className="min-w-0 flex-1 pt-0.5"><div className="text-[11px] font-medium text-slate-200">{event.label}</div><div className="mt-0.5 line-clamp-2 text-[9px] leading-4 text-slate-600">{event.detail}</div></div>{typeof event.score === "number" && <span className="mt-1 shrink-0 rounded-md border border-white/[.07] px-1.5 py-0.5 font-mono text-[8px] text-slate-500">{event.score}/100</span>}</motion.button>)}
      </AnimatePresence>
      {events.length === 0 && <div className="py-8 text-center text-[10px] text-slate-700">İşlem başladığında doğrulanabilir sistem olayları burada akacak.</div>}
      {processing && <div className="ml-10 flex items-center gap-2 pt-1 text-[9px] text-fteal-light"><span className="flex gap-0.5">{[0,1,2].map((i) => <motion.span key={i} className="h-1 w-1 rounded-full bg-fteal" animate={{ opacity: [.2,1,.2] }} transition={{ duration: .9, delay: i*.16, repeat: Infinity }} />)}</span> Sonraki olay bekleniyor</div>}
    </div>
  );
}

function AlgorithmInspector({ event }: { event?: TraceEvent }) {
  if (!event) return <div className="mt-3 grid min-h-36 place-items-center rounded-xl border border-dashed border-white/[.06] text-[9px] text-slate-700">Bir analiz aşaması seçin</div>;
  return <motion.div key={event.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl border border-fteal/12 bg-gradient-to-br from-fteal/[.045] to-transparent p-3.5"><div className="flex items-start justify-between gap-3"><div><div className="text-[8px] font-semibold uppercase tracking-[.16em] text-fteal">Kullanılan algoritma</div><div className="mt-1 text-[11px] font-semibold text-slate-200">{event.algorithm ?? "Sistem işlemi"}</div></div>{typeof event.score === "number" && <div className="text-right"><div className="font-mono text-lg font-semibold text-white">{event.score}</div><div className="text-[7px] uppercase text-slate-700">skor</div></div>}</div>{event.why && <div className="mt-3 border-l border-fteal/25 pl-3"><div className="text-[8px] uppercase tracking-wider text-slate-600">Neden kullanıldı?</div><p className="mt-1 text-[9px] leading-4 text-slate-400">{event.why}</p></div>}<div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-white/[.05] bg-[#071426]/70 p-2.5"><div className="mb-1.5 text-[7px] font-semibold uppercase tracking-wider text-slate-700">Girdiler</div>{(event.inputs ?? []).map((item) => <div key={item} className="mt-1 flex gap-1.5 text-[8px] leading-3 text-slate-500"><span className="text-fteal">›</span>{item}</div>)}</div><div className="rounded-lg border border-white/[.05] bg-[#071426]/70 p-2.5"><div className="mb-1.5 text-[7px] font-semibold uppercase tracking-wider text-slate-700">Çıktılar</div>{(event.outputs ?? []).map((item) => <div key={item} className="mt-1 flex gap-1.5 text-[8px] leading-3 text-slate-500"><span className="text-fgreen-light">✓</span>{item}</div>)}</div></div></motion.div>;
}

function DepartmentTask({ task, onOpen }: { task: DeptTask; onOpen: () => void }) {
  const dept = DEPT[task.department];
  return <motion.button layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onOpen} className="group w-full rounded-xl border border-white/[.065] bg-[#09182b] p-3 text-left transition hover:border-white/[.15]"><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-wider text-fteal"><Bot size={8} /> Team-bot talebi</span>{task.ai ? <span className="flex items-center gap-1 rounded-full border border-fteal/15 px-1.5 py-0.5 text-[8px] text-fteal-light"><Sparkles size={7} /> AI</span> : <span className="text-[8px] text-slate-700">DEMO</span>}</div><div className="rounded-lg border border-white/[.04] bg-white/[.018] px-2.5 py-2 text-[9px] leading-4 text-slate-500"><span className="text-slate-300">{task.department} ekibi,</span> yeni kampanya için sizden aşağıdaki çalışma bekleniyor.</div><div className="mt-2.5 text-[11px] font-medium leading-[17px] text-slate-200">{task.title}</div><div className="mt-1.5 line-clamp-2 text-[9px] leading-4 text-slate-600">{task.summary}</div>{task.details?.dataSources?.length ? <div className="mt-2 text-[8px] text-slate-700">Talep edilen veri: <span className="text-slate-500">{task.details.dataSources.slice(0,2).join(" · ")}</span></div> : null}<div className="mt-2.5 flex items-center justify-between border-t border-white/[.05] pt-2"><span className="text-[8px]" style={{ color: dept.color }}>{task.status === "done" ? "Tamamlandı" : task.status === "assigned" ? "Departmanda" : task.status === "processing" ? "İşleniyor" : `${task.priority} öncelik`}</span><ChevronRight size={10} className="text-slate-700 transition group-hover:text-fteal-light" /></div></motion.button>;
}

function TaskDrawer({ task, onClose, onAdvance }: { task: DeptTask; onClose: () => void; onAdvance: () => void }) {
  const dept = DEPT[task.department];
  return <><button onClick={onClose} className="fixed inset-0 z-40 bg-[#020914]/75 backdrop-blur-sm" /><motion.aside initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} className="fixed bottom-0 right-0 top-0 z-50 w-[470px] overflow-y-auto border-l border-white/10 bg-[#071426]/[.98] p-6"><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-fteal-light"><Bot size={13} /> Team-bot departman paketi</div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400"><X size={14} /></button></div><div className="mb-3 inline-flex rounded-md px-2 py-1 text-[9px] font-bold uppercase" style={{ color: dept.color, background: dept.soft }}>{task.department}</div><div className="mb-4 rounded-xl border border-fteal/12 bg-fteal/[.035] p-3 text-[11px] leading-5 text-slate-400"><span className="font-semibold text-slate-200">Merhaba {task.department} ekibi.</span><br />Onaylanan kampanya için aşağıdaki ihtiyaç ve geliştirme paketi size yönlendirildi.</div><h2 className="text-xl font-semibold leading-7 text-white">{task.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{task.summary}</p>
    {task.ai && <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-fteal/15 bg-fteal/10"><div className="bg-[#09182b] p-3"><div className="text-[9px] text-slate-600">Sağlayıcı</div><div className="mt-1 text-xs text-fteal-light">{PROVIDER[task.ai.provider] ?? task.ai.provider}</div></div><div className="bg-[#09182b] p-3"><div className="text-[9px] text-slate-600">Model</div><div className="mt-1 text-xs text-slate-200">{task.ai.model}</div></div></div>}
    <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><BrainCircuit size={12} /> Karar gerekçesi</div><p className="text-[13px] leading-6 text-slate-200">{task.rationale}</p></div>
    {task.details && <><div className="mt-6"><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><Database size={12} /> Kullanılan kaynaklar</div><div className="flex flex-wrap gap-2">{task.details.dataSources.map((source) => <span key={source} className="rounded-full border border-white/[.08] bg-white/[.025] px-2.5 py-1 text-[9px] text-slate-400">{source}</span>)}</div></div><div className="mt-6"><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><Layers3 size={12} /> Alt görevler</div><div className="space-y-2">{task.details.subtasks.map((subtask) => <div key={subtask.name} className="rounded-xl border border-white/[.06] p-3"><div className="flex justify-between gap-3 text-[11px]"><span className="text-slate-200">{subtask.name}</span><span className="shrink-0 font-mono text-[9px] text-fteal-light">{subtask.eta}</span></div><div className="mt-1.5 text-[9px] text-slate-600">{subtask.owner} · {subtask.status}</div></div>)}</div></div><div className="mt-6 rounded-2xl border border-amber/20 bg-amber/[.04] p-4"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber"><Scale size={12} /> Risk & insan denetimi</div><p className="text-xs leading-5 text-slate-400">{task.details.risk}</p></div></>}
    {task.status !== "done" && <button onClick={onAdvance} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fteal to-fgreen py-3 text-sm font-bold text-[#061426]">Onayla ve ilerlet <ArrowRight size={14} /></button>}
    <button disabled className="mt-2.5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#6264A7]/30 bg-[#6264A7]/[.08] py-2.5 text-xs font-semibold text-[#B4B8F5] opacity-80"><MessagesSquare size={13} /> {DEPT[task.department].teams} kanalına gönder <span className="rounded-full border border-[#9EA2F0]/35 px-1.5 py-0.5 text-[7px] uppercase tracking-wider">Yakında</span></button>
  </motion.aside></>;
}

type ProcessResult = { summary: string; provider: string; model: string; analyzedAt: string; memory: { refs: string[] }; cards: DeptCard[] };

export function TaskBoard({ tasks, campaigns, onAdvance, onUpdateCampaign, onCompleteCampaign, onNewCampaign }: {
  tasks: DeptTask[];
  campaigns: CampaignJob[];
  onAdvance: (id: string) => void;
  onUpdateCampaign: (id: string, patch: Partial<CampaignJob>) => void;
  onCompleteCampaign: (id: string, result: ProcessResult & { trace: TraceEvent[] }) => void;
  onNewCampaign: () => void;
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>();
  const [selectedTask, setSelectedTask] = useState<DeptTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [theater, setTheater] = useState<"live" | "replay" | null>(null);
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string>();
  const traceRef = useRef<TraceEvent[]>([]);
  const active = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0];

  useEffect(() => {
    if (!selectedCampaignId && campaigns[0]) setSelectedCampaignId(campaigns[0].id);
  }, [campaigns, selectedCampaignId]);

  useEffect(() => {
    traceRef.current = active?.trace ?? [];
    setTrace(active?.trace ?? []);
    setSelectedTraceId(active?.trace?.[active.trace.length - 1]?.id);
  }, [active?.id]);

  const processCampaign = async (campaign: CampaignJob) => {
    traceRef.current = [];
    setTrace([]);
    setTheater("live");
    onUpdateCampaign(campaign.id, { status: "processing", trace: [] });
    try {
      const approvedBrief = `${campaign.brief.title}\nAmaç: ${campaign.brief.objective}\nHedef segment: ${campaign.brief.segment}\nKanallar: ${campaign.brief.channels}\nZamanlama: ${campaign.brief.timing}\nKPI: ${campaign.brief.kpi}`;
      const response = await fetch("/api/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: approvedBrief }) });
      if (!response.ok || !response.body) throw new Error(`api_${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result: ProcessResult | undefined;
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";
        for (const block of blocks) {
          const event = block.split("\n").find((line) => line.startsWith("event:"))?.slice(6).trim();
          const raw = block.split("\n").find((line) => line.startsWith("data:"))?.slice(5).trim();
          if (!event || !raw) continue;
          const data = JSON.parse(raw);
          if (event === "stage") {
            const next = [...traceRef.current];
            const index = next.findIndex((item) => item.id === data.id);
            if (index >= 0) next[index] = data; else next.push(data);
            traceRef.current = next;
            setTrace(next);
            setSelectedTraceId(data.id);
          } else if (event === "completed") result = data;
          else if (event === "failed") throw new Error(data.message ?? "process_failed");
        }
        if (done) break;
      }
      if (!result) throw new Error("missing_result");
      onCompleteCampaign(campaign.id, { ...result, trace: traceRef.current });
    } catch {
      const failed: TraceEvent = { id: "error", label: "İşlem tamamlanamadı", detail: "API veya model yanıtı kesildi. Yeniden deneyebilirsiniz.", status: "error", timestamp: new Date().toISOString() };
      const next = [...traceRef.current, failed];
      traceRef.current = next;
      setTrace(next);
      onUpdateCampaign(campaign.id, { status: "error", trace: next });
    }
  };

  const departmentTasks = useMemo(() => Object.fromEntries(DEPARTMENTS.map((department) => [department, tasks.filter((task) => task.department === department)])), [tasks]);
  const selectedTrace = trace.find((event) => event.id === selectedTraceId) ?? trace[trace.length - 1];

  return (
    <div className="mission-bg min-h-screen px-6 py-6 xl:px-8">
      <header className="mb-5 flex items-center justify-between"><div><div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.23em] text-fteal"><CircleDot size={10} /> AI operasyon merkezi</div><h1 className="text-[27px] font-semibold tracking-[-.03em] text-white">Kampanya görev orkestrasyonu</h1><p className="mt-1 text-xs text-slate-500">Kuyruğa alın, AI işlem hattını başlatın, dört departmana dağıtımı canlı izleyin.</p></div><button onClick={onNewCampaign} className="flex items-center gap-2 rounded-xl border border-fteal/25 bg-fteal/[.07] px-4 py-2.5 text-[11px] font-semibold text-fteal-light hover:bg-fteal/10"><Plus size={13} /> Yeni kampanya</button></header>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <CampaignQueue campaigns={campaigns} selectedId={active?.id} onSelect={setSelectedCampaignId} onNew={onNewCampaign} />
        <section className="rounded-[22px] border border-fteal/15 bg-[#08172a]/85 p-5">
          {!active ? <div className="grid min-h-[420px] place-items-center text-center"><div><BrainCircuit className="mx-auto mb-3 text-slate-700" size={30} /><div className="text-sm font-medium text-slate-300">İşlenecek kampanya bulunmuyor</div><button onClick={onNewCampaign} className="mt-4 rounded-xl bg-fteal/10 px-4 py-2 text-xs text-fteal-light">Kampanya oluştur</button></div></div> : <div className="space-y-4"><PipelineRibbon events={trace} /><div className="grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
            <div><div className="mb-4 flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: CAMPAIGN_STATE[active.status].color }}>{CAMPAIGN_STATE[active.status].label}</span>{typeof active.score === "number" && <span className="rounded-md border border-fgreen/20 bg-fgreen/[.05] px-1.5 py-0.5 font-mono text-[8px] text-fgreen-light">başarı skoru {active.score}/100</span>}</div><h2 className="mt-2 text-xl font-semibold leading-7 text-white">{active.title}</h2><p className="mt-2 text-[10px] leading-5 text-slate-500">{active.brief.objective}</p></div></div><div className="mb-3 grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/[.055] bg-white/[.02] p-2.5"><div className="text-[7px] uppercase tracking-wider text-slate-700">Hedef segment</div><div className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-400">{active.brief.segment}</div></div><div className="rounded-xl border border-white/[.055] bg-white/[.02] p-2.5"><div className="text-[7px] uppercase tracking-wider text-slate-700">Başarı ölçütü</div><div className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-400">{active.brief.kpi}</div></div></div><NeuralCore active={active.status === "processing"} />
              {active.status === "pending" && <button onClick={() => processCampaign(active)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fteal to-fgreen py-3 text-sm font-bold text-[#061426] shadow-glow-teal-sm"><Zap size={15} /> AI ile işle</button>}
              {active.status === "error" && <button onClick={() => processCampaign(active)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-coral/25 bg-coral/[.06] py-3 text-sm font-semibold text-coral"><RotateCcw size={14} /> Yeniden dene</button>}
              {active.status === "processing" && <button onClick={() => setTheater("live")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-fteal/15 bg-fteal/[.045] py-3 text-xs text-fteal-light transition hover:bg-fteal/[.09]"><LoaderCircle size={14} className="animate-spin" /> Karar motoru çalışıyor — canlı izle</button>}
              {active.status === "completed" && <div className="mt-4 rounded-xl border border-fgreen/15 bg-fgreen/[.045] p-3"><div className="flex items-center gap-2 text-[10px] font-semibold text-fgreen-light"><ShieldCheck size={12} /> 4 departmana dağıtıldı</div><p className="mt-1.5 text-[10px] leading-4 text-slate-500">{active.summary}</p><div className="mt-2 flex items-center justify-between"><span className="font-mono text-[8px] text-slate-700">{PROVIDER[active.provider ?? ""] ?? active.provider} · {active.model}</span>{active.trace.length > 0 && <button onClick={() => setTheater("replay")} className="flex items-center gap-1 rounded-md border border-fteal/25 bg-fteal/[.06] px-2 py-1 text-[9px] font-semibold text-fteal-light transition hover:bg-fteal/10"><Zap size={9} /> Analiz akışını izle</button>}</div></div>}
            </div>
            <div className="grid gap-3 lg:grid-cols-[.9fr_1.1fr]"><div className="max-h-[430px] overflow-y-auto rounded-2xl border border-white/[.06] bg-[#061426]/80 p-3"><div className="mb-3 flex items-center justify-between border-b border-white/[.06] pb-3"><div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400"><BrainCircuit size={12} className="text-fteal" /> Canlı akış</div><span className="font-mono text-[7px] text-slate-700">SSE TRACE</span></div><Trace events={trace} processing={active.status === "processing"} selectedId={selectedTraceId} onSelect={setSelectedTraceId} /></div><div><div className="flex items-center gap-2 px-1 text-[8px] font-semibold uppercase tracking-[.16em] text-slate-600"><Fingerprint size={10} /> Açıklanabilir karar detayı</div><AlgorithmInspector event={selectedTrace} /></div></div>
          </div></div>}
        </section>
      </div>

      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div><div className="flex items-center gap-2 text-sm font-semibold text-white"><Layers3 size={14} className="text-fteal" /> Departman görevleri</div><p className="mt-1 text-[10px] text-slate-600">AI tamamlandığında her departman için ayrı görev kartı oluşur.</p></div>
          <div className="flex flex-wrap items-center gap-1.5">{([{ key: "all" as const, label: "Tümü" }, ...statusColumns] as { key: TaskStatus | "all"; label: string }[]).map((chip) => { const count = chip.key === "all" ? tasks.length : tasks.filter((task) => task.status === chip.key).length; return <button key={chip.key} onClick={() => setStatusFilter(chip.key)} className={cn("rounded-full border px-2.5 py-1 text-[9px] transition", statusFilter === chip.key ? "border-fteal/30 bg-fteal/[.08] text-fteal-light" : "border-white/[.07] text-slate-600 hover:border-white/[.14] hover:text-slate-400")}>{chip.label} <span className="font-mono text-[8px] opacity-70">{count}</span></button>; })}</div>
        </div>
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#6264A7]/25 bg-[#6264A7]/[.07] px-3 py-2 text-[9px] leading-4 text-slate-500"><MessagesSquare size={13} className="shrink-0 text-[#9EA2F0]" /><span><span className="font-semibold text-[#B4B8F5]">Microsoft Teams botu · Yakında</span> — görev paketleri departmanların Teams kanallarına otomatik iletilecek, durum güncellemeleri bu panoya geri düşecek.</span></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{DEPARTMENTS.map((department) => { const dept = DEPT[department]; const all = departmentTasks[department] ?? []; const items = statusFilter === "all" ? all : all.filter((task) => task.status === statusFilter); const done = all.filter((task) => task.status === "done").length; return <div key={department} className="min-h-[300px] rounded-[20px] border border-white/[.065] bg-white/[.012] p-3" style={{ borderTopColor: `${dept.color}55` }}><div className="mb-2 flex items-center gap-3 rounded-xl p-2" style={{ background: dept.soft }}><div className="grid h-8 w-8 place-items-center rounded-lg border" style={{ borderColor: `${dept.color}44`, color: dept.color }}><span className="font-mono text-[10px] font-bold">{String(all.length).padStart(2,"0")}</span></div><div className="min-w-0"><div className="text-[11px] font-semibold text-slate-200">{department}</div><div className="mt-0.5 truncate text-[8px] text-slate-600">{dept.short} · <span className="text-[#9EA2F0]">{dept.teams}</span></div></div></div><div className="mb-3 px-1"><div className="flex items-center justify-between text-[7px] uppercase tracking-wider text-slate-700"><span>Tamamlanma</span><span className="font-mono">{done}/{all.length}</span></div><div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full transition-all" style={{ width: `${all.length ? Math.round((done / all.length) * 100) : 0}%`, background: dept.color }} /></div></div><div className="space-y-2.5"><AnimatePresence>{items.map((task) => <DepartmentTask key={task.id} task={task} onOpen={() => setSelectedTask(task)} />)}</AnimatePresence>{items.length === 0 && <div className="grid h-24 place-items-center rounded-xl border border-dashed border-white/[.06] px-3 text-center text-[8px] uppercase tracking-wider text-slate-700">{statusFilter === "all" ? "Görev bekleniyor" : "Bu durumda görev yok"}</div>}</div></div>; })}</div>
      </section>
      <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-slate-700"><ShieldCheck size={10} /> Gizli düşünce zinciri değil; gerçek sistem olayları, kaynaklar ve kullanıcıya açık karar gerekçeleri gösterilir.</div>
      <AnimatePresence>{selectedTask && <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} onAdvance={() => { onAdvance(selectedTask.id); setSelectedTask(null); }} />}</AnimatePresence>
      <AnimatePresence>{theater && active && <ProcessingTheater title={active.title} events={trace} status={active.status} mode={theater} onClose={() => setTheater(null)} />}</AnimatePresence>
    </div>
  );
}
