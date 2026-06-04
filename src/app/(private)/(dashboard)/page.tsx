import { DashboardKPIs } from "@/components/dashboard/kpi-cards";
import { ScheduleWidget } from "@/components/dashboard/schedule-widget";
import { SupplyAlertsWidget } from "@/components/dashboard/supply-alerts";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Painel de Controle
          </h1>
          <p className="text-slate-500">
            Visão geral da operação e planejamento.
          </p>
        </div>
      </div>

      {/* A. KPIs de Topo */}
      <DashboardKPIs />

      <div className="grid h-[500px] grid-cols-1 gap-6 lg:grid-cols-3">
        {/* B. Widget: Cronograma (Ocupa 2/3) */}
        <div className="h-full lg:col-span-2">
          <ScheduleWidget />
        </div>

        {/* C. Widget: Alertas de Insumos (Ocupa 1/3) */}
        <div className="h-full lg:col-span-1">
          <SupplyAlertsWidget />
        </div>
      </div>
    </div>
  );
}
