"use client";

import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Loader2, User } from "lucide-react";
import { useEffect, useState } from "react";

interface ScheduleTask {
  id: string;
  code: number;
  title: string;
  status: string;
  scheduledAt: string | null;
  assignee: string | null;
}

const TABS: { label: string; range: string }[] = [
  { label: "Hoje", range: "today" },
  { label: "7 Dias", range: "7d" },
  { label: "15 Dias", range: "15d" },
  { label: "30 Dias", range: "30d" },
];

// status da OS -> coluna do kanban
function columnOf(status: string): "todo" | "in_progress" | "blocked" | "done" {
  if (status === "in_progress") return "in_progress";
  if (status === "paused") return "blocked";
  if (status === "completed") return "done";
  return "todo"; // pending | scheduled
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduleWidget() {
  const { GetAPI } = useApiContext();
  const { effectiveCompanyId } = useCompany();
  const [activeRange, setActiveRange] = useState("today");
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ range: activeRange });
    if (effectiveCompanyId) params.set("companyId", effectiveCompanyId);
    GetAPI(`/dashboard/schedule?${params.toString()}`, true).then((res) => {
      if (!active) return;
      if (res.status === 200) setTasks((res.body?.tasks ?? []) as ScheduleTask[]);
      else setTasks([]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [GetAPI, effectiveCompanyId, activeRange]);

  const byColumn = (col: string) =>
    tasks.filter((t) => columnOf(t.status) === col);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div className="flex items-center gap-2">
          <Calendar className="text-primary h-5 w-5" />
          <h3 className="font-semibold text-slate-800">
            Cronograma de Execução
          </h3>
        </div>
        <div className="flex rounded-lg bg-slate-50 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.range}
              onClick={() => setActiveRange(tab.range)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                activeRange === tab.range
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto p-6">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
            Nenhuma OS no período selecionado.
          </div>
        ) : (
          <div className="flex min-w-[800px] gap-4">
            <KanbanColumn title="A Fazer" status="todo" tasks={byColumn("todo")} />
            <KanbanColumn
              title="Em Andamento"
              status="in_progress"
              tasks={byColumn("in_progress")}
            />
            <KanbanColumn
              title="Pausado"
              status="blocked"
              tasks={byColumn("blocked")}
            />
            <KanbanColumn title="Concluído" status="done" tasks={byColumn("done")} />
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  status,
  tasks,
}: {
  title: string;
  status: string;
  tasks: ScheduleTask[];
}) {
  const statusColors: Record<string, string> = {
    todo: "bg-slate-50 border-slate-200",
    in_progress: "bg-primary/5 border-primary/20",
    blocked: "bg-red-50 border-red-100",
    done: "bg-green-50 border-green-100",
  };
  const dotColors: Record<string, string> = {
    todo: "bg-slate-400",
    in_progress: "bg-primary",
    blocked: "bg-red-500",
    done: "bg-green-500",
  };

  return (
    <div className="min-w-[200px] flex-1">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", dotColors[status])} />
          <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        </div>
        <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
          {tasks.length}
        </span>
      </div>
      <div
        className={cn(
          "min-h-[150px] space-y-2 rounded-xl border p-2",
          statusColors[status],
        )}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: ScheduleTask }) {
  return (
    <div className="group cursor-pointer rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <span className="text-primary text-[10px] font-bold tracking-wider uppercase">
          OS #{task.code}
        </span>
      </div>
      <h5 className="mb-3 text-sm leading-tight font-medium text-slate-800">
        {task.title}
      </h5>
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{formatTime(task.scheduledAt)}</span>
        </div>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500"
          title={task.assignee ? `Responsável: ${task.assignee}` : "Sem responsável"}
        >
          <User className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}
