"use client";

import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Factory,
} from "lucide-react";
import { useEffect, useState } from "react";

interface KPICardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color: "primary" | "blue" | "green" | "red";
}

function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  color,
}: KPICardProps) {
  const colorMap = {
    primary: "text-primary bg-primary/10 ring-1 ring-primary/20",
    blue: "text-blue-600 bg-blue-50 ring-1 ring-blue-100",
    green: "text-green-600 bg-green-50 ring-1 ring-green-100",
    red: "text-red-600 bg-red-50 ring-1 ring-red-100",
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={cn("rounded-xl p-3", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {description && (
        <p className="text-xs text-slate-400">
          {trend && (
            <span
              className={cn(
                "mr-2 font-medium",
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                    ? "text-red-600"
                    : "text-slate-600",
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "•"} {trendValue}
            </span>
          )}
          {description}
        </p>
      )}
    </div>
  );
}

interface DashboardSummary {
  backlog: { overdue: number; open: number };
  adherence: { planned: number; completed: number; percent: number | null };
  anomalies: { open: number; mttrDays: number | null };
  supplies: { belowMin: number };
  equipment: { total: number; critical: number };
}

export function DashboardKPIs() {
  const { GetAPI } = useApiContext();
  const { effectiveCompanyId } = useCompany();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const qs = effectiveCompanyId
      ? `?companyId=${encodeURIComponent(effectiveCompanyId)}`
      : "";
    GetAPI(`/dashboard/summary${qs}`, true).then((res) => {
      if (!active) return;
      if (res.status === 200) setData(res.body as DashboardSummary);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [GetAPI, effectiveCompanyId]);

  const num = (v: number | null | undefined) =>
    loading ? "…" : v == null ? "—" : String(v);

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Backlog (OS atrasadas)"
        value={num(data?.backlog.overdue)}
        description={loading ? "Carregando..." : `${data?.backlog.open ?? 0} OS em aberto`}
        icon={ClipboardList}
        color="red"
      />
      <KPICard
        title="Aderência ao Plano (30d)"
        value={
          loading
            ? "…"
            : data?.adherence.percent == null
              ? "—"
              : `${data.adherence.percent}%`
        }
        description={
          loading
            ? ""
            : `${data?.adherence.completed ?? 0}/${data?.adherence.planned ?? 0} concluídas no prazo`
        }
        icon={CheckCircle2}
        color="green"
      />
      <KPICard
        title="Anomalias Abertas"
        value={num(data?.anomalies.open)}
        description={
          loading
            ? ""
            : data?.anomalies.mttrDays != null
              ? `MTTR ${data.anomalies.mttrDays} dias`
              : "Sem anomalias resolvidas ainda"
        }
        icon={AlertTriangle}
        color="primary"
      />
      <KPICard
        title="Equipamentos"
        value={num(data?.equipment.total)}
        description={loading ? "" : `${data?.equipment.critical ?? 0} críticos (A)`}
        icon={Factory}
        color="blue"
      />
    </div>
  );
}
