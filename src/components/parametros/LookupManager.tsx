"use client";

/**
 * LookupManager — UI genérica de CRUD para um lookup.
 *
 * Renderiza: tabela paginada com busca + botões Criar / Editar / Deletar.
 * Configurado pelo LOOKUP_REGISTRY (em LookupContext). Suporta extraFields
 * para lookups com campos além de `name` (ex: period.days, materialFamily.symbol).
 *
 * Para lookups marcados readOnly (ex: access-level), oculta create/edit/delete.
 */

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LOOKUP_REGISTRY, useLookup } from "@/context/LookupContext";
import { useApiMutation } from "@/hooks/useApiMutation";
import type { LookupItem, LookupKey } from "@/lib/cadastro-types";
import * as Dialog from "@radix-ui/react-dialog";
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

interface LookupManagerProps {
  entity: LookupKey;
}

export function LookupManager({ entity }: LookupManagerProps) {
  const entry = LOOKUP_REGISTRY[entity];
  const { items, loading, error, refetch } = useLookup(entity);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<LookupItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<LookupItem | null>(null);

  const PAGE_SIZE = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      String(i.name ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const { submit: deleteSubmit, loading: deleting_ } = useApiMutation({
    url: () =>
      `/${entry.endpoint}?${entry.listKey}=${encodeURIComponent(deleting?.id ?? "")}`,
    method: "DELETE",
    successMessage: `${entry.label} removido.`,
    defaultErrorMessage: `Não foi possível remover. Pode haver registros vinculados.`,
    onSuccess: () => {
      setDeleting(null);
      refetch();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          {entry.label}
        </h2>
        <p className="text-sm text-slate-500">
          {entry.readOnly
            ? "Apenas leitura — gerenciado pelo sistema."
            : `Gerencie os registros de ${entry.label.toLowerCase()}.`}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Buscar ${entry.label.toLowerCase()}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="border-input focus-visible:ring-primary h-9 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm shadow-sm placeholder:text-slate-400 focus-visible:ring-1 focus-visible:outline-none"
          />
        </div>
        {!entry.readOnly && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo {entry.label}
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              {entry.extraFields?.map((f) => (
                <th key={f.key} className="px-4 py-2 font-medium">
                  {f.label}
                </th>
              ))}
              {!entry.readOnly && (
                <th className="w-24 px-4 py-2 text-right font-medium">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={2 + (entry.extraFields?.length ?? 0)}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={2 + (entry.extraFields?.length ?? 0)}
                  className="px-4 py-8 text-center text-red-500"
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && paginated.length === 0 && (
              <tr>
                <td
                  colSpan={2 + (entry.extraFields?.length ?? 0)}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              paginated.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 text-slate-900">{item.name}</td>
                  {entry.extraFields?.map((f) => (
                    <td key={f.key} className="px-4 py-2 text-slate-700">
                      {String(item[f.key] ?? "—")}
                    </td>
                  ))}
                  {!entry.readOnly && (
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
                  )}
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
            onClick={() =>
              setPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={page >= totalPages - 1}
            className="rounded border border-slate-200 px-3 py-1 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Create / Edit dialog */}
      {(creating || editing) && (
        <LookupFormDialog
          entity={entity}
          initialItem={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refetch();
          }}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Remover ${entry.label.toLowerCase()}?`}
        description={
          <>
            O item <strong>{deleting?.name}</strong> será removido permanentemente.
            Caso esteja vinculado a outros cadastros, a operação pode falhar.
          </>
        }
        confirmLabel={deleting_ ? "Removendo..." : "Remover"}
        variant="danger"
        onConfirm={() => {
          void deleteSubmit();
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Dialog (criar / editar)
// ─────────────────────────────────────────────────────────────────────────────

interface LookupFormDialogProps {
  entity: LookupKey;
  initialItem: LookupItem | null;
  onClose: () => void;
  onSaved: () => void;
}

function LookupFormDialog({
  entity,
  initialItem,
  onClose,
  onSaved,
}: LookupFormDialogProps) {
  const entry = LOOKUP_REGISTRY[entity];
  const isEdit = !!initialItem;
  const [name, setName] = useState(initialItem?.name ?? "");
  const [extras, setExtras] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of entry.extraFields ?? []) {
      init[f.key] = String(initialItem?.[f.key] ?? "");
    }
    return init;
  });

  const { submit: submitCreate, loading: loadingCreate } = useApiMutation({
    url: `/${entry.endpoint}/single`,
    method: "POST",
    successMessage: `${entry.label} criado.`,
    onSuccess: () => onSaved(),
  });

  const { submit: submitEdit, loading: loadingEdit } = useApiMutation({
    url: `/${entry.endpoint}/single/${initialItem?.id ?? ""}`,
    method: "PUT",
    successMessage: `${entry.label} atualizado.`,
    onSuccess: () => onSaved(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const payload: Record<string, unknown> = { name: trimmed };
    for (const f of entry.extraFields ?? []) {
      const raw = extras[f.key]?.trim() ?? "";
      if (raw === "" && !f.required) continue;
      if (f.type === "number") {
        const n = Number(raw.replace(",", "."));
        if (Number.isFinite(n)) payload[f.key] = n;
      } else {
        payload[f.key] = raw;
      }
    }

    if (isEdit) {
      void submitEdit(payload);
    } else {
      void submitCreate(payload);
    }
  };

  const loading = loadingCreate || loadingEdit;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            {isEdit ? "Editar" : "Novo"} {entry.label}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-600">
            {isEdit
              ? `Atualize os dados do registro selecionado.`
              : `Preencha as informações para criar um novo registro.`}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="border-input focus-visible:ring-primary h-10 w-full rounded-md border bg-white px-3 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                required
              />
            </div>

            {entry.extraFields?.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={extras[f.key] ?? ""}
                  onChange={(e) =>
                    setExtras((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  disabled={loading}
                  className="border-input focus-visible:ring-primary h-10 w-full rounded-md border bg-white px-3 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                  required={f.required}
                />
              </div>
            ))}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Salvar" : "Criar"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
