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
  Handshake,
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
import { addOutcome, addPastCampaign, buildLivePastCampaign, loadOutcomes, localDraft, statusColumns, type CampaignJob, type CampaignOutcome, type DeptCard, type DeptDraft, type DeptTask, type TaskStatus, type TraceEvent } from "../data/mock";
import { ProcessingTheater } from "../components/ProcessingTheater";
import { cn } from "../lib/utils";

const DEPARTMENTS = ["CRM", "Veri Platformları", "Legal", "Pazarlama"] as const;
const DEPT: Record<string, { color: string; soft: string; short: string; teams: string }> = {
  CRM: { color: "#0069B4", soft: "rgba(0,105,180,.10)", short: "Müşteri & Segment", teams: "#crm-kampanyalar" },
  "Veri Platformları": { color: "#7AB929", soft: "rgba(122,185,41,.10)", short: "Veri & Ölçüm", teams: "#veri-platformlari" },
  Legal: { color: "#DFA400", soft: "rgba(223,164,0,.10)", short: "Uyum & Risk", teams: "#legal-uyum" },
  Pazarlama: { color: "#E05C7E", soft: "rgba(224,92,126,.10)", short: "Kanal & İçerik", teams: "#pazarlama-kanal" },
};

const CAMPAIGN_STATE = {
  pending: { label: "Beklemede", color: "#DFA400" },
  processing: { label: "AI işliyor", color: "#0069B4" },
  completed: { label: "Tamamlandı", color: "#7AB929" },
  error: { label: "Hata", color: "#E05C7E" },
};

const PROVIDER: Record<string, string> = { openai: "OpenAI", claude: "Anthropic", gemini: "Gemini" };

function time(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

const SUMMARY_STAGES: { id: string; label: string }[] = [
  { id: "signals", label: "Talep momentumu" },
  { id: "memory", label: "En yakın geçmiş kampanya" },
  { id: "channels", label: "Kanal önerisi" },
  { id: "timing", label: "Lansman penceresi" },
  { id: "rules", label: "Mevzuat kontrolü" },
];

function AnalysisSummary({ trace, processing, onOpenTheater }: { trace: TraceEvent[]; processing: boolean; onOpenTheater: () => void }) {
  const rows = SUMMARY_STAGES.map(({ id, label }) => ({ id, label, event: trace.find((event) => event.id === id) }));
  const hasAny = trace.length > 0;
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#0d2b45]/[.3] bg-[#ffffff]/70 p-4">
      <div className="mb-3 flex items-center justify-between border-b border-[#0d2b45]/[.3] pb-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500"><BrainCircuit size={13} className="text-fteal" /> Analiz özeti</div>
        {hasAny && <button onClick={onOpenTheater} className="flex items-center gap-1.5 rounded-lg border border-fteal/25 bg-fteal/[.06] px-2.5 py-1.5 text-[10px] font-semibold text-fteal-light transition hover:bg-fteal/10"><Zap size={11} /> Akışı izle</button>}
      </div>
      {!hasAny ? (
        <div className="grid flex-1 place-items-center py-10 text-center text-[11px] leading-5 text-slate-500">"AI ile işle" başlatıldığında<br />analiz bulguları burada özetlenir.</div>
      ) : (
        <div className="space-y-2">
          {rows.map(({ id, label, event }) => (
            <div key={id} className={cn("flex items-start gap-3 rounded-xl border p-3", event ? "border-[#0d2b45]/[.3] bg-[#0d2b45]/[.015]" : "border-dashed border-[#0d2b45]/[.3] opacity-50")}>
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-fgreen/25 bg-fgreen/[.06]">{event ? <Check size={11} className="text-fgreen-light" /> : <LoaderCircle size={11} className={cn("text-slate-400", processing && "animate-spin")} />}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-slate-700">{label}</div>
                <div className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-500">{event ? event.detail : "Hesaplanıyor…"}</div>
              </div>
              {typeof event?.score === "number" && <span className="shrink-0 rounded-md border border-fteal/20 bg-fteal/[.05] px-1.5 py-0.5 font-mono text-[9px] text-fteal-light">{event.score}</span>}
            </div>
          ))}
          {processing && <div className="flex items-center gap-2 px-1 pt-1 text-[10px] text-fteal-light"><LoaderCircle size={11} className="animate-spin" /> Analiz sürüyor — tüm aşamalar için "Akışı izle"</div>}
        </div>
      )}
    </div>
  );
}

// İş etkisi şeridi: sunumdaki kazanım rakamlarını panoda canlı gösterir.
// Kaynak varsayımlar: manuel süreç 12-15 gün ve ~80 kişi-saat; orkestre süreç
// 3-4 gün — kampanya başına ~56 kişi-saat koordinasyon tasarrufu.
function ImpactStrip({ completedCount, memoryCount }: { completedCount: number; memoryCount: number }) {
  const tiles = [
    { icon: Zap, label: "Time-to-market", value: "3-4 gün", sub: "manuel süreçte 12-15 gün · ~%75 kısalma" },
    { icon: Clock3, label: "Koordinasyon tasarrufu", value: `${completedCount * 56} kişi-saat`, sub: `kampanya başına ~56 saat · ${completedCount} kampanya işlendi` },
    { icon: MessagesSquare, label: "Koordinasyon maili", value: "0", sub: "dağıtım Team-bot kartlarıyla — mail zinciri yok" },
    { icon: BrainCircuit, label: "Kurumsal hafıza", value: `${memoryCount} kayıt`, sub: "her kampanya sonucu havuza işleniyor" },
  ];
  return (
    <div className="mb-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      {tiles.map(({ icon: Icon, label, value, sub }) => (
        <div key={label} className="rounded-2xl border border-[#0d2b45]/[.18] bg-[#ffffff]/90 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500"><Icon size={11} className="text-fteal" /> {label}</div>
          <div className="mt-1.5 font-mono text-lg font-semibold tracking-tight text-[#0d2b45] [font-variant-numeric:tabular-nums]">{value}</div>
          <div className="mt-0.5 text-[9px] leading-4 text-slate-500">{sub}</div>
        </div>
      ))}
    </div>
  );
}

// Tamamlanan kampanyanın gerçekleşen sonuçlarını hafızaya işleyen form
function OutcomeForm({ campaign, onSave }: { campaign: CampaignJob; onSave: (outcome: CampaignOutcome) => void }) {
  const [openRate, setOpenRate] = useState("");
  const [conversion, setConversion] = useState("");
  const [channel, setChannel] = useState("Push");
  const [lesson, setLesson] = useState("");
  const valid = openRate.trim() !== "" && conversion.trim() !== "" && lesson.trim().length >= 10;
  return (
    <div className="mt-3 rounded-xl border border-fteal/20 bg-fteal/[.03] p-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-fteal-light"><BrainCircuit size={12} /> Sonuçları gir — hafıza öğrensin</div>
      <p className="mt-1 text-[9px] leading-4 text-slate-500">Gerçekleşen metrikler kurumsal hafızaya işlenir ve bir sonraki kampanyanın benzerlik analizinde referans olarak kullanılır.</p>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <label className="block"><span className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">Açılma %</span><input value={openRate} onChange={(e) => setOpenRate(e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="decimal" placeholder="42" className="mt-1 w-full rounded-lg border border-[#0d2b45]/[.18] bg-[#ffffff] px-2 py-1.5 font-mono text-[11px] text-slate-800 outline-none focus:border-fteal/40" /></label>
        <label className="block"><span className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">Dönüşüm %</span><input value={conversion} onChange={(e) => setConversion(e.target.value.replace(/[^0-9.,]/g, ""))} inputMode="decimal" placeholder="7.1" className="mt-1 w-full rounded-lg border border-[#0d2b45]/[.18] bg-[#ffffff] px-2 py-1.5 font-mono text-[11px] text-slate-800 outline-none focus:border-fteal/40" /></label>
        <label className="block"><span className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">Ana kanal</span><select value={channel} onChange={(e) => setChannel(e.target.value)} className="mt-1 w-full rounded-lg border border-[#0d2b45]/[.18] bg-[#ffffff] px-2 py-1.5 text-[11px] text-slate-800 outline-none focus:border-fteal/40">{["Push", "In-app", "SMS", "Mobil Banner", "E-posta"].map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <label className="mt-2 block"><span className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">Öğrenilen ders</span><textarea value={lesson} onChange={(e) => setLesson(e.target.value)} rows={2} placeholder="Örn: In-app story genç segmentte push'tan iyi performans gösterdi; SMS düşük kaldı." className="mt-1 w-full resize-none rounded-lg border border-[#0d2b45]/[.18] bg-[#ffffff] px-2 py-1.5 text-[10px] leading-4 text-slate-800 outline-none placeholder:text-slate-400 focus:border-fteal/40" /></label>
      <button
        disabled={!valid}
        onClick={() => onSave({
          name: campaign.title,
          channel,
          openRate: Number(openRate.replace(",", ".")) || 0,
          conversion: Number(conversion.replace(",", ".")) || 0,
          lesson: lesson.trim(),
          recordedAt: new Date().toISOString(),
        })}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fteal to-fgreen py-2 text-[11px] font-bold text-[#ffffff] disabled:opacity-40"
      >
        <Check size={12} /> Hafızaya işle
      </button>
    </div>
  );
}

function CampaignQueue({ campaigns, selectedId, onSelect, onNew }: { campaigns: CampaignJob[]; selectedId?: string; onSelect: (id: string) => void; onNew: () => void }) {
  return (
    <aside className="rounded-[22px] border border-[#0d2b45]/[.3] bg-[#ffffff]/85 p-3">
      <div className="flex items-center justify-between px-2 py-2"><div><div className="text-xs font-semibold text-[#0d2b45]">Kampanya kuyruğu</div><div className="mt-1 text-[9px] text-slate-500">{campaigns.length} kayıt</div></div><button onClick={onNew} className="grid h-8 w-8 place-items-center rounded-lg border border-fteal/20 bg-fteal/[.06] text-fteal-light hover:bg-fteal/10"><Plus size={14} /></button></div>
      <div className="mt-2 space-y-2">
        {campaigns.map((campaign) => {
          const state = CAMPAIGN_STATE[campaign.status];
          const active = campaign.id === selectedId;
          return <button key={campaign.id} onClick={() => onSelect(campaign.id)} className={cn("w-full rounded-xl border p-3 text-left transition", active ? "border-fteal/30 bg-fteal/[.065]" : "border-[#0d2b45]/[.3] bg-[#0d2b45]/[.018] hover:border-[#0d2b45]/[.3]")}><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider" style={{ color: state.color }}><span className={cn("h-1.5 w-1.5 rounded-full", campaign.status === "processing" && "animate-pulse")} style={{ background: state.color }} />{state.label}</span><span className="font-mono text-[8px] text-slate-400">{time(campaign.createdAt)}</span></div><div className="line-clamp-2 text-[11px] font-medium leading-[17px] text-slate-800">{campaign.title}</div><div className="mt-2 flex items-center justify-between gap-2">{campaign.provider ? <span className="flex items-center gap-1 text-[8px] text-slate-500"><Sparkles size={8} /> {PROVIDER[campaign.provider] ?? campaign.provider} · {campaign.model}</span> : <span />}{typeof campaign.score === "number" && <span className="shrink-0 rounded-md border border-fgreen/20 bg-fgreen/[.05] px-1.5 py-0.5 font-mono text-[8px] text-fgreen-light">skor {campaign.score}</span>}</div></button>;
        })}
        {campaigns.length === 0 && <div className="grid h-44 place-items-center rounded-xl border border-dashed border-[#0d2b45]/[.3] px-5 text-center"><div><Target className="mx-auto mb-2 text-slate-400" size={20} /><div className="text-[10px] leading-4 text-slate-500">Henüz kampanya yok.<br />Yeni bir fikir oluşturun.</div></div></div>}
      </div>
    </aside>
  );
}

function PipelineRibbon({ events }: { events: TraceEvent[] }) {
  const stages = [
    ["intake", "Niyet"], ["segment", "Segment"], ["signals", "Talep sinyali"], ["memory", "Benzerlik"], ["channels", "Kanal skoru"],
    ["timing", "Zamanlama"], ["rules", "Risk"], ["model", "AI sentez"], ["validation", "4/4 kontrol"], ["dispatch", "Dağıtım"],
  ];
  return <div className="grid grid-cols-5 gap-1.5 xl:grid-cols-10">{stages.map(([id, label], index) => { const event = events.find((item) => item.id === id); return <div key={id} className={cn("relative overflow-hidden rounded-xl border px-2 py-2.5 transition", event?.status === "done" ? "border-fgreen/18 bg-fgreen/[.035]" : event?.status === "running" ? "border-fteal/30 bg-fteal/[.07]" : "border-[#0d2b45]/[.3] bg-[#0d2b45]/[.015]")}><div className="mb-1 flex items-center justify-between"><span className="font-mono text-[7px] text-slate-400">{String(index + 1).padStart(2, "0")}</span>{event?.status === "done" ? <Check size={8} className="text-fgreen-light" /> : event?.status === "running" ? <LoaderCircle size={8} className="animate-spin text-fteal" /> : <span className="h-1 w-1 rounded-full bg-slate-300" />}</div><div className={cn("truncate text-[8px] font-medium", event ? "text-slate-700" : "text-slate-400")}>{label}</div>{event?.status === "running" && <motion.div className="absolute inset-x-0 bottom-0 h-px bg-fteal" animate={{ opacity: [.25,1,.25] }} transition={{ duration: 1, repeat: Infinity }} />}</div>; })}</div>;
}

function DepartmentTask({ task, onOpen, onPrepare }: { task: DeptTask; onOpen: () => void; onPrepare: () => void }) {
  const dept = DEPT[task.department];
  return <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={onOpen} className={cn("group w-full cursor-pointer rounded-xl border bg-[#ffffff] p-3 text-left transition hover:border-[#0d2b45]/[.3]", task.status === "processing" ? "border-fteal/30" : "border-[#0d2b45]/[.3]")}><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-wider text-fteal"><Bot size={8} /> Team-bot talebi</span><span className="flex items-center gap-1.5">{task.teams && <MessagesSquare size={9} className={task.teams.delivered ? "text-fgreen-light" : "text-[#5B5EA8]"} />}{task.ai ? <span className="flex items-center gap-1 rounded-full border border-fteal/15 px-1.5 py-0.5 text-[8px] text-fteal-light"><Sparkles size={7} /> AI</span> : <span className="text-[8px] text-slate-400">DEMO</span>}</span></div><div className="rounded-lg border border-[#0d2b45]/[.3] bg-[#0d2b45]/[.018] px-2.5 py-2 text-[9px] leading-4 text-slate-500"><span className="text-slate-700">{task.department} ekibi,</span> yeni kampanya için sizden aşağıdaki çalışma bekleniyor.</div><div className="mt-2.5 text-[11px] font-medium leading-[17px] text-slate-800">{task.title}</div><div className="mt-1.5 line-clamp-2 text-[9px] leading-4 text-slate-500">{task.summary}</div>{task.details?.dataSources?.length ? <div className="mt-2 text-[8px] text-slate-400">Talep edilen veri: <span className="text-slate-500">{task.details.dataSources.slice(0,2).join(" · ")}</span></div> : null}<div className="mt-2.5 flex items-center justify-between border-t border-[#0d2b45]/[.3] pt-2">{task.status === "waiting" ? <button onClick={(event) => { event.stopPropagation(); onPrepare(); }} className="flex items-center gap-1 rounded-md border border-fteal/25 bg-fteal/[.07] px-2 py-1 text-[8px] font-semibold text-fteal-light transition hover:bg-fteal/[.13]"><Sparkles size={8} /> AI'ya hazırlat</button> : task.status === "processing" ? <span className="flex items-center gap-1.5 text-[8px] text-fteal-light"><LoaderCircle size={9} className="animate-spin" /> AI taslak hazırlıyor…</span> : <span className="text-[8px]" style={{ color: dept.color }}>{task.status === "done" ? "Tamamlandı" : task.draft ? "Departmanda · AI taslağı hazır" : "Departmanda"}</span>}<ChevronRight size={10} className="text-slate-400 transition group-hover:text-fteal-light" /></div>{task.status === "processing" && <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-[#0d2b45]/[.05]"><motion.div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-fteal to-transparent" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} /></div>}</motion.div>;
}

function TaskDrawer({ task, onClose, onAdvance, onPrepare, onSendTeams, sendingTeams, onSendDependency, sendingDepKey }: { task: DeptTask; onClose: () => void; onAdvance: () => void; onPrepare: () => void; onSendTeams: () => void; sendingTeams: boolean; onSendDependency: (index: number) => void; sendingDepKey: string | null }) {
  const dept = DEPT[task.department];
  return <><button onClick={onClose} className="fixed inset-0 z-40 bg-[#10304f]/75 backdrop-blur-sm" /><motion.aside initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} className="fixed bottom-0 right-0 top-0 z-50 w-[470px] overflow-y-auto border-l border-[#0d2b45]/25 bg-[#ffffff]/[.98] p-6"><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-fteal-light"><img src="/rabbit-face.png" alt="Team-bot" className="h-6 w-6 rounded-lg border border-fteal/25 object-cover" /> Team-bot departman paketi</div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-[#0d2b45]/25 text-slate-600"><X size={14} /></button></div><div className="mb-3 inline-flex rounded-md px-2 py-1 text-[9px] font-bold uppercase" style={{ color: dept.color, background: dept.soft }}>{task.department}</div><div className="mb-4 rounded-xl border border-fteal/12 bg-fteal/[.035] p-3 text-[11px] leading-5 text-slate-600"><span className="font-semibold text-slate-800">Merhaba {task.department} ekibi.</span><br />Onaylanan kampanya için aşağıdaki ihtiyaç ve geliştirme paketi size yönlendirildi.</div><h2 className="text-xl font-semibold leading-7 text-[#0d2b45]">{task.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{task.summary}</p>
    {task.ai && <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-fteal/15 bg-fteal/10"><div className="bg-[#ffffff] p-3"><div className="text-[9px] text-slate-500">Sağlayıcı</div><div className="mt-1 text-xs text-fteal-light">{PROVIDER[task.ai.provider] ?? task.ai.provider}</div></div><div className="bg-[#ffffff] p-3"><div className="text-[9px] text-slate-500">Model</div><div className="mt-1 text-xs text-slate-800">{task.ai.model}</div></div></div>}
    <div className="mt-5 rounded-2xl border border-[#0d2b45]/[.3] bg-[#0d2b45]/[.025] p-4"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600"><BrainCircuit size={12} /> Karar gerekçesi</div><p className="text-[13px] leading-6 text-slate-800">{task.rationale}</p></div>
    {task.status === "processing" && <div className="mt-5 rounded-2xl border border-fteal/20 bg-fteal/[.04] p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-fteal-light"><LoaderCircle size={12} className="animate-spin" /> AI ön çalışması hazırlanıyor</div><p className="mt-2 text-[10px] leading-4 text-slate-500">Departmanın işini başlatan taslak paket üretiliyor — metin varyantları, filtre kriterleri veya kontrol listesi birazdan burada olacak.</p><div className="mt-3 h-0.5 overflow-hidden rounded-full bg-[#0d2b45]/[.05]"><motion.div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-fteal to-transparent" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} /></div></div>}
    {task.draft && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-fteal/20 bg-fteal/[.04] p-4">
      <div className="mb-2 flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-fteal-light"><Sparkles size={12} /> AI ön çalışması</div><span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[8px]", task.draft.source === "ai" ? "border-fgreen/25 bg-fgreen/[.06] text-fgreen-light" : "border-[#0d2b45]/[.3] text-slate-500")}>{task.draft.source === "ai" ? `${PROVIDER[task.draft.provider ?? ""] ?? task.draft.provider} · ${task.draft.model}` : "Şablon taslak"}</span></div>
      <div className="text-xs font-semibold leading-5 text-slate-800">{task.draft.headline}</div>
      <div className="mt-3 space-y-2">{task.draft.items.map((item) => <div key={item.title} className="rounded-xl border border-[#0d2b45]/[.3] bg-[#ffffff]/70 p-3"><div className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">{item.title}</div><div className="mt-1.5 text-[11px] leading-5 text-slate-700">{item.content}</div></div>)}</div>
      {task.draft.note && <div className="mt-3 flex items-start gap-2 text-[9px] leading-4 text-slate-500"><ShieldCheck size={11} className="mt-0.5 shrink-0 text-fteal" /> {task.draft.note}</div>}
    </motion.div>}
    {task.details && <><div className="mt-6"><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600"><Database size={12} /> Kullanılan kaynaklar</div><div className="flex flex-wrap gap-2">{task.details.dataSources.map((source) => <span key={source} className="rounded-full border border-[#0d2b45]/[.3] bg-[#0d2b45]/[.025] px-2.5 py-1 text-[9px] text-slate-600">{source}</span>)}</div></div><div className="mt-6"><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600"><Layers3 size={12} /> Alt görevler & ekipten beklenen</div><div className="space-y-2">{task.details.subtasks.map((subtask) => <div key={subtask.name} className="rounded-xl border border-[#0d2b45]/[.3] p-3"><div className="flex justify-between gap-3 text-[11px]"><span className="font-medium text-slate-800">{subtask.name}</span><span className="shrink-0 font-mono text-[9px] text-fteal-light">{subtask.eta}</span></div><div className="mt-1.5 text-[9px] text-slate-500">{subtask.owner} · {subtask.status}</div>{subtask.expectation && <div className="mt-2 rounded-lg border border-fteal/12 bg-fteal/[.035] px-2.5 py-2 text-[10px] leading-4 text-slate-600"><span className="font-semibold text-fteal-light">AI'nın talebi: </span>{subtask.expectation}</div>}</div>)}</div></div>{task.details.dependencies?.length ? <div className="mt-6"><div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600"><Handshake size={12} /> Departmanlar arası ihtiyaçlar</div><p className="mb-3 text-[9px] leading-4 text-slate-500">AI, bu görevin başka ekiplerden beklediği veri ve geliştirmeleri planladı; hazır talep mesajını Team-bot ile ilgili kanala iletebilirsiniz.</p><div className="space-y-2">{task.details.dependencies.map((dep, index) => { const target = DEPT[dep.department]; const sent = task.depSends?.[index]; const sending = sendingDepKey === `${task.id}-${index}`; return <div key={`${dep.department}-${index}`} className="rounded-xl border border-[#0d2b45]/[.3] p-3"><div className="flex items-center justify-between gap-3"><span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase" style={{ color: target?.color, background: target?.soft }}>{dep.department}</span><span className="font-mono text-[8px] text-slate-400">{target?.teams}</span></div><div className="mt-2 text-[11px] font-medium leading-4 text-slate-800">{dep.need}</div><div className="mt-2 rounded-lg border border-[#0d2b45]/[.3] bg-[#0d2b45]/[.02] px-2.5 py-2 text-[10px] leading-4 text-slate-600">{dep.message}</div>{sent ? <div className={cn("mt-2 flex items-center gap-1.5 text-[9px] font-semibold", sent.delivered ? "text-fgreen-light" : "text-[#4E52B6]")}><Check size={10} /> {sent.delivered ? `${sent.channel} kanalına iletildi` : "Gönderim kaydedildi (demo modu)"} · {time(sent.sentAt)}</div> : <button onClick={() => onSendDependency(index)} disabled={Boolean(sendingDepKey)} className="mt-2 flex items-center gap-1.5 rounded-md border border-[#6264A7]/40 bg-[#6264A7]/[.12] px-2.5 py-1.5 text-[9px] font-semibold text-[#4E52B6] transition hover:bg-[#6264A7]/[.2] disabled:opacity-50">{sending ? <LoaderCircle size={10} className="animate-spin" /> : <MessagesSquare size={10} />} Team-bot ile {target?.teams} kanalına ilet</button>}</div>; })}</div></div> : null}<div className="mt-6 rounded-2xl border border-amber/20 bg-amber/[.04] p-4"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber"><Scale size={12} /> Risk & insan denetimi</div><p className="text-xs leading-5 text-slate-600">{task.details.risk}</p></div></>}
    {task.status === "waiting" && <button onClick={onPrepare} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fteal to-fgreen py-3 text-sm font-bold text-[#ffffff]"><Sparkles size={14} /> AI ile hazırla ve departmana ata</button>}
    {task.status === "processing" && <div className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-fteal/20 bg-fteal/[.05] py-3 text-sm text-fteal-light"><LoaderCircle size={14} className="animate-spin" /> AI taslak hazırlıyor…</div>}
    {task.status === "assigned" && <button onClick={onAdvance} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fteal to-fgreen py-3 text-sm font-bold text-[#ffffff]">Onayla ve ilerlet <ArrowRight size={14} /></button>}
    {task.teams ? (
      <div className={cn("mt-2.5 rounded-xl border p-3", task.teams.delivered ? "border-fgreen/25 bg-fgreen/[.05]" : "border-[#6264A7]/30 bg-[#6264A7]/[.08]")}>
        <div className={cn("flex items-center gap-2 text-xs font-semibold", task.teams.delivered ? "text-fgreen-light" : "text-[#4E52B6]")}><MessagesSquare size={13} /> {task.teams.delivered ? "Departman kanalına iletildi" : "Gönderim kaydedildi (demo modu)"} <span className="ml-auto font-mono text-[9px] opacity-70">{time(task.teams.sentAt)}</span></div>
        <div className="mt-1.5 text-[9px] leading-4 text-slate-500">{task.teams.delivered ? `Görev paketi ${task.teams.channel} kanalına kart olarak düştü.` : `Webhook bağlanınca paket ${task.teams.channel} kanalına gerçek zamanlı düşecek. İçerik hazır ve kayıt altında.`}</div>
        <button onClick={onSendTeams} disabled={sendingTeams} className="mt-2 flex items-center gap-1.5 rounded-md border border-[#0d2b45]/[.3] px-2 py-1 text-[9px] text-slate-600 transition hover:text-slate-800 disabled:opacity-40">{sendingTeams ? <LoaderCircle size={10} className="animate-spin" /> : <MessagesSquare size={10} />} Tekrar gönder</button>
      </div>
    ) : (
      <button onClick={onSendTeams} disabled={sendingTeams} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#6264A7]/40 bg-[#6264A7]/[.14] py-2.5 text-xs font-semibold text-[#4E52B6] transition hover:bg-[#6264A7]/[.22] disabled:opacity-60">{sendingTeams ? <><LoaderCircle size={13} className="animate-spin" /> Teams'e iletiliyor…</> : <><MessagesSquare size={13} /> {DEPT[task.department].teams} kanalına gönder</>}</button>
    )}
  </motion.aside></>;
}

type ProcessResult = { summary: string; provider: string; model: string; analyzedAt: string; memory: { refs: string[] }; cards: DeptCard[] };

export function TaskBoard({ tasks, campaigns, onAdvance, onUpdateTask, onUpdateCampaign, onCompleteCampaign, onNewCampaign }: {
  tasks: DeptTask[];
  campaigns: CampaignJob[];
  onAdvance: (id: string) => void;
  onUpdateTask: (id: string, patch: Partial<DeptTask>) => void;
  onUpdateCampaign: (id: string, patch: Partial<CampaignJob>) => void;
  onCompleteCampaign: (id: string, result: ProcessResult & { trace: TraceEvent[] }) => void;
  onNewCampaign: () => void;
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sendingTeamsId, setSendingTeamsId] = useState<string | null>(null);
  const [sendingDepKey, setSendingDepKey] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<CampaignOutcome[]>(() => loadOutcomes());
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [theater, setTheater] = useState<"live" | "replay" | null>(null);
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const traceRef = useRef<TraceEvent[]>([]);
  const active = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0];

  useEffect(() => {
    if (!selectedCampaignId && campaigns[0]) setSelectedCampaignId(campaigns[0].id);
  }, [campaigns, selectedCampaignId]);

  useEffect(() => {
    traceRef.current = active?.trace ?? [];
    setTrace(active?.trace ?? []);
  }, [active?.id]);

  const processCampaign = async (campaign: CampaignJob) => {
    traceRef.current = [];
    setTrace([]);
    setTheater("live");
    onUpdateCampaign(campaign.id, { status: "processing", trace: [] });
    try {
      const approvedBrief = `${campaign.brief.title}\nAmaç: ${campaign.brief.objective}\nHedef segment: ${campaign.brief.segment}\nKanallar: ${campaign.brief.channels}\nZamanlama: ${campaign.brief.timing}\nKPI: ${campaign.brief.kpi}`;
      // Öğrenen hafıza: çalışan girişli sonuçlar benzerlik havuzuna katılmak üzere gönderilir
      const response = await fetch("/api/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea: approvedBrief, memory: outcomes }) });
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

  // "AI İşliyor" aşaması: /api/prepare departmana özel taslak üretir; API
  // düşerse yerel şablon devreye girer. Animasyonun görünmesi için en az
  // ~4 sn işleniyor durumunda kalır.
  const prepareTask = async (task: DeptTask) => {
    if (task.status !== "waiting") return;
    onUpdateTask(task.id, { status: "processing" });
    const started = Date.now();
    let draft: DeptDraft;
    try {
      const response = await fetch("/api/prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ department: task.department, title: task.title, summary: task.summary }) });
      if (!response.ok) throw new Error(`api_${response.status}`);
      const data = await response.json();
      if (!data.headline || !Array.isArray(data.items)) throw new Error("invalid_response");
      draft = { headline: data.headline, items: data.items, note: data.note ?? "", source: "ai", provider: data.provider, model: data.model, generatedAt: data.generatedAt ?? new Date().toISOString() };
    } catch {
      draft = localDraft(task.department);
    }
    const remaining = 4200 - (Date.now() - started);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    onUpdateTask(task.id, { status: "assigned", draft });
  };

  // Teams botu: görev paketini Adaptive Card olarak departman kanalına gönderir.
  // Webhook yapılandırılmamışsa gönderim demo modu olarak işaretlenir.
  const sendToTeams = async (task: DeptTask) => {
    if (sendingTeamsId) return;
    setSendingTeamsId(task.id);
    const channel = DEPT[task.department].teams;
    let delivered = false;
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: task.department,
          title: task.title,
          summary: task.summary,
          rationale: task.rationale,
          priority: task.priority,
          draft: task.draft ? { headline: task.draft.headline, items: task.draft.items } : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      delivered = Boolean(response.ok && data.delivered);
    } catch {
      delivered = false;
    }
    onUpdateTask(task.id, { teams: { sentAt: new Date().toISOString(), delivered, channel } });
    setSendingTeamsId(null);
  };

  // Departmanlar arası ihtiyaç: AI'nın hazırladığı talep mesajını ihtiyacın
  // karşılanacağı departmanın kanalına Team-bot ile iletir.
  const sendDependency = async (task: DeptTask, index: number) => {
    const dep = task.details?.dependencies?.[index];
    if (!dep || sendingDepKey) return;
    setSendingDepKey(`${task.id}-${index}`);
    const channel = DEPT[dep.department]?.teams ?? "#genel";
    let delivered = false;
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: dep.department,
          title: task.title,
          dependency: { from: task.department, need: dep.need, message: dep.message },
        }),
      });
      const data = await response.json().catch(() => ({}));
      delivered = Boolean(response.ok && data.delivered);
    } catch {
      delivered = false;
    }
    onUpdateTask(task.id, { depSends: { ...(task.depSends ?? {}), [index]: { sentAt: new Date().toISOString(), delivered, channel } } });
    setSendingDepKey(null);
  };

  const departmentTasks = useMemo(() => Object.fromEntries(DEPARTMENTS.map((department) => [department, tasks.filter((task) => task.department === department)])), [tasks]);

  return (
    <div className="mission-bg min-h-screen px-6 py-6 xl:px-8">
      <header className="mb-5 flex items-center justify-between"><div><div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.23em] text-fteal"><CircleDot size={10} /> AI operasyon merkezi</div><h1 className="text-[27px] font-semibold tracking-[-.03em] text-[#0d2b45]">Kampanya görev orkestrasyonu</h1><p className="mt-1 text-xs text-slate-500">Kuyruğa alın, AI işlem hattını başlatın, dört departmana dağıtımı canlı izleyin.</p></div><button onClick={onNewCampaign} className="flex items-center gap-2 rounded-xl border border-fteal/25 bg-fteal/[.07] px-4 py-2.5 text-[11px] font-semibold text-fteal-light hover:bg-fteal/10"><Plus size={13} /> Yeni kampanya</button></header>

      <ImpactStrip completedCount={campaigns.filter((campaign) => campaign.status === "completed").length} memoryCount={14 + outcomes.length} />

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <CampaignQueue campaigns={campaigns} selectedId={active?.id} onSelect={setSelectedCampaignId} onNew={onNewCampaign} />
        <section className="rounded-[22px] border border-fteal/15 bg-[#ffffff]/85 p-5">
          {!active ? <div className="grid min-h-[420px] place-items-center text-center"><div><BrainCircuit className="mx-auto mb-3 text-slate-400" size={30} /><div className="text-sm font-medium text-slate-700">İşlenecek kampanya bulunmuyor</div><button onClick={onNewCampaign} className="mt-4 rounded-xl bg-fteal/10 px-4 py-2 text-xs text-fteal-light">Kampanya oluştur</button></div></div> : <div className="space-y-4"><PipelineRibbon events={trace} /><div className="grid gap-5 lg:grid-cols-2">
            <div><div className="mb-4 flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: CAMPAIGN_STATE[active.status].color }}>{CAMPAIGN_STATE[active.status].label}</span>{typeof active.score === "number" && <span className="rounded-md border border-fgreen/20 bg-fgreen/[.05] px-1.5 py-0.5 font-mono text-[8px] text-fgreen-light">başarı skoru {active.score}/100</span>}</div><h2 className="mt-2 text-xl font-semibold leading-7 text-[#0d2b45]">{active.title}</h2><p className="mt-2 text-[10px] leading-5 text-slate-500">{active.brief.objective}</p></div></div><div className="mb-3 grid grid-cols-2 gap-2"><div className="rounded-xl border border-[#0d2b45]/[.3] bg-[#0d2b45]/[.02] p-2.5"><div className="text-[7px] uppercase tracking-wider text-slate-400">Hedef segment</div><div className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-600">{active.brief.segment}</div></div><div className="rounded-xl border border-[#0d2b45]/[.3] bg-[#0d2b45]/[.02] p-2.5"><div className="text-[7px] uppercase tracking-wider text-slate-400">Başarı ölçütü</div><div className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-600">{active.brief.kpi}</div></div></div>
              {active.status === "pending" && <button onClick={() => processCampaign(active)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fteal to-fgreen py-3 text-sm font-bold text-[#ffffff] shadow-glow-teal-sm"><Zap size={15} /> AI ile işle</button>}
              {active.status === "error" && <button onClick={() => processCampaign(active)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-coral/25 bg-coral/[.06] py-3 text-sm font-semibold text-coral"><RotateCcw size={14} /> Yeniden dene</button>}
              {active.status === "processing" && <button onClick={() => setTheater("live")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-fteal/15 bg-fteal/[.045] py-3 text-xs text-fteal-light transition hover:bg-fteal/[.09]"><LoaderCircle size={14} className="animate-spin" /> Karar motoru çalışıyor — canlı izle</button>}
              {active.status === "completed" && <div className="mt-4 rounded-xl border border-fgreen/15 bg-fgreen/[.045] p-3"><div className="flex items-center gap-2 text-[10px] font-semibold text-fgreen-light"><ShieldCheck size={12} /> 4 departmana dağıtıldı</div><p className="mt-1.5 text-[10px] leading-4 text-slate-500">{active.summary}</p><div className="mt-2 font-mono text-[8px] text-slate-400">{PROVIDER[active.provider ?? ""] ?? active.provider} · {active.model}</div></div>}
              {active.status === "completed" && (active.outcome
                ? <div className="mt-3 rounded-xl border border-fgreen/20 bg-fgreen/[.04] p-3"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-fgreen-light"><BrainCircuit size={12} /> Sonuç hafızaya işlendi</div><div className="mt-2 flex flex-wrap gap-2 text-[9px]"><span className="rounded-full border border-fgreen/20 bg-[#ffffff]/70 px-2 py-0.5 font-mono text-slate-700">Açılma %{active.outcome.openRate}</span><span className="rounded-full border border-fgreen/20 bg-[#ffffff]/70 px-2 py-0.5 font-mono text-slate-700">Dönüşüm %{active.outcome.conversion}</span><span className="rounded-full border border-fgreen/20 bg-[#ffffff]/70 px-2 py-0.5 text-slate-700">{active.outcome.channel}</span></div><p className="mt-2 text-[9px] leading-4 text-slate-600"><span className="font-semibold">Ders:</span> {active.outcome.lesson}</p><p className="mt-1.5 text-[8px] text-slate-400">Bir sonraki kampanyanın benzerlik analizinde referans olarak kullanılacak.</p></div>
                : <OutcomeForm campaign={active} onSave={(outcome) => { setOutcomes(addOutcome(outcome)); addPastCampaign(buildLivePastCampaign(active, outcome)); onUpdateCampaign(active.id, { outcome }); }} />)}
            </div>
            <AnalysisSummary trace={trace} processing={active.status === "processing"} onOpenTheater={() => setTheater(active.status === "processing" ? "live" : "replay")} />
          </div></div>}
        </section>
      </div>

      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div><div className="flex items-center gap-2 text-sm font-semibold text-[#0d2b45]"><Layers3 size={14} className="text-fteal" /> Departman görevleri</div><p className="mt-1 text-[10px] text-slate-500">AI tamamlandığında her departman için ayrı görev kartı oluşur.</p></div>
          <div className="flex flex-wrap items-center gap-1.5">{([{ key: "all" as const, label: "Tümü" }, ...statusColumns] as { key: TaskStatus | "all"; label: string }[]).map((chip) => { const count = chip.key === "all" ? tasks.length : tasks.filter((task) => task.status === chip.key).length; return <button key={chip.key} onClick={() => setStatusFilter(chip.key)} className={cn("rounded-full border px-2.5 py-1 text-[9px] transition", statusFilter === chip.key ? "border-fteal/30 bg-fteal/[.08] text-fteal-light" : "border-[#0d2b45]/[.3] text-slate-500 hover:border-[#0d2b45]/[.3] hover:text-slate-600")}>{chip.label} <span className="font-mono text-[8px] opacity-70">{count}</span></button>; })}</div>
        </div>
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#6264A7]/25 bg-[#6264A7]/[.07] px-3 py-2 text-[9px] leading-4 text-slate-500"><MessagesSquare size={13} className="shrink-0 text-[#5B5EA8]" /><span><span className="font-semibold text-[#4E52B6]">Team-bot köprüsü · Aktif</span> — görev kartını açıp paketi departmanın kanalına (Slack, kurumsalda Teams) gönderebilirsiniz; AI ön çalışması da karta eklenir.</span></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{DEPARTMENTS.map((department) => { const dept = DEPT[department]; const all = departmentTasks[department] ?? []; const items = statusFilter === "all" ? all : all.filter((task) => task.status === statusFilter); const done = all.filter((task) => task.status === "done").length; return <div key={department} className="min-h-[300px] rounded-[20px] border border-[#0d2b45]/[.3] bg-[#0d2b45]/[.012] p-3" style={{ borderTopColor: `${dept.color}55` }}><div className="mb-2 flex items-center gap-3 rounded-xl p-2" style={{ background: dept.soft }}><div className="grid h-8 w-8 place-items-center rounded-lg border" style={{ borderColor: `${dept.color}44`, color: dept.color }}><span className="font-mono text-[10px] font-bold">{String(all.length).padStart(2,"0")}</span></div><div className="min-w-0"><div className="text-[11px] font-semibold text-slate-800">{department}</div><div className="mt-0.5 truncate text-[8px] text-slate-500">{dept.short} · <span className="text-[#5B5EA8]">{dept.teams}</span></div></div></div><div className="mb-3 px-1"><div className="flex items-center justify-between text-[7px] uppercase tracking-wider text-slate-400"><span>Tamamlanma</span><span className="font-mono">{done}/{all.length}</span></div><div className="mt-1 h-1 overflow-hidden rounded-full bg-[#0d2b45]/[.05]"><div className="h-full rounded-full transition-all" style={{ width: `${all.length ? Math.round((done / all.length) * 100) : 0}%`, background: dept.color }} /></div></div><div className="space-y-2.5"><AnimatePresence>{items.map((task) => <DepartmentTask key={task.id} task={task} onOpen={() => setSelectedTaskId(task.id)} onPrepare={() => prepareTask(task)} />)}</AnimatePresence>{items.length === 0 && <div className="grid h-24 place-items-center rounded-xl border border-dashed border-[#0d2b45]/[.3] px-3 text-center text-[8px] uppercase tracking-wider text-slate-400">{statusFilter === "all" ? "Görev bekleniyor" : "Bu durumda görev yok"}</div>}</div></div>; })}</div>
      </section>
      <div className="mt-4 flex items-center justify-center gap-2 text-[9px] text-slate-400"><ShieldCheck size={10} /> Gizli düşünce zinciri değil; gerçek sistem olayları, kaynaklar ve kullanıcıya açık karar gerekçeleri gösterilir.</div>
      <AnimatePresence>{selectedTask && <TaskDrawer task={selectedTask} onClose={() => setSelectedTaskId(null)} onAdvance={() => { onAdvance(selectedTask.id); setSelectedTaskId(null); }} onPrepare={() => prepareTask(selectedTask)} onSendTeams={() => sendToTeams(selectedTask)} sendingTeams={sendingTeamsId === selectedTask.id} onSendDependency={(index) => sendDependency(selectedTask, index)} sendingDepKey={sendingDepKey} />}</AnimatePresence>
      <AnimatePresence>{theater && active && <ProcessingTheater title={active.title} events={trace} status={active.status} mode={theater} onClose={() => setTheater(null)} />}</AnimatePresence>
    </div>
  );
}
