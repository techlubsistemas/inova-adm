"use client";

/**
 * /modelos — Lista de Equipment Models com busca, paginação e ações.
 */

import { XlsxImportButton } from "@/components/cadastros/XlsxImportButton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApiContext } from "@/context/ApiContext";
import { useLookupContext } from "@/context/LookupContext";
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface ModelRow {
  id: string;
  name: string;
  model?: string | null;
  year?: string | null;
  equipmentType?: { id: string; name: string } | null;
  manufacturer?: { id: string; name: string } | null;
}

export default function ModelosPage() {
  const { GetAPI, DeleteAPI } = useApiContext();
  const { refetch: refetchLookup } = useLookupContext();
  const [items, setItems] = useState<ModelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<ModelRow | null>(null);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 15;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await GetAPI("/equipment-model", true);
    if (res.status === 200) {
      const list =
        (res.body?.equipmentModels as ModelRow[] | undefined) ?? [];
      setItems(list);
    } else {
      setError(res.body?.message || "Falha ao carregar modelos.");
      setItems([]);
    }
    setLoading(false);
  }, [GetAPI]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (m) =>
        (m.name ?? "").toLowerCase().includes(q) ||
        (m.model ?? "").toLowerCase().includes(q) ||
        (m.manufacturer?.name ?? "").toLowerCase().includes(q) ||
        (m.equipmentType?.name ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const paginated = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  async function handleDelete() {
    if (!deleting?.id) return;
    const res = await DeleteAPI(
      `/equipment-model?equipmentModels=${encodeURIComponent(deleting.id)}`,
      true
    );
    if (res.status === 200 || res.status === 201) {
      toast.success("Modelo removido.");
      setDeleting(null);
      fetchItems();
      void refetchLookup("service-model"); // se algo refletir
    } else {
      toast.error(
        res.body?.message ||
          "Não foi possível remover. Pode haver equipamentos vinculados."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Modelos de Equipamento
          </h1>
          <p className="text-slate-500">
            Templates reutilizáveis para acelerar o cadastro de equipamentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <XlsxImportButton entityKind="model" onImported={fetchItems} />
          <Link
            href="/modelos/criar"
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Modelo
          </Link>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome, modelo, fabricante ou tipo..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="border-input focus-visible:ring-primary h-9 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm shadow-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Fabricante</th>
              <th className="px-4 py-2 font-medium">Série / Ano</th>
              <th className="w-24 px-4 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-red-500">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nenhum modelo cadastrado.
                </td>
              </tr>
            )}
            {!loading &&
              paginated.map((m) => (
                <tr
                  key={m.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {m.name}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {m.equipmentType?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {m.manufacturer?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {m.model || "—"}
                    {m.year ? ` / ${m.year}` : ""}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/modelos/${m.id}/editar`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleting(m)}
                        className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Remover"
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

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
          <span>
            Página {page + 1} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded border border-slate-200 px-3 py-1 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded border border-slate-200 px-3 py-1 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Remover modelo?"
        description={
          <>
            O modelo <strong>{deleting?.name}</strong> será removido
            permanentemente. Equipamentos criados a partir deste modelo
            continuarão existindo (não há FK).
          </>
        }
        confirmLabel="Remover"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
