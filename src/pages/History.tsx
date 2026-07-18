import { motion } from "framer-motion";
import { Archive } from "lucide-react";
import { pastCampaigns } from "../data/mock";
import { cn } from "../lib/utils";

const RESULT_STYLE: Record<string, string> = {
  Başarılı: "text-fgreen-light bg-fgreen/10 border-fgreen/30",
  Kısmi: "text-amber bg-amber/10 border-amber/30",
  Düşük: "text-coral bg-coral/10 border-coral/30",
};

export function HistoryPage() {
  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Archive size={20} className="text-fteal" /> Geçmiş Kampanyalar
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Organizational memory'nin beslendiği kampanya arşivi — her sonuç bir sonraki kararı eğitiyor.
        </p>
      </div>

      <div className="space-y-3">
        {pastCampaigns.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass glass-hover p-4 flex items-center gap-5"
          >
            <div className="w-28 shrink-0">
              <div className="text-[11px] text-slate-500 font-mono">{c.date}</div>
              <span className={cn("inline-block mt-1 text-[10px] font-bold border rounded-full px-2 py-0.5", RESULT_STYLE[c.result])}>
                {c.result}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{c.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{c.insight}</div>
            </div>
            <div className="flex gap-6 shrink-0 text-right">
              <div>
                <div className="text-lg font-bold font-mono text-fteal-light">%{c.openRate}</div>
                <div className="text-[10px] text-slate-500">Açılma</div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-fgreen-light">%{c.conversion}</div>
                <div className="text-[10px] text-slate-500">Dönüşüm</div>
              </div>
              <div className="w-24">
                <div className="text-xs text-slate-300 font-medium">{c.channel}</div>
                <div className="text-[10px] text-slate-500">Kanal</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        Toplam 14 kampanya arşivde · Son güncelleme: bugün 09:40
      </div>
    </div>
  );
}
