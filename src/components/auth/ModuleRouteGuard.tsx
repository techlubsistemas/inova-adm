"use client";

import { useCompany } from "@/context/CompanyContext";
import {
  type CompanyModule,
  useEntitlements,
} from "@/context/EntitlementContext";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Prefixo de rota -> módulo exigido. `undefined` = sempre acessível. */
const ROUTE_MODULE: { prefix: string; module?: CompanyModule }[] = [
  { prefix: "/estrutura", module: "CADASTROS" },
  { prefix: "/equipamentos", module: "CADASTROS" },
  { prefix: "/modelos", module: "CADASTROS" },
  { prefix: "/areas", module: "CADASTROS" },
  { prefix: "/setores", module: "CADASTROS" },
  { prefix: "/servicos", module: "CADASTROS" },
  { prefix: "/parametros", module: "CADASTROS" },
  { prefix: "/planejamento", module: "PLANEJAMENTO" },
  { prefix: "/programacao", module: "PLANEJAMENTO" },
  { prefix: "/ordens-servico", module: "ORDENS_SERVICO" },
  { prefix: "/anomalias", module: "ANOMALIAS" },
  { prefix: "/treinamentos", module: "TREINAMENTOS" },
  { prefix: "/analise-oleo", module: "ANALISE_OLEO" },
  { prefix: "/usuarios", module: undefined },
  { prefix: "/empresas", module: undefined },
];

/** Ordem de preferência para onde mandar o usuário quando a rota atual é bloqueada. */
const LANDING_ORDER: { href: string; module?: CompanyModule }[] = [
  { href: "/", module: "DASHBOARD" },
  { href: "/estrutura", module: "CADASTROS" },
  { href: "/planejamento", module: "PLANEJAMENTO" },
  { href: "/ordens-servico", module: "ORDENS_SERVICO" },
  { href: "/anomalias", module: "ANOMALIAS" },
  { href: "/treinamentos", module: "TREINAMENTOS" },
  { href: "/analise-oleo", module: "ANALISE_OLEO" },
  { href: "/usuarios", module: undefined },
];

function moduleForPath(pathname: string): CompanyModule | undefined {
  const hit = ROUTE_MODULE.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  if (hit) return hit.module;
  // raiz "/" é o Dashboard.
  if (pathname === "/") return "DASHBOARD";
  return undefined;
}

/**
 * Bloqueia rotas de módulos não contratados (acesso por URL direta). A sidebar já
 * esconde os itens; isto fecha a porta de quem digita a rota. O backend é a trava
 * definitiva — aqui é só UX. Super admin nunca é bloqueado.
 */
export function ModuleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSuperAdmin } = useCompany();
  const { hasModule, loading } = useEntitlements();

  const required = moduleForPath(pathname);
  const blocked =
    !loading && !isSuperAdmin && !!required && !hasModule(required);

  useEffect(() => {
    if (!blocked) return;
    const target =
      LANDING_ORDER.find((r) => !r.module || hasModule(r.module))?.href ??
      "/usuarios";
    if (target !== pathname) router.replace(target);
  }, [blocked, hasModule, pathname, router]);

  if (blocked) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Módulo não contratado. Redirecionando…</p>
      </div>
    );
  }

  return <>{children}</>;
}
