"use client";

import {
  MaterialFormDialog,
  type MaterialFormData,
  type MaterialRow,
} from "@/components/materials/MaterialFormDialog";
import { MaterialsTable } from "@/components/materials/materials-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { useLookupContext } from "@/context/LookupContext";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function MateriaisPage() {
  const { GetAPI, PostAPI, PutAPI, DeleteAPI } = useApiContext();
  const { isSuperAdmin, selectedCompanyId, effectiveCompanyId } = useCompany();
  const { refetch: refetchLookup } = useLookupContext();

  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [deleting, setDeleting] = useState<MaterialRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = useCallback(async () => {
    if (isSuperAdmin && !selectedCompanyId) {
      setLoading(false);
      setMaterials([]);
      return;
    }
    setLoading(true);
    setError(null);
    const url = effectiveCompanyId
      ? `/material?companyId=${encodeURIComponent(effectiveCompanyId)}`
      : "/material";
    const res = await GetAPI(url, true);
    if (res.status === 200) {
      const list =
        (res.body?.materials as MaterialRow[] | undefined) ??
        (Array.isArray(res.body) ? (res.body as MaterialRow[]) : []);
      setMaterials(list);
    } else {
      setError(res.body?.message || "Falha ao carregar materiais.");
      setMaterials([]);
    }
    setLoading(false);
  }, [GetAPI, effectiveCompanyId, isSuperAdmin, selectedCompanyId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  async function handleCreate(data: MaterialFormData) {
    setSubmitting(true);
    const res = await PostAPI("/material/single", data, true);
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success("Material criado.");
      setShowCreate(false);
      fetchMaterials();
      void refetchLookup("material");
    } else {
      toast.error(res.body?.message || "Erro ao criar material.");
    }
  }

  async function handleEdit(data: MaterialFormData) {
    if (!editing?.id) return;
    setSubmitting(true);
    const res = await PutAPI(`/material/single/${editing.id}`, data, true);
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success("Material atualizado.");
      setEditing(null);
      fetchMaterials();
      void refetchLookup("material");
    } else {
      toast.error(res.body?.message || "Erro ao atualizar material.");
    }
  }

  async function handleDelete() {
    if (!deleting?.id) return;
    const res = await DeleteAPI(
      `/material?materials=${encodeURIComponent(deleting.id)}`,
      true
    );
    if (res.status === 200 || res.status === 201) {
      toast.success("Material removido.");
      setDeleting(null);
      fetchMaterials();
      void refetchLookup("material");
    } else {
      toast.error(
        res.body?.message ||
          "Não foi possível remover. Pode haver registros vinculados."
      );
    }
  }

  const needsCompany = isSuperAdmin && !selectedCompanyId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Materiais
          </h1>
          <p className="text-slate-500">
            Controle de estoque de lubrificantes e insumos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          disabled={needsCompany}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Novo Material
        </button>
      </div>

      {needsCompany && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm">
            Selecione uma empresa no dropdown do header para visualizar os
            materiais.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU ou localização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-input placeholder:text-muted-foreground focus-visible:ring-primary h-9 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
          />
        </div>
      </div>

      <MaterialsTable
        materials={materials}
        loading={loading}
        error={error}
        search={search}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      <MaterialFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={handleCreate}
        isSubmitting={submitting}
      />

      <MaterialFormDialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSubmit={handleEdit}
        isSubmitting={submitting}
        initialData={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Remover material?"
        description={
          <>
            O material <strong>{deleting?.name}</strong> será removido
            permanentemente. Caso esteja vinculado a equipamentos, a operação
            pode falhar.
          </>
        }
        confirmLabel="Remover"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
