"use client";

import { useApiContext } from "@/context/ApiContext";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { useLookup } from "@/context/LookupContext";
import { uploadFile } from "@/lib/upload";
import { cn } from "@/lib/utils";
import {
  FileText,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

type AttachmentKind = "video_youtube" | "video_upload" | "file";

interface Attachment {
  kind: AttachmentKind;
  url: string;
  originalName?: string;
}

interface TrainingRole {
  workerRole: { id: string; name: string };
}

interface Training {
  id: string;
  title: string;
  description?: string | null;
  level?: string | null;
  attachments: Attachment[];
  roles: TrainingRole[];
}

const KIND_LABEL: Record<AttachmentKind, string> = {
  video_youtube: "YouTube",
  video_upload: "Vídeo (upload)",
  file: "Arquivo / PDF",
};

export default function TreinamentosPage() {
  const { GetAPI, PostAPI, PutAPI, DeleteAPI } = useApiContext();
  const { isSuperAdmin, effectiveCompanyId } = useCompany();
  const [tab, setTab] = useState<"catalogo" | "gestao">("catalogo");
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Training | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchTrainings = useCallback(() => {
    setLoading(true);
    GetAPI("/training", true).then((res) => {
      if (res.status === 200) setTrainings((res.body?.trainings ?? []) as Training[]);
      setLoading(false);
    });
  }, [GetAPI]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const remove = async (t: Training) => {
    if (!confirm(`Remover o treinamento "${t.title}"?`)) return;
    const res = await DeleteAPI(`/training/${t.id}`, true);
    if (res.status === 200 || res.status === 204) {
      toast.success("Treinamento removido.");
      fetchTrainings();
    } else {
      toast.error((res.body as { message?: string })?.message ?? "Erro ao remover.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Treinamentos Operacionais
          </h1>
          <p className="text-slate-500">
            Capacitações obrigatórias vinculadas às funções dos colaboradores.
          </p>
        </div>
        {tab === "catalogo" && isSuperAdmin && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Novo treinamento
          </button>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-50 p-1 w-fit">
        {(["catalogo", "gestao"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {t === "catalogo" ? "Catálogo" : "Gestão"}
          </button>
        ))}
      </div>

      {tab === "catalogo" ? (
        <Catalogo
          trainings={trainings}
          loading={loading}
          canEdit={isSuperAdmin}
          onEdit={(t) => setEditing(t)}
          onRemove={remove}
        />
      ) : (
        <Gestao
          GetAPI={GetAPI}
          isSuperAdmin={isSuperAdmin}
          companyId={effectiveCompanyId}
        />
      )}

      {(creating || editing) && (
        <TrainingFormDialog
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            fetchTrainings();
          }}
          PostAPI={PostAPI}
          PutAPI={PutAPI}
        />
      )}
    </div>
  );
}

function Catalogo({
  trainings,
  loading,
  canEdit,
  onEdit,
  onRemove,
}: {
  trainings: Training[];
  loading: boolean;
  canEdit: boolean;
  onEdit: (t: Training) => void;
  onRemove: (t: Training) => void;
}) {
  if (loading)
    return (
      <div className="flex h-40 items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (trainings.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
        Nenhum treinamento cadastrado.
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {trainings.map((t) => (
        <div
          key={t.id}
          className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="bg-primary/10 text-primary rounded-lg p-2">
              <GraduationCap className="h-5 w-5" />
            </div>
            {canEdit && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(t)}
                  className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <h3 className="font-semibold text-slate-900">{t.title}</h3>
          {t.level && (
            <span className="mt-1 w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {t.level}
            </span>
          )}
          {t.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">
              {t.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {t.attachments.map((a, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded border border-slate-100 bg-slate-50 px-2 py-1"
              >
                {a.kind === "video_youtube" ? (
                  <Youtube className="h-3 w-3 text-red-500" />
                ) : (
                  <FileText className="h-3 w-3 text-slate-400" />
                )}
                {KIND_LABEL[a.kind]}
              </span>
            ))}
          </div>
          {t.roles.length > 0 && (
            <div className="mt-3 border-t border-slate-50 pt-3">
              <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                Funções
              </p>
              <p className="text-xs text-slate-600">
                {t.roles.map((r) => r.workerRole.name).join(", ")}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface GestaoRow {
  workerId: string;
  name: string;
  total: number;
  completed: number;
}

function Gestao({
  GetAPI,
  isSuperAdmin,
  companyId,
}: {
  GetAPI: (url: string, auth: boolean) => Promise<{ status: number; body: any }>;
  isSuperAdmin: boolean;
  companyId: string | null;
}) {
  const [rows, setRows] = useState<GestaoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = isSuperAdmin && companyId ? `?companyId=${encodeURIComponent(companyId)}` : "";
    GetAPI(`/training/gestao${qs}`, true).then((res) => {
      if (res.status === 200) setRows((res.body?.workers ?? []) as GestaoRow[]);
      setLoading(false);
    });
  }, [GetAPI, isSuperAdmin, companyId]);

  if (loading)
    return (
      <div className="flex h-40 items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );

  if (isSuperAdmin && !companyId)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Selecione uma empresa no topo para ver a gestão de treinamentos.
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-2 font-medium">Colaborador</th>
            <th className="px-4 py-2 font-medium">Concluídos</th>
            <th className="px-4 py-2 font-medium">Progresso</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter((r) => r.total > 0).length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                Nenhum colaborador com treinamentos obrigatórios.
              </td>
            </tr>
          )}
          {rows
            .filter((r) => r.total > 0)
            .map((r) => {
              const pct = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
              return (
                <tr key={r.workerId} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-900">{r.name}</td>
                  <td className="px-4 py-2 text-slate-700">
                    {r.completed}/{r.total}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            pct === 100 ? "bg-green-500" : "bg-primary",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

function TrainingFormDialog({
  initial,
  onClose,
  onSaved,
  PostAPI,
  PutAPI,
}: {
  initial: Training | null;
  onClose: () => void;
  onSaved: () => void;
  PostAPI: (url: string, data: unknown, auth: boolean) => Promise<{ status: number; body: any }>;
  PutAPI: (url: string, data: unknown, auth: boolean) => Promise<{ status: number; body: any }>;
}) {
  const { token } = useAuth();
  const { items: roles } = useLookup("worker-role");
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [level, setLevel] = useState(initial?.level ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(
    initial?.attachments?.map((a) => ({
      kind: a.kind,
      url: a.url,
      originalName: a.originalName,
    })) ?? [],
  );
  const [roleIds, setRoleIds] = useState<string[]>(
    initial?.roles?.map((r) => r.workerRole.id) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const addAttachment = () =>
    setAttachments((prev) => [...prev, { kind: "video_youtube", url: "" }]);
  const removeAttachment = (i: number) =>
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  const updateAttachment = (i: number, patch: Partial<Attachment>) =>
    setAttachments((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    );

  const handleUpload = async (i: number, file: File) => {
    setUploadingIdx(i);
    try {
      const res = await uploadFile(file, token);
      updateAttachment(i, { url: res.fullUrl, originalName: file.name });
    } catch {
      toast.error("Falha no upload do arquivo.");
    } finally {
      setUploadingIdx(null);
    }
  };

  const toggleRole = (id: string) =>
    setRoleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const save = async () => {
    if (!title.trim()) {
      toast.error("Informe um título.");
      return;
    }
    const validAttachments = attachments.filter((a) => a.url.trim());
    const payload = {
      title: title.trim(),
      level: level.trim() || undefined,
      description: description.trim() || undefined,
      attachments: validAttachments,
      roleIds,
    };
    setSaving(true);
    const res = isEdit
      ? await PutAPI(`/training/${initial!.id}`, payload, true)
      : await PostAPI("/training", payload, true);
    setSaving(false);
    if (res.status === 200 || res.status === 201) {
      toast.success(isEdit ? "Treinamento atualizado." : "Treinamento criado.");
      onSaved();
    } else {
      toast.error((res.body as { message?: string })?.message ?? "Erro ao salvar.");
    }
  };

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            {isEdit ? "Editar" : "Novo"} treinamento
          </Dialog.Title>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-input h-10 w-full rounded-md border bg-white px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Nível
              </label>
              <input
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="Ex: Básico, Nível 1..."
                className="border-input h-10 w-full rounded-md border bg-white px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="border-input w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>

            {/* Anexos */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">
                  Conteúdo (vídeos / arquivos)
                </label>
                <button
                  type="button"
                  onClick={addAttachment}
                  className="text-primary flex items-center gap-1 text-xs font-medium"
                >
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
              <div className="space-y-2">
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-2 rounded-lg border border-slate-100 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={a.kind}
                        onChange={(e) =>
                          updateAttachment(i, {
                            kind: e.target.value as AttachmentKind,
                            url: "",
                            originalName: undefined,
                          })
                        }
                        className="border-input h-8 rounded-md border bg-white px-2 text-xs"
                      >
                        <option value="video_youtube">YouTube</option>
                        <option value="video_upload">Vídeo (upload)</option>
                        <option value="file">Arquivo / PDF</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="ml-auto text-slate-400 hover:text-red-500"
                        aria-label="Remover anexo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {a.kind === "video_youtube" ? (
                      <input
                        value={a.url}
                        onChange={(e) => updateAttachment(i, { url: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                        className="border-input h-8 w-full rounded-md border bg-white px-2 text-xs"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                          {uploadingIdx === i ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                          Enviar arquivo
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload(i, f);
                            }}
                          />
                        </label>
                        {a.url && (
                          <span className="truncate text-xs text-green-600">
                            {a.originalName ?? "arquivo enviado"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Funções */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Funções que exigem este treinamento
              </label>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label
                    key={r.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                      roleIds.includes(r.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={roleIds.includes(r.id)}
                      onChange={() => toggleRole(r.id)}
                    />
                    {r.name}
                  </label>
                ))}
                {roles.length === 0 && (
                  <span className="text-xs text-slate-400">
                    Nenhuma função cadastrada.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !title.trim()}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
