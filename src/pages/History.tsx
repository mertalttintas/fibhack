import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, Check, ChevronDown, Landmark, Lightbulb, Target, Users, X } from "lucide-react";
import { Sparkline } from "../components/Sparkline";
import { pastCampaigns, type PastCampaign } from "../data/mock";
import { cn } from "../lib/utils";

const RESULT_STYLE: Record<string, string> = {
  Başarılı: "text-fgreen-light bg-fgreen/10 border-fgreen/30",
  Kısmi: "text-amber bg-amber/10 border-amber/30",
  Düşük: "text-coral bg-coral/10 border-coral/30",
};

const RESULT_TONE: Record<string, "green" | "amber" | "coral"> = {
  Başarılı: "green",
  Kısmi: "amber",
  Düşük: "coral",
};

const FILTERS = ["Tümü", "Başarılı", "Kısmi", "Düşük"] as const;

function CampaignRow({ campaign, expanded, onToggle }: { campaign: PastCampaign; expanded: boolean; onToggle: () => void }) {
  const d = campaign.details;
  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={cn("glass overflow-hidden transition", expanded ? "border-fteal/25" : "glass-hover")}>
      <button onClick={onToggle} className="flex w-full items-center gap-5 p-4 text-left">
        <div className="w-28 shrink-0">
          <div className="font-mono text-[11px] text-slate-500">{campaign.date}</div>
          <span className={cn("mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold", RESULT_STYLE[campaign.result])}>{campaign.result}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">{campaign.name}</div>
          <div className="mt-0.5 text-xs text-slate-400">{campaign.insight}</div>
        </div>
        <div className="flex shrink-0 items-center gap-6 text-right">
          <div>
            <div className="font-mono text-lg font-bold text-fteal-light">%{campaign.openRate}</div>
            <div className="text-[10px] text-slate-500">Açılma</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-fgreen-light">%{campaign.conversion}</div>
            <div className="text-[10px] text-slate-500">Dönüşüm</div>
          </div>
          <div className="w-24">
            <div className="text-xs font-medium text-slate-300">{campaign.channel}</div>
            <div className="text-[10px] text-slate-500">Kanal</div>
          </div>
          <ChevronDown size={15} className={cn("text-slate-600 transition-transform", expanded && "rotate-180 text-fteal-light")} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && d && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-white/[.06] p-4">
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-xl border border-white/[.06] bg-white/[.015] p-3.5">
                  <div className="mb-2.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-500"><Target size={11} className="text-fteal" /> Kampanya künyesi</div>
                  <div className="space-y-2.5 text-[11px] leading-4">
                    <div><span className="text-slate-600">Amaç · </span><span className="text-slate-300">{d.objective}</span></div>
                    <div><span className="text-slate-600">Segment · </span><span className="text-slate-300">{d.segment}</span></div>
                    <div><span className="text-slate-600">Süre · </span><span className="text-slate-300">{d.duration}</span></div>
                    <div><span className="text-slate-600">Erişim · </span><span className="text-slate-300">{d.reach}</span></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{d.departments.map((dep) => <span key={dep} className="rounded-full border border-white/[.08] bg-white/[.025] px-2 py-0.5 text-[9px] text-slate-400">{dep}</span>)}</div>
                </div>

                <div className="rounded-xl border border-white/[.06] bg-white/[.015] p-3.5">
                  <div className="mb-2.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-500"><Landmark size={11} className="text-fteal" /> KPI: hedef vs gerçekleşen</div>
                  <div className="space-y-2">
                    {d.kpis.map((kpi) => (
                      <div key={kpi.label} className="flex items-center justify-between gap-3 rounded-lg border border-white/[.05] bg-[#061426]/60 px-2.5 py-2">
                        <span className="text-[10px] text-slate-400">{kpi.label}</span>
                        <span className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="text-slate-600">{kpi.target}</span>
                          <span className="text-slate-700">→</span>
                          <span className={kpi.hit ? "text-fgreen-light" : "text-coral"}>{kpi.actual}</span>
                          {kpi.hit ? <Check size={10} className="text-fgreen-light" /> : <X size={10} className="text-coral" />}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[.06] bg-white/[.015] p-3.5">
                  <div className="mb-2.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-500"><Users size={11} className="text-fteal" /> Haftalık dönüşüm eğrisi</div>
                  <Sparkline data={d.spark} tone={RESULT_TONE[campaign.result]} width={260} height={54} />
                  <div className="mt-1.5 flex justify-between font-mono text-[8px] text-slate-600"><span>1. hafta</span><span>son hafta · %{d.spark[d.spark.length - 1]}</span></div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-amber/15 bg-amber/[.04] p-3.5">
                <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-amber"><Lightbulb size={11} /> Organizational memory'ye işlenen dersler</div>
                <div className="space-y-1.5">
                  {d.learnings.map((learning) => (
                    <div key={learning} className="flex gap-2 text-[11px] leading-4 text-slate-300"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber/70" />{learning}</div>
                  ))}
                </div>
                <div className="mt-2.5 text-[9px] text-slate-600">Bu dersler yeni kampanya analizlerinde benzerlik ve kanal skorlarına otomatik yansıyor.</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function HistoryPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tümü");

  const list = filter === "Tümü" ? pastCampaigns : pastCampaigns.filter((c) => c.result === filter);
  const avgOpen = (pastCampaigns.reduce((sum, c) => sum + c.openRate, 0) / pastCampaigns.length).toFixed(1);
  const avgConversion = (pastCampaigns.reduce((sum, c) => sum + c.conversion, 0) / pastCampaigns.length).toFixed(1);
  const successCount = pastCampaigns.filter((c) => c.result === "Başarılı").length;
  const learningCount = pastCampaigns.reduce((sum, c) => sum + (c.details?.learnings.length ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-8 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white"><Archive size={20} className="text-fteal" /> Geçmiş Kampanyalar</h1>
          <p className="mt-1 text-sm text-slate-400">Organizational memory'nin beslendiği kampanya arşivi — her sonuç bir sonraki kararı eğitiyor.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {FILTERS.map((item) => {
            const count = item === "Tümü" ? pastCampaigns.length : pastCampaigns.filter((c) => c.result === item).length;
            return <button key={item} onClick={() => setFilter(item)} className={cn("rounded-full border px-2.5 py-1 text-[10px] transition", filter === item ? "border-fteal/30 bg-fteal/[.08] text-fteal-light" : "border-white/[.07] text-slate-500 hover:border-white/[.14] hover:text-slate-300")}>{item} <span className="font-mono text-[9px] opacity-70">{count}</span></button>;
          })}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Arşivdeki kampanya", value: String(pastCampaigns.length) },
          { label: "Ortalama açılma", value: `%${avgOpen}` },
          { label: "Ortalama dönüşüm", value: `%${avgConversion}` },
          { label: "Hafızaya işlenen ders", value: String(learningCount) },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="glass p-3.5">
            <div className="font-mono text-xl font-bold text-white">{stat.value}</div>
            <div className="mt-1 text-[10px] text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((campaign) => (
          <CampaignRow key={campaign.id} campaign={campaign} expanded={expandedId === campaign.id} onToggle={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)} />
        ))}
        {list.length === 0 && <div className="glass grid h-32 place-items-center text-xs text-slate-500">Bu sonuçla kampanya yok.</div>}
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        {pastCampaigns.length} kampanya arşivde · {successCount} başarılı · Satıra tıklayarak detayları açabilirsiniz
      </div>
    </div>
  );
}
