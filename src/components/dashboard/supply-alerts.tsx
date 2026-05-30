"use client";

import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { cn } from "@/lib/utils";
import { AlertCircle, Droplets, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SupplyAlert {
  id: string;
  name: string;
  sku: string | null;
  stock: number | null;
  min: number | null;
}

export function SupplyAlertsWidget() {
  const { GetAPI } = useApiContext();
  const { effectiveCompanyId } = useCompany();
  const [alerts, setAlerts] = useState<SupplyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const qs = effectiveCompanyId
      ? `?companyId=${encodeURIComponent(effectiveCompanyId)}`
      : "";
    GetAPI(`/dashboard/supply-alerts${qs}`, true).then((res) => {
      if (!active) return;
      if (res.status === 200) setAlerts((res.body?.alerts ?? []) as SupplyAlert[]);
      else setAlerts([]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [GetAPI, effectiveCompanyId]);

  const shown = alerts.slice(0, 6);
  const remaining = alerts.length - shown.length;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-slate-800">Alertas de Insumos</h3>
        </div>
        <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
          {loading ? "…" : alerts.length}
        </span>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="flex h-[150px] items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex h-[150px] items-center justify-center text-sm text-slate-400">
            Nenhum insumo abaixo do estoque mínimo.
          </div>
        ) : (
          shown.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-4 transition-colors hover:bg-slate-50",
                index !== shown.length - 1 && "border-b border-slate-50",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">SKU: {item.sku ?? "—"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">{item.stock ?? 0}</p>
                <p className="text-[10px] text-slate-400">Min: {item.min ?? 0}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && remaining > 0 && (
        <div className="rounded-b-xl border-t border-slate-100 bg-slate-50 p-4 text-center">
          <p className="text-xs text-slate-500">
            Existem mais{" "}
            <span className="font-bold text-slate-700">{remaining} itens</span>{" "}
            abaixo do estoque mínimo.
          </p>
        </div>
      )}
    </div>
  );
}
