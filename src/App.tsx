import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { NewCampaign, prefillStudio } from "./pages/NewCampaign";
import { TaskBoard } from "./pages/TaskBoard";
import { Signals } from "./pages/Signals";
import { HistoryPage } from "./pages/History";
import { initialTasks, scoreCampaign, seedCampaigns, type CampaignBrief, type CampaignJob, type DeptCard, type DeptTask, type RouteItem, type TraceEvent } from "./data/mock";

export type Page = "campaign" | "board" | "signals" | "history";

export default function App() {
  const [page, setPage] = useState<Page>("campaign");
  const [tasks, setTasks] = useState<DeptTask[]>(initialTasks);
  const [campaigns, setCampaigns] = useState<CampaignJob[]>(seedCampaigns);

  const updateTask = useCallback((id: string, patch: Partial<DeptTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const advanceTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const order = ["waiting", "processing", "assigned", "done"] as const;
        const i = order.indexOf(t.status);
        return i < order.length - 1 ? { ...t, status: order[i + 1] } : t;
      })
    );
  }, []);

  const waitingCount = tasks.filter((t) => t.status === "waiting" || t.status === "processing").length
    + campaigns.filter((campaign) => campaign.status === "pending" || campaign.status === "processing").length;

  const createCampaign = useCallback((input: {
    title: string;
    idea: string;
    brief: CampaignBrief;
    suggestions: string[];
    routing: RouteItem[];
  }) => {
    const campaign: CampaignJob = {
      id: `cmp-${Date.now()}`,
      title: input.title,
      idea: input.idea,
      brief: input.brief,
      suggestions: input.suggestions,
      routing: input.routing,
      createdAt: new Date().toISOString(),
      status: "pending",
      score: scoreCampaign(input.brief).total,
      trace: [],
    };
    setCampaigns((current) => [campaign, ...current]);
    setPage("board");
  }, []);

  const updateCampaign = useCallback((id: string, patch: Partial<CampaignJob>) => {
    setCampaigns((current) => current.map((campaign) => campaign.id === id ? { ...campaign, ...patch } : campaign));
  }, []);

  const completeCampaign = useCallback((id: string, result: {
    summary: string;
    provider: string;
    model: string;
    analyzedAt: string;
    memory: { refs: string[] };
    cards: DeptCard[];
    trace: TraceEvent[];
  }) => {
    const campaign = campaigns.find((item) => item.id === id);
    if (!campaign) return;
    const now = new Date();
    const assignedAt = `Bugün ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const generated: DeptTask[] = result.cards.map((card, index) => ({
      id: `${id}-${index}`,
      department: card.department,
      title: card.title,
      summary: card.items[0] ?? campaign.idea,
      status: "waiting",
      assignedAt,
      priority: card.department === "Legal" || card.department === "CRM" ? "Yüksek" : "Orta",
      rationale: card.rationale,
      warning: card.warning ?? undefined,
      details: card.details,
      ai: {
        provider: result.provider,
        model: result.model,
        analyzedAt: result.analyzedAt,
        memoryRefs: result.memory.refs,
      },
    }));
    setTasks((current) => [...generated, ...current]);
    setCampaigns((current) => current.map((item) => item.id === id ? {
      ...item,
      status: "completed",
      summary: result.summary,
      provider: result.provider,
      model: result.model,
      trace: result.trace,
    } : item));
  }, [campaigns]);

  return (
    <div className="min-h-screen">
      <Sidebar page={page} onNavigate={setPage} boardBadge={waitingCount} />
      <main className="pl-60">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {page === "campaign" && <NewCampaign onCreateCampaign={createCampaign} />}
            {page === "board" && (
              <TaskBoard
                tasks={tasks}
                campaigns={campaigns}
                onAdvance={advanceTask}
                onUpdateTask={updateTask}
                onUpdateCampaign={updateCampaign}
                onCompleteCampaign={completeCampaign}
                onNewCampaign={() => setPage("campaign")}
              />
            )}
            {page === "signals" && <Signals onConvert={(idea) => { prefillStudio(idea); setPage("campaign"); }} />}
            {page === "history" && <HistoryPage />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
