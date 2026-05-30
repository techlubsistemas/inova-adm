"use client";

import { useApiContext } from "@/context/ApiContext";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CompanyModule =
  | "CADASTROS"
  | "PLANEJAMENTO"
  | "ORDENS_SERVICO"
  | "ANOMALIAS"
  | "DASHBOARD"
  | "TREINAMENTOS"
  | "ANALISE_OLEO";

export const ALL_MODULES: CompanyModule[] = [
  "CADASTROS",
  "PLANEJAMENTO",
  "ORDENS_SERVICO",
  "ANOMALIAS",
  "DASHBOARD",
  "TREINAMENTOS",
  "ANALISE_OLEO",
];

export const MODULE_LABELS: Record<CompanyModule, string> = {
  CADASTROS: "Cadastros",
  PLANEJAMENTO: "Planejamento",
  ORDENS_SERVICO: "Ordens de Serviço",
  ANOMALIAS: "Anomalias",
  DASHBOARD: "Dashboard",
  TREINAMENTOS: "Treinamentos",
  ANALISE_OLEO: "Análise de Óleo",
};

interface EntitlementContextValue {
  enabledModules: CompanyModule[];
  hasModule: (m: CompanyModule) => boolean;
  loading: boolean;
}

const EntitlementContext = createContext<EntitlementContextValue | undefined>(
  undefined,
);

export function useEntitlements() {
  const ctx = useContext(EntitlementContext);
  if (!ctx)
    throw new Error(
      "useEntitlements deve ser usado dentro de <EntitlementProvider>",
    );
  return ctx;
}

export function EntitlementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useAuth();
  const { GetAPI } = useApiContext();
  const { effectiveCompanyId, isSuperAdmin } = useCompany();
  const [enabledModules, setEnabledModules] =
    useState<CompanyModule[]>(ALL_MODULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Super admin não é gateado — enxerga todos os módulos.
    if (!token || isSuperAdmin) {
      setEnabledModules(ALL_MODULES);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    GetAPI("/entitlement/me", true).then((res) => {
      if (cancelled) return;
      if (res.status === 200 && Array.isArray(res.body?.modules)) {
        setEnabledModules(res.body.modules as CompanyModule[]);
      } else {
        setEnabledModules(ALL_MODULES);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [token, isSuperAdmin, effectiveCompanyId, GetAPI]);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      enabledModules,
      hasModule: (m: CompanyModule) => enabledModules.includes(m),
      loading,
    }),
    [enabledModules, loading],
  );

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}
