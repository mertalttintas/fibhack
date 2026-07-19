import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Search, LayoutGrid, ArrowUpRight, ArrowDownRight, Lightbulb } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { CountUp } from "../components/CountUp";
import { topSearches, topTabs, trendSignals, type TrendSignal } from "../data/mock";
import { cn } from "../lib/utils";

const TONE_TEXT: Record<string, string> = {
  teal: "text-fteal-light",
  green: "text-fgreen-light",
  amber: "text-amber",
  coral: "text-coral",
};

function SignalCard({ signal, index }: { signal: TrendSignal; index: number }) {
  const falling = signal.change < 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="glass glass-hover p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-[#0d2b45] leading-snug">{signal.title}</div>
          <div className="text-[11px] text-slate-500 mt-1">{signal.source}</div>
        </div>
        <div className={cn("flex items-center gap-1 font-bold font-mono text-xl shrink-0", TONE_TEXT[signal.tone])}>
          {falling ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}
          <CountUp value={Math.abs(signal.change)} suffix="%" />
        </div>
      </div>
      <Sparkline data={signal.spark} tone={signal.tone} width={280} height={44} />
      <div className="mt-4 flex gap-2 items-start bg-[#0d2b45]/[0.03] border border-[#0d2b45]/[0.07] rounded-xl px-3 py-2.5">
        <Lightbulb size={14} className={cn("shrink-0 mt-0.5", falling ? "text-coral" : "text-amber")} />
        <div>
          <span className={cn("text-[10px] uppercase tracking-wider font-bold block mb-0.5", falling ? "text-coral" : "text-amber")}>
            {falling ? "Önerilen önlem" : "Önerilen aksiyon"}
          </span>
          <span className="text-xs text-slate-700 leading-snug">{signal.action}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function Signals() {
  const rising = trendSignals.filter((s) => s.change >= 0);
  const falling = trendSignals.filter((s) => s.change < 0);
  return (
    <div className="px-8 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0d2b45] tracking-tight">Proaktif Talep Sinyalleri</h1>
        <p className="text-sm text-slate-600 mt-1">
          Mobil bankacılık kullanımı + mevsimsellik + piyasa trendlerinden üretilen fırsat ve risk sinyalleri.
        </p>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0d2b45]">
        <TrendingUp size={15} className="text-fgreen" /> Yükselen sinyaller
        <span className="font-mono text-[10px] text-slate-500">{rising.length} sinyal · fırsat penceresi</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
        {rising.map((s, i) => <SignalCard key={s.id} signal={s} index={i} />)}
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0d2b45]">
        <TrendingDown size={15} className="text-coral" /> Düşen sinyaller
        <span className="font-mono text-[10px] text-slate-500">{falling.length} sinyal · kanal/ürün riski</span>
      </div>
      <div className="mb-2 text-[11px] text-slate-500">
        Düşen sinyaller de karar motoruna girer: zayıflayan kanal ve ürünler kampanya planında otomatik olarak geri ağırlıklandırılır.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {falling.map((s, i) => <SignalCard key={s.id} signal={s} index={i} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid size={15} className="text-fteal" />
            <span className="text-sm font-semibold text-[#0d2b45]">Bu ay en çok kullanılan sekmeler</span>
          </div>
          <div className="space-y-3">
            {topTabs.map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-700">{t.label}</span>
                  <span className="text-slate-500 font-mono">{t.value}</span>
                </div>
                <div className="h-1.5 bg-[#0d2b45]/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${t.value}%` }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-fteal to-fgreen"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Search size={15} className="text-fteal" />
            <span className="text-sm font-semibold text-[#0d2b45]">En çok aranan terimler</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topSearches.map((s, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.07 }}
                className="chip flex items-center gap-2"
              >
                <TrendingUp size={11} className="text-fgreen" />"{s.term}"
                <span className="font-mono text-slate-500">{s.count.toLocaleString("tr-TR")}</span>
              </motion.span>
            ))}
          </div>
          <div className="mt-5 text-xs text-slate-600 bg-fteal/[0.06] border border-fteal/20 rounded-xl px-3 py-2.5 leading-relaxed">
            <span className="text-fteal font-semibold">AI notu: </span>
            "kira öderken puan" aramalarındaki artış, genç segment kredi kartı kampanyası için talebin
            organik olarak oluştuğunu gösteriyor — lansman zamanlaması ideal. Öte yandan 18-30 segmentte
            SMS okunma oranındaki −%17 düşüş, bu kitleye SMS ağırlıklı kurguların artık önerilmeyeceği anlamına geliyor.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
