import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  Cpu,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import type { TraceEvent } from "../data/mock";
import { cn } from "../lib/utils";

const STAGES = [
  ["intake", "Niyet Analizi"],
  ["segment", "Segment Çıkarımı"],
  ["memory", "Hafıza Taraması"],
  ["channels", "Kanal Skorlama"],
  ["rules", "Risk Kuralları"],
  ["model", "AI Sentez"],
  ["validation", "Kapsam Kontrolü"],
  ["dispatch", "Dağıtım"],
] as const;

function clock(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

function Typewriter({ text }: { text: string }) {
  const [length, setLength] = useState(0);
  useEffect(() => {
    setLength(0);
    const timer = setInterval(() => setLength((current) => {
      if (current >= text.length) { clearInterval(timer); return current; }
      return current + 2;
    }), 14);
    return () => clearInterval(timer);
  }, [text]);
  return <span>{text.slice(0, length)}{length < text.length && <span className="text-fgreen-light">▍</span>}</span>;
}

function CountUp({ value }: { value: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 650);
      setCurrent(Math.round(value * progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{current}</>;
}

function Corners() {
  return <>
    <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-fteal/40" />
    <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-fteal/40" />
    <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-fteal/40" />
    <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-fteal/40" />
  </>;
}

function Core({ running, percent, failed }: { running: boolean; percent: number; failed: boolean }) {
  return (
    <div className="relative mx-auto h-56 w-56 shrink-0">
      {running && <motion.div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, rgba(83,219,195,.30), transparent 70deg)" }} animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }} />}
      <motion.div className="absolute inset-0 rounded-full border border-dashed border-fteal/25" animate={running ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 16, repeat: running ? Infinity : 0, ease: "linear" }} />
      <motion.div className="absolute inset-4 rounded-full border border-fteal/15" animate={running ? { rotate: -360 } : { rotate: 0 }} transition={{ duration: 9, repeat: running ? Infinity : 0, ease: "linear" }}>
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-fgreen shadow-[0_0_10px_#A7E052]" />
      </motion.div>
      <motion.div className="absolute inset-9 rounded-full border border-dashed border-fgreen/20" animate={running ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 5.5, repeat: running ? Infinity : 0, ease: "linear" }}>
        <span className="absolute -right-0.5 top-1/2 h-1.5 w-1.5 rounded-full bg-fteal shadow-[0_0_8px_#53DBC3]" />
      </motion.div>
      <div className={cn("absolute inset-[54px] rounded-full border bg-[#07192d]/92", failed ? "border-coral/40" : "border-fteal/30")} />
      {running && <motion.div className="absolute inset-[54px] rounded-full" animate={{ boxShadow: ["0 0 20px rgba(83,219,195,.10)", "0 0 55px rgba(83,219,195,.35)", "0 0 20px rgba(83,219,195,.10)"] }} transition={{ duration: 1.8, repeat: Infinity }} />}
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-4xl font-semibold tracking-tight text-white">{percent}<span className="text-lg text-fteal-light">%</span></div>
          <div className={cn("mt-1 font-mono text-[8px] uppercase tracking-[.28em]", failed ? "text-coral" : "text-slate-500")}>{failed ? "kesinti" : running ? "işleniyor" : "tamamlandı"}</div>
        </div>
      </div>
    </div>
  );
}

function Rail({ events, running }: { events: TraceEvent[]; running: boolean }) {
  const seen = new Map(events.map((event) => [event.id, event]));
  const firstMissing = STAGES.findIndex(([id]) => !seen.has(id));
  return (
    <div className="space-y-1">
      {STAGES.map(([id, label], index) => {
        const event = seen.get(id);
        const isNext = running && index === firstMissing;
        const isRunning = event?.status === "running";
        return (
          <div key={id} className={cn("flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 transition", event ? "border-fteal/12 bg-fteal/[.03]" : isNext ? "border-fteal/25 bg-fteal/[.05]" : "border-transparent opacity-40")}>
            <span className="w-4 font-mono text-[8px] text-slate-600">0{index + 1}</span>
            <span className="grid h-4 w-4 place-items-center">
              {isRunning || isNext ? <LoaderCircle size={11} className="animate-spin text-fteal-light" /> : event?.status === "error" ? <AlertTriangle size={10} className="text-coral" /> : event ? <Check size={11} className="text-fgreen-light" /> : <span className="h-1 w-1 rounded-full bg-slate-700" />}
            </span>
            <span className={cn("flex-1 text-[10px] font-medium", event || isNext ? "text-slate-200" : "text-slate-600")}>{label}</span>
            {typeof event?.score === "number" && <span className="font-mono text-[8px] text-fteal-light">{event.score}</span>}
          </div>
        );
      })}
    </div>
  );
}

function StageCard({ event, expanded, onSelect }: { event: TraceEvent; expanded: boolean; onSelect: () => void }) {
  if (!expanded) {
    return (
      <motion.button layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} onClick={onSelect} className="flex w-full items-center gap-3 rounded-xl border border-white/[.05] bg-white/[.015] px-3 py-2 text-left transition hover:border-fteal/25 hover:bg-fteal/[.03]">
        {event.status === "error" ? <AlertTriangle size={11} className="shrink-0 text-coral" /> : <Check size={11} className="shrink-0 text-fgreen-light" />}
        <span className="text-[10px] font-medium text-slate-300">{event.label}</span>
        {event.algorithm && <span className="hidden truncate font-mono text-[8px] text-slate-600 md:block">{event.algorithm}</span>}
        <span className="ml-auto shrink-0 font-mono text-[8px] text-slate-700">{clock(event.timestamp)}</span>
        {typeof event.score === "number" && <span className="shrink-0 rounded border border-fteal/20 px-1.5 py-0.5 font-mono text-[8px] text-fteal-light">{event.score}/100</span>}
      </motion.button>
    );
  }
  return (
    <motion.div layout initial={{ opacity: 0, y: 14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative rounded-2xl border border-fteal/20 bg-gradient-to-br from-fteal/[.06] to-transparent p-4">
      <Corners />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.2em] text-fteal">
            {event.status === "running" ? <LoaderCircle size={10} className="animate-spin" /> : event.status === "error" ? <AlertTriangle size={10} className="text-coral" /> : <Check size={10} className="text-fgreen-light" />}
            {clock(event.timestamp)} · aktif aşama
          </div>
          <div className="mt-1.5 text-sm font-semibold text-white">{event.label}</div>
          <div className="mt-1 min-h-[28px] text-[10px] leading-4 text-slate-400"><Typewriter text={event.detail} /></div>
        </div>
        {typeof event.score === "number" && (
          <div className="shrink-0 text-right">
            <div className="font-mono text-3xl font-semibold text-white"><CountUp value={event.score} /></div>
            <div className="font-mono text-[7px] uppercase tracking-[.2em] text-slate-600">güven skoru</div>
          </div>
        )}
      </div>
      {event.algorithm && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md border border-fgreen/20 bg-fgreen/[.05] px-2 py-1 font-mono text-[9px] text-fgreen-light"><Cpu size={10} /> {event.algorithm}</span>
          {event.why && <span className="min-w-0 flex-1 text-[9px] leading-4 text-slate-500"><span className="text-slate-400">Neden bu yöntem?</span> {event.why}</span>}
        </div>
      )}
      {(event.inputs?.length || event.outputs?.length) ? (
        <div className="mt-3 flex items-stretch gap-2">
          <div className="min-w-0 flex-1 rounded-lg border border-white/[.06] bg-[#061426]/80 p-2.5">
            <div className="mb-1.5 font-mono text-[7px] uppercase tracking-[.18em] text-slate-600">girdi akışı</div>
            <div className="flex flex-wrap gap-1">{(event.inputs ?? []).map((item, index) => <motion.span key={item} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .15 + index * .09 }} className="rounded border border-fteal/15 bg-fteal/[.04] px-1.5 py-0.5 text-[8px] text-slate-400">{item}</motion.span>)}</div>
          </div>
          <div className="grid place-items-center text-fteal"><motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.1, repeat: Infinity }}><ArrowRight size={13} /></motion.div></div>
          <div className="min-w-0 flex-1 rounded-lg border border-white/[.06] bg-[#061426]/80 p-2.5">
            <div className="mb-1.5 font-mono text-[7px] uppercase tracking-[.18em] text-slate-600">çıktı</div>
            <div className="flex flex-wrap gap-1">{(event.outputs ?? []).map((item, index) => <motion.span key={item} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 + index * .09 }} className="rounded border border-fgreen/15 bg-fgreen/[.04] px-1.5 py-0.5 text-[8px] text-slate-400">{item}</motion.span>)}</div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

export function ProcessingTheater({ title, events, status, mode, onClose }: {
  title: string;
  events: TraceEvent[];
  status: "pending" | "processing" | "completed" | "error";
  mode: "live" | "replay";
  onClose: () => void;
}) {
  const [revealCount, setRevealCount] = useState(0);
  const [manualId, setManualId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const streamRef = useRef<HTMLDivElement>(null);

  // Sunucu hızından bağımsız sunum temposu: aşamalar geldiği anda değil,
  // okunabilir aralıklarla (2.6 sn) ekrana düşer. Canlıda kuyruk birikir,
  // tekrar oynatmada kayıtlı trace aynı tempoyla akar.
  useEffect(() => {
    const timer = setInterval(() => setRevealCount((current) => (current < events.length ? current + 1 : current)), 2600);
    return () => clearInterval(timer);
  }, [events.length]);
  useEffect(() => {
    if (revealCount === 0 && events.length > 0) setRevealCount(1);
  }, [events.length, revealCount]);
  useEffect(() => {
    if (status === "error") setRevealCount(events.length);
  }, [status, events.length]);

  const visible = events.slice(0, revealCount);
  const running = status === "processing" || revealCount < events.length;
  const finished = status === "completed" && events.length > 0 && revealCount >= events.length;
  const failed = status === "error";

  const restart = () => {
    setRevealCount(0);
    setManualId(null);
    startRef.current = Date.now();
    setElapsed(0);
  };

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 100);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (manualId) return;
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: "smooth" });
  }, [visible.length, manualId]);

  const doneStages = new Set(visible.filter((event) => event.status === "done").map((event) => event.id));
  const percent = Math.round((STAGES.filter(([id]) => doneStages.has(id)).length / STAGES.length) * 100);
  const latest = visible[visible.length - 1];
  const expandedId = manualId && visible.some((event) => event.id === manualId) ? manualId : latest?.id;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] overflow-y-auto bg-[#030b16]/95 backdrop-blur-md">
      <div className="pointer-events-none fixed inset-0" style={{ backgroundImage: "linear-gradient(rgba(83,219,195,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(83,219,195,.035) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="pointer-events-none fixed inset-0" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0 1px, transparent 1px 3px)" }} />

      <div className="relative mx-auto flex min-h-full max-w-[1240px] flex-col px-6 py-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.28em] text-fteal">
              <motion.span className="h-1.5 w-1.5 rounded-full bg-fteal" animate={running ? { opacity: [.3, 1, .3] } : {}} transition={{ duration: 1, repeat: Infinity }} />
              AI karar motoru · {mode === "replay" ? "kayıt tekrarı" : failed ? "kesinti" : running ? "canlı yayın" : "tamamlandı"}
            </div>
            <h2 className="mt-2 max-w-xl text-lg font-semibold leading-6 text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {!running && events.length > 0 && <button onClick={restart} className="flex items-center gap-1.5 rounded-lg border border-fteal/25 bg-fteal/[.06] px-3 py-2 text-[10px] font-semibold text-fteal-light transition hover:bg-fteal/10"><RotateCcw size={12} /> Baştan izle</button>}
            <div className="rounded-lg border border-white/[.08] bg-white/[.02] px-3 py-1.5 text-right">
              <div className="font-mono text-sm text-fteal-light">{elapsed.toFixed(1)}s</div>
              <div className="font-mono text-[7px] uppercase tracking-[.2em] text-slate-600">geçen süre</div>
            </div>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-white/25 hover:text-white"><X size={15} /></button>
          </div>
        </header>

        <div className="mt-5 grid flex-1 gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="relative rounded-2xl border border-fteal/15 bg-[#07192d]/70 p-4">
            <Corners />
            <Core running={running} percent={percent} failed={failed} />
            <div className="mt-4 mb-2 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.2em] text-slate-500"><BrainCircuit size={11} className="text-fteal" /> işlem hattı</div>
            <Rail events={visible} running={running} />
          </aside>

          <section className="flex min-h-0 flex-col">
            <div ref={streamRef} className="relative max-h-[calc(100vh-290px)] min-h-[320px] flex-1 space-y-2 overflow-y-auto rounded-2xl border border-white/[.06] bg-[#061426]/60 p-4">
              <Corners />
              <AnimatePresence initial={false}>
                {visible.map((event) => <StageCard key={event.id} event={event} expanded={event.id === expandedId} onSelect={() => setManualId(event.id === manualId ? null : event.id)} />)}
              </AnimatePresence>
              {visible.length === 0 && <div className="grid h-full min-h-[280px] place-items-center text-center"><div><LoaderCircle size={22} className="mx-auto mb-3 animate-spin text-fteal" /><div className="font-mono text-[9px] uppercase tracking-[.25em] text-slate-500">karar motoru başlatılıyor</div></div></div>}
              {running && visible.length > 0 && (
                <div className="flex items-center gap-2 px-2 pt-1 font-mono text-[9px] text-fteal-light">
                  <span className="flex gap-0.5">{[0, 1, 2].map((index) => <motion.span key={index} className="h-1 w-1 rounded-full bg-fteal" animate={{ opacity: [.2, 1, .2] }} transition={{ duration: .9, delay: index * .16, repeat: Infinity }} />)}</span>
                  sonraki aşama hesaplanıyor
                </div>
              )}
              {finished && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-fgreen/25 bg-fgreen/[.06] p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl border border-fgreen/30 bg-fgreen/10 text-fgreen-light"><ShieldCheck size={16} /></div>
                    <div>
                      <div className="text-xs font-semibold text-fgreen-light">Analiz tamamlandı</div>
                      <div className="mt-0.5 text-[9px] text-slate-500">Görev paketleri 4 departmana dağıtıldı · tüm kararlar gerekçeleriyle kayıt altında</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={restart} className="flex items-center gap-1.5 rounded-xl border border-fteal/25 bg-fteal/[.06] px-3 py-2.5 text-xs font-semibold text-fteal-light transition hover:bg-fteal/10"><RotateCcw size={12} /> Baştan izle</button>
                    <button onClick={onClose} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fteal to-fgreen px-4 py-2.5 text-xs font-bold text-[#061426]">Görev panosuna dön <ArrowRight size={13} /></button>
                  </div>
                </motion.div>
              )}
              {failed && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 rounded-2xl border border-coral/25 bg-coral/[.06] p-4">
                  <div className="flex items-center gap-3"><AlertTriangle size={16} className="text-coral" /><div className="text-xs text-coral">İşlem kesintiye uğradı — panodan yeniden deneyebilirsiniz.</div></div>
                  <button onClick={onClose} className="rounded-xl border border-coral/30 px-4 py-2 text-xs text-coral">Kapat</button>
                </motion.div>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-white/[.06] bg-[#040f1d]/90 px-3 py-2 font-mono text-[8px] leading-4">
              <div className="mb-1 flex items-center justify-between text-slate-600"><span className="uppercase tracking-[.2em]">sistem günlüğü</span><span>{visible.length} olay</span></div>
              {visible.slice(-4).map((event) => <div key={event.id} className="truncate text-fgreen-light/60">[{clock(event.timestamp)}] {event.status === "error" ? "✕" : "✓"} {event.label} :: {event.detail}</div>)}
              {visible.length === 0 && <div className="text-slate-700">[--:--:--] bağlantı bekleniyor…</div>}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
