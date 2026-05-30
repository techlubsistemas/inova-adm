"use client";

import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import {
  ALL_MODULES,
  MODULE_LABELS,
  type CompanyModule,
} from "@/context/EntitlementContext";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function EmpresasPage() {
  const { companies, isSuperAdmin, loading: companiesLoading } = useCompany();
  const { GetAPI, PutAPI } = useApiContext();
  const [selectedId, setSelectedId] = useState<string>("");
  const [modules, setModules] = useState<CompanyModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedId && companies.length > 0) setSelectedId(companies[0].id);
  }, [companies, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoadingModules(true);
    GetAPI(
      `/entitlement/me?companyId=${encodeURIComponent(selectedId)}`,
      true,
    ).then((res) => {
      if (cancelled) return;
      if (res.status === 200 && Array.isArray(res.body?.modules)) {
        setModules(res.body.modules as CompanyModule[]);
      }
      setLoadingModules(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, GetAPI]);

  const toggle = (m: CompanyModule) =>
    setModules((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    const res = await PutAPI(`/entitlement/${selectedId}`, { modules }, true);
    setSaving(false);
    if (res.status === 200) toast.success("Módulos contratados atualizados.");
    else
      toast.error(
        (res.body as { message?: string })?.message ?? "Erro ao salvar.",
      );
  };

  if (!isSuperAdmin) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Apenas o super admin pode gerenciar os módulos contratados das empresas.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Empresas — Módulos Contratados
        </h1>
        <p className="text-slate-500">
          Defina o que cada cliente comprou. Apenas os módulos habilitados
          aparecem para os usuários da empresa.
        </p>
      </div>

      <div className="max-w-md">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Empresa
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={companiesLoading}
          className="border-input focus-visible:ring-primary h-10 w-full rounded-md border bg-white px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          {companies.length === 0 && <option value="">Nenhuma empresa</option>}
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.corporateName}
            </option>
          ))}
        </select>
      </div>

      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">
          Módulos disponíveis
        </h2>
        {loadingModules ? (
          <div className="flex h-32 items-center justify-center text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {ALL_MODULES.map((m) => (
              <label
                key={m}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={modules.includes(m)}
                  onChange={() => toggle(m)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">
                  {MODULE_LABELS[m]}
                </span>
              </label>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving || !selectedId || loadingModules}
          className="bg-primary hover:bg-primary/90 mt-6 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar módulos
        </button>
      </div>
    </div>
  );
}
