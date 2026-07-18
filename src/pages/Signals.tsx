import { motion } from "framer-motion";
import { TrendingUp, Search, LayoutGrid, ArrowUpRight, Lightbulb } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { CountUp } from "../components/CountUp";
import { topSearches, topTabs, trendSignals } from "../data/mock";
import { cn } from "../lib/utils";

const TONE_TEXT: Record<string, string> = {
  teal: "text-fteal-light",
  green: "text-fgreen-light",
  amber: "text-amber",
  coral: "text-coral",
};

export function Signals() {
  return (
    <div className="px-8 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Proaktif Talep Sinyalleri</h1>
        <p className="text-sm text-slate-400 mt-1">
          Mobil bankacılık kullanımı + mevsimsellik + piyasa trendlerinden üretilen fırsat sinyalleri.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {trendSignals.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.4 }}
            className="glass glass-hover p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-semibold text-white leading-snug">{s.title}</div>
                <div className="text-[11px] text-slate-500 mt-1">{s.source}</div>
              </div>
              <div className={cn("flex items-center gap-1 font-bold font-mono text-xl shrink-0", TONE_TEXT[s.tone])}>
                <ArrowUpRight size={17} />
                <CountUp value={s.change} suffix="%" />
              </div>
            </div>
            <Sparkline data={s.spark} tone={s.tone} width={280} height={44} />
            <div className="mt-4 flex gap-2 items-start bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5">
              <Lightbulb size={14} className="text-amber shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber font-bold block mb-0.5">
                  Önerilen aksiyon
                </span>
                <span className="text-xs text-slate-300 leading-snug">{s.action}</span>
              </div>
            </div>
          </motion.div>
        ))}
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
            <span className="text-sm font-semibold text-white">Bu ay en çok kullanılan sekmeler</span>
          </div>
          <div className="space-y-3">
            {topTabs.map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{t.label}</span>
                  <span className="text-slate-500 font-mono">{t.value}</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
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
            <span className="text-sm font-semibold text-white">En çok aranan terimler</span>
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
          <div className="mt-5 text-xs text-slate-400 bg-fteal/[0.06] border border-fteal/20 rounded-xl px-3 py-2.5 leading-relaxed">
            <span className="text-fteal font-semibold">AI notu: </span>
            "kira öderken puan" aramalarındaki artış, genç segment kredi kartı kampanyası için talebin
            organik olarak oluştuğunu gösteriyor — lansman zamanlaması ideal.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
