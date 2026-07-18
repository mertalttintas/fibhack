import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { NewCampaign } from "./pages/NewCampaign";
import { TaskBoard } from "./pages/TaskBoard";
import { Signals } from "./pages/Signals";
import { HistoryPage } from "./pages/History";
import { initialTasks, type DeptTask } from "./data/mock";

export type Page = "campaign" | "board" | "signals" | "history";

export default function App() {
  const [page, setPage] = useState<Page>("campaign");
  const [tasks, setTasks] = useState<DeptTask[]>(initialTasks);

  const addTasks = useCallback((newTasks: DeptTask[]) => {
    setTasks((prev) => [...newTasks, ...prev]);
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

  const waitingCount = tasks.filter((t) => t.status === "waiting" || t.status === "processing").length;

  return (
    <div className="min-h-screen diamond-watermark">
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
            {page === "campaign" && (
              <NewCampaign
                onTasksCreated={(t) => {
                  addTasks(t);
                }}
                goToBoard={() => setPage("board")}
              />
            )}
            {page === "board" && <TaskBoard tasks={tasks} onAdvance={advanceTask} />}
            {page === "signals" && <Signals />}
            {page === "history" && <HistoryPage />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
