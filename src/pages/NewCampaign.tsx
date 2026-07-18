import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDot,
  Gauge,
  LoaderCircle,
  MessageSquareText,
  Send,
  Sparkles,
  Target,
  Users,
  WandSparkles,
} from "lucide-react";
import { DiamondLogo } from "../components/DiamondLogo";
import { exampleIdeas, scoreCampaign, type CampaignBrief, type RefineResult, type RouteItem } from "../data/mock";

type Message = { id: string; role: "assistant" | "user"; text: string };

async function askAdvisor(idea: string, feedback?: string, previousBrief?: CampaignBrief): Promise<RefineResult> {
  const response = await fetch("/api/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea, feedback, previousBrief }),
  });
  if (!response.ok) throw new Error(`api_${response.status}`);
  const data = await response.json();
  if (!data.brief || !Array.isArray(data.routing)) throw new Error("invalid_response");
  return { ...data, live: true };
}

const BRIEF_ROWS: { key: keyof CampaignBrief; label: string; icon: typeof Target }[] = [
  { key: "objective", label: "Amaç", icon: Target },
  { key: "segment", label: "Hedef kitle", icon: Users },
  { key: "channels", label: "Kanallar", icon: MessageSquareText },
  { key: "timing", label: "Zamanlama", icon: CalendarClock },
  { key: "kpi", label: "Başarı ölçütü", icon: CircleDot },
];

export function NewCampaign({ onCreateCampaign }: { onCreateCampaign: (input: { title: string; idea: string; brief: CampaignBrief; suggestions: string[]; routing: RouteItem[] }) => void }) {
  const [input, setInput] = useState("");
  const [rootIdea, setRootIdea] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", text: "Merhaba, ben kampanya strateji asistanınım. Fikrinizi anlatın; hedef kitle, teklif, kanal ve başarı ölçütünü birlikte netleştirelim. Eksik noktaları varsaymak yerine size açıklayacağım." },
  ]);
  const [result, setResult] = useState<RefineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messageEnd = useRef<HTMLDivElement>(null);

  const send = async (text = input) => {
    const value = text.trim();
    if (!value || loading) return;
    const first = !rootIdea;
    const idea = first ? value : rootIdea;
    if (first) setRootIdea(value);
    setInput("");
    setError("");
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", text: value }]);
    setLoading(true);
    setTimeout(() => messageEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const next = await askAdvisor(idea, first ? undefined : value, result?.brief);
      setResult(next);
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", text: next.aiComment }]);
    } catch {
      setError("AI danışmanına ulaşılamadı. Lütfen yeniden deneyin.");
    } finally {
      setLoading(false);
      setTimeout(() => messageEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const score = result ? scoreCampaign(result.brief) : null;

  const approve = () => {
    if (!result) return;
    onCreateCampaign({
      title: result.brief.title,
      idea: rootIdea,
      brief: result.brief,
      suggestions: result.suggestions,
      routing: result.routing,
    });
  };

  return (
    <div className="campaign-studio min-h-screen px-6 py-6 xl:px-8">
      <header className="mx-auto mb-5 flex max-w-[1260px] items-center justify-between">
        <div className="flex items-center gap-3"><DiamondLogo size={34} /><div><div className="flex items-center gap-2 text-sm font-semibold text-white">AI Kampanya Stüdyosu <span className="rounded-full border border-fteal/20 bg-fteal/[.07] px-2 py-0.5 font-mono text-[8px] text-fteal-light">LIVE</span></div><div className="mt-0.5 text-[10px] text-slate-500">Fikrinizi konuşarak netleştirin, onaylanan brief’i operasyona aktarın.</div></div></div>
        <div className="hidden items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-3 py-1.5 text-[9px] text-slate-500 md:flex"><CircleDot size={9} className="text-fgreen-light" /> OpenAI danışman bağlı</div>
      </header>

      <main className="mx-auto grid max-w-[1260px] gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <section className="flex min-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-[26px] border border-white/[.08] bg-[#08172a]/95 shadow-[0_30px_100px_rgba(0,0,0,.2)]">
          <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div className="flex items-center gap-3"><div className="relative grid h-9 w-9 place-items-center rounded-xl border border-fteal/25 bg-fteal/10 text-fteal-light"><Bot size={17} /><span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-fgreen shadow-[0_0_8px_#A7E052]" /></div><div><div className="text-xs font-semibold text-slate-100">Kampanya Strateji Asistanı</div><div className="mt-0.5 text-[9px] text-slate-600">Brief danışmanı · gerçek AI görüşmesi</div></div></div><span className="font-mono text-[8px] text-slate-700">CONVERSATION / {messages.length}</span></div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message) => <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={message.role === "user" ? "ml-auto max-w-[82%]" : "max-w-[88%]"}><div className={message.role === "user" ? "rounded-2xl rounded-br-md bg-gradient-to-br from-fteal to-fteal-dim px-4 py-3 text-[12px] leading-5 text-white" : "rounded-2xl rounded-bl-md border border-white/[.075] bg-white/[.035] px-4 py-3 text-[12px] leading-5 text-slate-300"}>{message.text}</div>{message.role === "assistant" && <div className="mt-1.5 flex items-center gap-1.5 pl-1 text-[8px] text-slate-700"><Sparkles size={8} /> AI önerisi · karar sizin</div>}</motion.div>)}
            {loading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[88%]"><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-fteal/15 bg-fteal/[.035] px-4 py-3 text-[11px] text-fteal-light"><LoaderCircle size={12} className="animate-spin" /> Fikri ve mevcut brief’i değerlendiriyorum…</div></motion.div>}
            {error && <div className="rounded-xl border border-coral/20 bg-coral/[.05] px-3 py-2 text-[10px] text-coral">{error}</div>}
            <div ref={messageEnd} />
          </div>

          {!rootIdea && <div className="flex gap-2 overflow-x-auto px-5 pb-3">{exampleIdeas.slice(0, 3).map((example) => <button key={example} onClick={() => send(example)} className="min-w-[210px] rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2 text-left text-[9px] leading-4 text-slate-600 transition hover:border-fteal/20 hover:text-slate-300">{example}</button>)}</div>}
          <div className="border-t border-white/[.07] p-4"><div className="flex items-end gap-2 rounded-2xl border border-white/[.09] bg-[#061426] p-2 transition focus-within:border-fteal/30 focus-within:shadow-glow-teal-sm"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} rows={2} placeholder={result ? "Brief’i revize edin… Örn: Hedef kitleyi 25-35 yap, SMS kanalını çıkar." : "Kampanya fikrinizi anlatın…"} className="flex-1 resize-none bg-transparent px-3 py-2 text-[12px] leading-5 text-slate-200 outline-none placeholder:text-slate-700" /><button onClick={() => send()} disabled={!input.trim() || loading} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fteal to-fgreen text-[#061426] disabled:opacity-30"><Send size={15} /></button></div><div className="mt-2 text-center text-[8px] text-slate-700">Enter gönderir · Shift+Enter yeni satır</div></div>
        </section>

        <section className="relative min-h-[calc(100vh-120px)] overflow-hidden rounded-[26px] border border-fteal/15 bg-gradient-to-b from-[#0a1c31] to-[#071426] p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(ellipse_at_top,rgba(47,182,166,.13),transparent_68%)]" />
          <div className="relative flex items-center justify-between border-b border-white/[.07] pb-4"><div><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-fteal-light"><WandSparkles size={13} /> Yaşayan kampanya kartı</div><div className="mt-1 text-[9px] text-slate-600">Görüşme ilerledikçe AI tarafından güncellenir</div></div>{result?.live && <span className="flex items-center gap-1 rounded-full border border-fgreen/20 bg-fgreen/[.06] px-2 py-1 text-[8px] text-fgreen-light"><Check size={8} /> Gerçek AI</span>}</div>

          <AnimatePresence mode="wait">
            {!result ? <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative grid h-[calc(100%-60px)] place-items-center px-8 text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-fteal/15 bg-fteal/[.045] text-fteal"><Target size={25} /></div><div className="mt-4 text-sm font-medium text-slate-300">Brief görüşmeyle oluşacak</div><p className="mx-auto mt-2 max-w-sm text-[10px] leading-5 text-slate-600">AI fikrinizi doğrudan göreve çevirmeyecek. Önce amaç, segment, kanallar, zamanlama ve KPI netleşecek.</p></div></motion.div> : <motion.div key="brief" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative pt-5">
              <div className="mb-5 rounded-2xl border border-fteal/15 bg-fteal/[.04] p-4"><div className="text-[9px] uppercase tracking-wider text-fteal">Kampanya adı</div><h1 className="mt-2 text-xl font-semibold leading-7 text-white">{result.brief.title}</h1></div>
              <div className="space-y-2">{BRIEF_ROWS.map(({ key, label, icon: Icon }, index) => <motion.div key={key} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .05 }} className="flex gap-3 rounded-xl border border-white/[.06] bg-white/[.022] p-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[.07] bg-white/[.025] text-fteal"><Icon size={13} /></div><div><div className="text-[8px] font-semibold uppercase tracking-wider text-slate-600">{label}</div><div className="mt-1 text-[10px] leading-4 text-slate-300">{result.brief[key]}</div></div></motion.div>)}</div>
              {score && <div className="mt-4 rounded-2xl border border-fgreen/15 bg-fgreen/[.03] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[8px] font-semibold uppercase tracking-wider text-slate-500"><Gauge size={12} className="text-fgreen-light" /> Kampanya başarı skoru</div>
                  <div className="flex items-baseline gap-1.5"><span className="font-mono text-2xl font-semibold text-white">{score.total}</span><span className="text-[8px] text-slate-600">/100 · {score.label}</span></div>
                </div>
                <div className="mt-3 space-y-2">{score.parts.map((part) => <div key={part.key}>
                  <div className="flex items-center justify-between text-[8px]"><span className="text-slate-500">{part.label}</span><span className="font-mono text-slate-400">{part.score}</span></div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[.05]"><motion.div initial={{ width: 0 }} animate={{ width: `${part.score}%` }} transition={{ duration: .5 }} className="h-full rounded-full bg-gradient-to-r from-fteal to-fgreen" /></div>
                </div>)}</div>
                <div className="mt-3 text-[8px] leading-3 text-slate-700">Skor, geçmiş kampanya performansı ve brief netliğinden hesaplanır; revize ettikçe güncellenir.</div>
              </div>}
              <div className="mt-4"><div className="mb-2 text-[8px] font-semibold uppercase tracking-wider text-slate-600">AI iyileştirme önerileri</div><div className="space-y-1.5">{result.suggestions.map((suggestion) => <div key={suggestion} className="flex gap-2 text-[9px] leading-4 text-slate-500"><ChevronRight size={10} className="mt-0.5 shrink-0 text-fgreen-light" /> {suggestion}</div>)}</div></div>
              <button onClick={approve} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fteal to-fgreen py-3 text-sm font-bold text-[#061426] shadow-glow-teal-sm">Brief’i onayla ve panoya gönder <ArrowRight size={14} /></button>
              <div className="mt-2 text-center text-[8px] text-slate-700">Onaydan sonra AI analizi ayrıca sizin tarafınızdan başlatılır.</div>
            </motion.div>}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
