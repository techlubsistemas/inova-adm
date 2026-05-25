"use client";

/**
 * ServicesPageShell — shell genérico de página para Service e ServiceModel.
 *
 * Renderiza: lista paginada com busca + create/edit/delete dialogs.
 * Configurado via props para apontar para o endpoint correto e usar o dialog
 * com ou sem o toggle de periodCountFromLastExecution.
 */

import {
  ServiceFormDialog,
  type ServiceFormData,
  type ServiceRow,
} from "@/components/services/ServiceFormDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { useLookupContext } from "@/context/LookupContext";
import type { LookupKey } from "@/lib/cadastro-types";
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface ServicesPageShellProps {
  /** Lookup key associado (ex: "service" ou "service-model"). */
  lookupKey: LookupKey;
  /** Endpoint base (ex: "/service", "/service-model"). */
  endpointBase: string;
  /** Query string param para DELETE (ex: "services"). */
  deleteParam: string;
  /** Key do array no response GET (ex: "services", "serviceModels"). */
  listKey: string;
  pageTitle: string;
  pageDescription: string;
  entityLabel: string;
  companyScoped: boolean;
  showPeriodToggle?: boolean;
}

export function ServicesPageShell({
  lookupKey,
  endpointBase,
  deleteParam,
  listKey,
  pageTitle,
  pageDescription,
  entityLabel,
  companyScoped,
  showPeriodToggle,
}: ServicesPageShellProps) {
  const { GetAPI, PostAPI, PutAPI, DeleteAPI } = useApiContext();
  const { isSuperAdmin, selectedCompanyId, effectiveCompanyId } = useCompany();
  const { refetch: refetchLookup } = useLookupContext();

  const [items, setItems] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [deleting, setDeleting] = useState<ServiceRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsCompany = companyScoped && isSuperAdmin && !selectedCompanyId;

  const fetchItems = useCallback(async () => {
    if (companyScoped && isSuperAdmin && !selectedCompanyId) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    const url =
      companyScoped && effectiveCompanyId
        ? `${endpointBase}?companyId=${encodeURIComponent(effectiveCompanyId)}`
        : endpointBase;
    const res = await GetAPI(url, true);
    if (res.status === 200) {
      const list =
        (res.body?.[listKey] as ServiceRow[] | undefined) ??
        (Array.isArray(res.body) ? (res.body as ServiceRow[]) : []);
      setItems(list);
    } else {
      setError(res.body?.message || `Falha ao carregar ${entityLabel.toLowerCase()}.`);
      setItems([]);
    }
    setLoading(false);
  }, [
    GetAPI,
    endpointBase,
    listKey,
    entityLabel,
    companyScoped,
    effectiveCompanyId,
    isSuperAdmin,
    selectedCompanyId,
  ]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        (i.name ?? "").toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  async function handleCreate(data: ServiceFormData) {
    setSubmitting(true);
    const payload: ServiceFormData & { companyId?: string } = { ...data };
    if (companyScoped && effectiveCompanyId)
      payload.companyId = effectiveCompanyId;
    const res = await PostAPI(`${endpointBase}/single`, payload, true);
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success(`${entityLabel} criado.`);
      setShowCreate(false);
      fetchItems();
      void refetchLookup(lookupKey);
    } else {
      toast.error(res.body?.message || `Erro ao criar ${entityLabel.toLowerCase()}.`);
    }
  }

  async function handleEdit(data: ServiceFormData) {
    if (!editing?.id) return;
    setSubmitting(true);
    const res = await PutAPI(`${endpointBase}/single/${editing.id}`, data, true);
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success(`${entityLabel} atualizado.`);
      setEditing(null);
      fetchItems();
      void refetchLookup(lookupKey);
    } else {
      toast.error(res.body?.message || `Erro ao atualizar ${entityLabel.toLowerCase()}.`);
    }
  }

  async function handleDelete() {
    if (!deleting?.id) return;
    const res = await DeleteAPI(
      `${endpointBase}?${deleteParam}=${encodeURIComponent(deleting.id)}`,
      true
    );
    if (res.status === 200 || res.status === 201) {
      toast.success(`${entityLabel} removido.`);
      setDeleting(null);
      fetchItems();
      void refetchLookup(lookupKey);
    } else {
      toast.error(
        res.body?.message ||
          "Não foi possível remover. Pode haver registros vinculados."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          <p className="text-slate-500">{pageDescription}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          disabled={needsCompany}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Novo {entityLabel}
        </button>
      </div>

      {needsCompany && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm">
            Selecione uma empresa no dropdown do header para visualizar.
          </p>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={`Buscar ${entityLabel.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-input focus-visible:ring-primary h-9 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm shadow-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Descrição</th>
              <th className="w-24 px-4 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-red-500">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-2 max-w-md truncate text-slate-700">
                    {item.description ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(item)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ServiceFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={handleCreate}
        isSubmitting={submitting}
        entityLabel={entityLabel}
        showPeriodToggle={showPeriodToggle}
      />

      <ServiceFormDialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSubmit={handleEdit}
        isSubmitting={submitting}
        initialData={editing}
        entityLabel={entityLabel}
        showPeriodToggle={showPeriodToggle}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Remover ${entityLabel.toLowerCase()}?`}
        description={
          <>
            O registro <strong>{deleting?.name}</strong> será removido
            permanentemente. Caso esteja vinculado, a operação pode falhar.
          </>
        }
        confirmLabel="Remover"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
