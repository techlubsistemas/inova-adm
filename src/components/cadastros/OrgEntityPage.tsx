"use client";

/**
 * OrgEntityPage — página de CRUD para entidades organizacionais simples
 * (Area, AreaModel, Sector, SectorModel).
 *
 * Schema comum: { name, position, [parentId?] }.
 * - position é auto-calculada na criação (max+1) e não é editável pelo usuário.
 * - parentId (opcional) → renderiza um <EntitySelect> com o lookup pai.
 *
 * Usa LookupContext para items + EntitySelect pra parent FK.
 */

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EntitySelect } from "@/components/cadastros/EntitySelect";
import { useCompany } from "@/context/CompanyContext";
import { LOOKUP_REGISTRY, useLookup } from "@/context/LookupContext";
import { useApiMutation } from "@/hooks/useApiMutation";
import type { LookupItem, LookupKey } from "@/lib/cadastro-types";
import * as Dialog from "@radix-ui/react-dialog";
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

interface OrgEntityPageProps {
  /** Lookup key (deve estar no LOOKUP_REGISTRY). */
  entity: LookupKey;
  /** Nome do campo no payload de edit que carrega o id (ex: "areaId" para area). */
  editIdField: string;
  /** Opcional: configuração de parent FK. */
  parent?: {
    /** Lookup key do parent (ex: "area" para sector). */
    entity: LookupKey;
    /** Nome do campo no payload (ex: "areaId" para sector, "areaId" para sectorModel). */
    payloadKey: string;
    /** Label amigável (ex: "Área"). */
    label: string;
  };
  /** Página/título customizado (default: vem do registry). */
  pageTitle?: string;
  /** Subtítulo abaixo do título. */
  pageDescription?: string;
}

export function OrgEntityPage({
  entity,
  parent,
  pageTitle,
  pageDescription,
}: OrgEntityPageProps) {
  const entry = LOOKUP_REGISTRY[entity];
  const { items, loading, error, refetch } = useLookup(entity);
  const { isSuperAdmin, selectedCompanyId } = useCompany();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LookupItem | null>(null);
  const [deleting, setDeleting] = useState<LookupItem | null>(null);

  const PAGE_SIZE = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      String(i.name ?? "")
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const { submit: deleteSubmit } = useApiMutation({
    url: () =>
      `/${entry.endpoint}?${entry.listKey}=${encodeURIComponent(deleting?.id ?? "")}`,
    method: "DELETE",
    successMessage: `${entry.label} removido.`,
    defaultErrorMessage:
      "Não foi possível remover. Pode haver registros vinculados.",
    onSuccess: () => {
      setDeleting(null);
      refetch();
    },
  });

  const needsCompany = entry.companyScoped && isSuperAdmin && !selectedCompanyId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {pageTitle ?? entry.label}
        </h1>
        <p className="text-slate-500">
          {pageDescription ??
            `Gerencie ${entry.label.toLowerCase()} do sistema.`}
        </p>
      </div>

      {needsCompany && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm">
            Selecione uma empresa no dropdown do header para visualizar e
            gerenciar {entry.label.toLowerCase()}.
          </p>
        </div>
      )}

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
        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={needsCompany}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Novo {entry.label}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="w-20 px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Nome</th>
              {parent && (
                <th className="px-4 py-2 font-medium">{parent.label}</th>
              )}
              <th className="w-24 px-4 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={parent ? 4 : 3}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={parent ? 4 : 3}
                  className="px-4 py-8 text-center text-red-500"
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && paginated.length === 0 && (
              <tr>
                <td
                  colSpan={parent ? 4 : 3}
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
                  <td className="px-4 py-2 text-slate-500">
                    {String(item.position ?? "—")}
                  </td>
                  <td className="px-4 py-2 text-slate-900">{item.name}</td>
                  {parent && (
                    <td className="px-4 py-2 text-slate-700">
                      <ParentName
                        parentEntity={parent.entity}
                        parentId={
                          (item[parent.payloadKey] as string | undefined) ?? null
                        }
                      />
                    </td>
                  )}
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

      {(creating || editing) && (
        <OrgEntityFormDialog
          entity={entity}
          parent={parent}
          initialItem={editing}
          existingItems={items}
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

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Remover ${entry.label.toLowerCase()}?`}
        description={
          <>
            O item <strong>{deleting?.name}</strong> será removido
            permanentemente. Caso esteja vinculado a outros cadastros, a
            operação pode falhar.
          </>
        }
        confirmLabel="Remover"
        variant="danger"
        onConfirm={() => {
          void deleteSubmit();
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mostra o nome do parent baseado no parentId (consulta o LookupContext)
// ─────────────────────────────────────────────────────────────────────────────

function ParentName({
  parentEntity,
  parentId,
}: {
  parentEntity: LookupKey;
  parentId: string | null;
}) {
  const { items } = useLookup(parentEntity);
  if (!parentId) return <span className="text-slate-400">—</span>;
  const parent = items.find((i) => i.id === parentId);
  return <>{parent?.name ?? "—"}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Dialog (criar / editar)
// ─────────────────────────────────────────────────────────────────────────────

interface OrgEntityFormDialogProps {
  entity: LookupKey;
  parent?: OrgEntityPageProps["parent"];
  initialItem: LookupItem | null;
  existingItems: LookupItem[];
  onClose: () => void;
  onSaved: () => void;
}

function OrgEntityFormDialog({
  entity,
  parent,
  initialItem,
  existingItems,
  onClose,
  onSaved,
}: OrgEntityFormDialogProps) {
  const entry = LOOKUP_REGISTRY[entity];
  const { effectiveCompanyId } = useCompany();
  const isEdit = !!initialItem;
  const [name, setName] = useState(initialItem?.name ?? "");
  const [parentId, setParentId] = useState<string | null>(
    parent ? ((initialItem?.[parent.payloadKey] as string | undefined) ?? null) : null
  );

  // Auto-calcula próxima position baseada nos items existentes
  const nextPosition = useMemo(() => {
    if (initialItem) return String(initialItem.position ?? "");
    const max = existingItems.reduce((m, i) => {
      const n = parseInt(String(i.position ?? "0"), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return String(max + 1);
  }, [existingItems, initialItem]);

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
    if (parent && !parentId) return;

    const payload: Record<string, unknown> = {
      name: trimmed,
      position: nextPosition,
    };
    if (parent && parentId) {
      payload[parent.payloadKey] = parentId;
    }
    if (entry.companyScoped && effectiveCompanyId) {
      payload.companyId = effectiveCompanyId;
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
              ? "Atualize os dados do registro."
              : "Preencha as informações para criar um novo registro."}
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

            {parent && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  {parent.label} <span className="text-red-500">*</span>
                </label>
                <EntitySelect
                  entity={parent.entity}
                  value={parentId}
                  onChange={setParentId}
                  disabled={loading}
                  placeholder={`Selecionar ${parent.label.toLowerCase()}...`}
                />
              </div>
            )}

            <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-medium">Posição:</span> {nextPosition}{" "}
              <span className="text-slate-400">
                ({isEdit ? "mantida" : "atribuída automaticamente"})
              </span>
            </div>

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
                disabled={loading || !name.trim() || (parent && !parentId)}
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
