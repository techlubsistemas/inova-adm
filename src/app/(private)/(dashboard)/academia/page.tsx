"use client";

import { useApiContext } from "@/context/ApiContext";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { uploadFile } from "@/lib/upload";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  Film,
  ImageIcon,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

type LessonKind = "video_upload" | "video_youtube" | "document" | "image";

interface AcademyLesson {
  id: string;
  title: string;
  description?: string | null;
  kind: LessonKind;
  url: string;
  originalName?: string | null;
  durationSeconds?: number | null;
  required: boolean;
}

interface AcademyModule {
  id: string;
  title: string;
  description?: string | null;
  lessons: AcademyLesson[];
}

interface AcademyTrack {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverUrl?: string | null;
  trailerUrl?: string | null;
  level?: string | null;
  published: boolean;
  displayOrder: number;
  modules: AcademyModule[];
  companies: { companyId: string; company: { id: string; corporateName: string } }[];
  workers: { workerId: string }[];
  admins: { adminId: string }[];
}

interface Analytics {
  summary: { learners: number; activeLearners: number; completedLessons: number; documentDownloads: number } | null;
  learners: { id: string; name: string; actorType: string; startedLessons: number; completedLessons: number; averageProgress: number }[];
  tracks: { id: string; title: string; lessons: number; startedBy: number; completions: number }[];
}

const lessonIcon: Record<LessonKind, typeof Film> = {
  video_upload: Film,
  video_youtube: Film,
  document: FileText,
  image: ImageIcon,
};

export default function AcademiaPage() {
  const { GetAPI, PostAPI, PutAPI, DeleteAPI } = useApiContext();
  const { isSuperAdmin, effectiveCompanyId } = useCompany();
  const [tab, setTab] = useState<"catalog" | "analytics">("catalog");
  const [tracks, setTracks] = useState<AcademyTrack[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AcademyTrack | "new" | null>(null);
  const [builder, setBuilder] = useState<AcademyTrack | null>(null);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    const res = await GetAPI("/academy/admin/tracks", true);
    if (res.status === 200) setTracks(res.body.tracks ?? []);
    else toast.error((res.body as { message?: string })?.message ?? "Erro ao carregar a Academia.");
    setLoading(false);
  }, [GetAPI]);

  const loadAnalytics = useCallback(async () => {
    if (!effectiveCompanyId) return;
    const suffix = isSuperAdmin ? `?companyId=${encodeURIComponent(effectiveCompanyId)}` : "";
    const res = await GetAPI(`/academy/admin/analytics${suffix}`, true);
    if (res.status === 200) setAnalytics(res.body as Analytics);
  }, [GetAPI, effectiveCompanyId, isSuperAdmin]);

  useEffect(() => { void loadTracks(); }, [loadTracks]);
  useEffect(() => { if (tab === "analytics") void loadAnalytics(); }, [loadAnalytics, tab]);

  const removeTrack = async (track: AcademyTrack) => {
    if (!confirm(`Excluir a trilha "${track.title}" e todo o conteúdo dela?`)) return;
    const res = await DeleteAPI(`/academy/admin/tracks/${track.id}`, true);
    if (res.status === 200 || res.status === 204) {
      toast.success("Trilha excluída.");
      void loadTracks();
    } else toast.error((res.body as { message?: string })?.message ?? "Erro ao excluir.");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><BookOpen className="h-4 w-4" /> Produto de capacitação</div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academia Inova</h1>
          <p className="mt-1 max-w-2xl text-slate-500">Trilhas comerciais com módulos, vídeos, documentos, público e acompanhamento de consumo.</p>
        </div>
        {isSuperAdmin && tab === "catalog" && (
          <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm">
            <Plus className="h-4 w-4" /> Nova trilha
          </button>
        )}
      </header>

      <div className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1">
        <Tab active={tab === "catalog"} onClick={() => setTab("catalog")} icon={Layers3}>Catálogo</Tab>
        <Tab active={tab === "analytics"} onClick={() => setTab("analytics")} icon={BarChart3}>Acompanhamento</Tab>
      </div>

      {tab === "catalog" ? (
        loading ? <Loading /> : tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-14 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 font-semibold text-slate-800">Nenhuma trilha criada</h2>
            <p className="mt-1 text-sm text-slate-400">Crie a primeira experiência de aprendizagem da Academia.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tracks.map((track) => {
              const lessons = track.modules.reduce((sum, module) => sum + module.lessons.length, 0);
              return (
                <article key={track.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative h-36 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80" style={track.coverUrl ? { backgroundImage: `linear-gradient(90deg,rgba(15,23,42,.85),rgba(15,23,42,.25)),url(${track.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                    <div className="absolute inset-x-4 top-4 flex items-start justify-between">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", track.published ? "bg-emerald-400/90 text-emerald-950" : "bg-white/15 text-white backdrop-blur")}>{track.published ? "Publicada" : "Rascunho"}</span>
                      {track.level && <span className="rounded-full bg-black/30 px-2.5 py-1 text-xs text-white backdrop-blur">{track.level}</span>}
                    </div>
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-slate-900">{track.title}</h2>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{track.description || "Sem descrição."}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Layers3 className="h-3.5 w-3.5" /> {track.modules.length} módulos</span>
                      <span className="flex items-center gap-1"><Film className="h-3.5 w-3.5" /> {lessons} aulas</span>
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {track.companies.length} empresas</span>
                    </div>
                    {isSuperAdmin && (
                      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                        <button onClick={() => setBuilder(track)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/15"><Layers3 className="h-4 w-4" /> Conteúdo</button>
                        <button onClick={() => setEditing(track)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" title="Editar"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => void removeTrack(track)} className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : <AnalyticsPanel analytics={analytics} hasCompany={!!effectiveCompanyId} />}

      {editing && <TrackDialog track={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void loadTracks(); }} />}
      {builder && <BuilderDialog track={builder} PostAPI={PostAPI} PutAPI={PutAPI} DeleteAPI={DeleteAPI} onClose={() => setBuilder(null)} onChanged={async () => { await loadTracks(); const res = await GetAPI("/academy/admin/tracks", true); const next = (res.body?.tracks ?? []).find((item: AcademyTrack) => item.id === builder.id); if (next) setBuilder(next); }} />}
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof BookOpen; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium", active ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800")}><Icon className="h-4 w-4" />{children}</button>;
}

function Loading() { return <div className="flex h-56 items-center justify-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>; }

function TrackDialog({ track, onClose, onSaved }: { track: AcademyTrack | null; onClose: () => void; onSaved: () => void }) {
  const { PostAPI, PutAPI } = useApiContext();
  const { companies } = useCompany();
  const [title, setTitle] = useState(track?.title ?? "");
  const [slug, setSlug] = useState(track?.slug ?? "");
  const [description, setDescription] = useState(track?.description ?? "");
  const [level, setLevel] = useState(track?.level ?? "");
  const [coverUrl, setCoverUrl] = useState(track?.coverUrl ?? "");
  const [published, setPublished] = useState(track?.published ?? false);
  const [companyIds, setCompanyIds] = useState(track?.companies.map((item) => item.companyId) ?? []);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !slug.trim()) return toast.error("Informe título e slug.");
    setSaving(true);
    const body = { title: title.trim(), slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"), description: description.trim() || undefined, level: level.trim() || undefined, coverUrl: coverUrl.trim() || undefined, published };
    const res = track ? await PutAPI(`/academy/admin/tracks/${track.id}`, body, true) : await PostAPI("/academy/admin/tracks", body, true);
    if (res.status === 200) {
      const trackId = track?.id ?? res.body.id;
      const audience = await PutAPI(`/academy/admin/tracks/${trackId}/audience`, { companyIds, workerIds: track?.workers.map((item) => item.workerId) ?? [], adminIds: track?.admins.map((item) => item.adminId) ?? [] }, true);
      if (audience.status === 200) { toast.success(track ? "Trilha atualizada." : "Trilha criada."); onSaved(); }
      else toast.error("A trilha foi salva, mas o público não pôde ser atualizado.");
    } else toast.error((res.body as { message?: string })?.message ?? "Erro ao salvar trilha.");
    setSaving(false);
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(700px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <Dialog.Title className="text-xl font-bold text-slate-900">{track ? "Editar trilha" : "Nova trilha"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">Dados comerciais, publicação e empresas que receberão o catálogo.</Dialog.Description>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Título"><input value={title} onChange={(event) => { setTitle(event.target.value); if (!track) setSlug(event.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} /></Field>
        <Field label="Slug"><input value={slug} onChange={(event) => setSlug(event.target.value)} /></Field>
        <Field label="Nível"><input value={level} onChange={(event) => setLevel(event.target.value)} placeholder="Básico, avançado…" /></Field>
        <Field label="URL da capa"><input value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} placeholder="https://…" /></Field>
        <div className="sm:col-span-2"><Field label="Descrição"><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></Field></div>
      </div>
      <div className="mt-5"><div className="mb-2 text-sm font-medium text-slate-700">Empresas com acesso à trilha</div><div className="grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">{companies.map((company) => <label key={company.id} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={companyIds.includes(company.id)} onChange={() => setCompanyIds((current) => current.includes(company.id) ? current.filter((id) => id !== company.id) : [...current, company.id])} />{company.corporateName}</label>)}</div></div>
      <label className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /><div><div className="text-sm font-semibold text-slate-800">Publicar trilha</div><div className="text-xs text-slate-500">Só conteúdos publicados aparecem para os alunos.</div></div></label>
      <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancelar</button><button onClick={() => void save()} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Salvar</button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<span className="[&>*]:mt-1 [&>*]:w-full [&>*]:rounded-lg [&>*]:border [&>*]:border-slate-200 [&>*]:px-3 [&>*]:py-2 [&>*]:text-sm [&>*]:font-normal [&>*]:outline-none [&>*]:focus:border-primary">{children}</span></label>;
}

function BuilderDialog({ track, PostAPI, DeleteAPI, onClose, onChanged }: { track: AcademyTrack; PostAPI: ReturnType<typeof useApiContext>["PostAPI"]; PutAPI: ReturnType<typeof useApiContext>["PutAPI"]; DeleteAPI: ReturnType<typeof useApiContext>["DeleteAPI"]; onClose: () => void; onChanged: () => Promise<void> }) {
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonModule, setLessonModule] = useState<AcademyModule | null>(null);
  const [saving, setSaving] = useState(false);

  const addModule = async () => {
    if (!moduleTitle.trim()) return;
    setSaving(true); const res = await PostAPI(`/academy/admin/tracks/${track.id}/modules`, { title: moduleTitle.trim(), position: track.modules.length }, true); setSaving(false);
    if (res.status === 200) { setModuleTitle(""); toast.success("Módulo adicionado."); await onChanged(); } else toast.error("Erro ao adicionar módulo.");
  };
  const removeModule = async (module: AcademyModule) => { if (!confirm(`Excluir o módulo "${module.title}" e suas aulas?`)) return; const res = await DeleteAPI(`/academy/admin/modules/${module.id}`, true); if (res.status === 200 || res.status === 204) await onChanged(); };

  return <Dialog.Root open onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(900px,95vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
    <Dialog.Title className="text-xl font-bold text-slate-900">Conteúdo — {track.title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">Organize módulos e aulas na ordem em que serão consumidos.</Dialog.Description>
    <div className="mt-6 flex gap-2"><input value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} placeholder="Nome do novo módulo" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary" /><button onClick={() => void addModule()} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white"><Plus className="h-4 w-4" />Módulo</button></div>
    <div className="mt-5 space-y-4">{track.modules.map((module, index) => <section key={module.id} className="rounded-xl border border-slate-200"><header className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3"><div><span className="mr-2 text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span><strong className="text-sm text-slate-800">{module.title}</strong></div><div className="flex gap-2"><button onClick={() => setLessonModule(module)} className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-primary shadow-sm"><Plus className="h-3.5 w-3.5" />Aula</button><button onClick={() => void removeModule(module)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></header><div className="divide-y divide-slate-100">{module.lessons.length === 0 ? <div className="p-5 text-center text-xs text-slate-400">Módulo vazio.</div> : module.lessons.map((lesson) => { const Icon = lessonIcon[lesson.kind]; return <div key={lesson.id} className="flex items-center gap-3 px-4 py-3"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-slate-800">{lesson.title}</div><div className="text-xs text-slate-400">{lesson.kind.replace("_", " ")}{lesson.durationSeconds ? ` · ${Math.ceil(lesson.durationSeconds / 60)} min` : ""}</div></div><button onClick={async () => { if (!confirm(`Excluir a aula "${lesson.title}"?`)) return; await DeleteAPI(`/academy/admin/lessons/${lesson.id}`, true); await onChanged(); }} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>; })}</div></section>)}</div>
    {lessonModule && <LessonDialog module={lessonModule} onClose={() => setLessonModule(null)} onSaved={async () => { setLessonModule(null); await onChanged(); }} />}
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function LessonDialog({ module, onClose, onSaved }: { module: AcademyModule; onClose: () => void; onSaved: () => Promise<void> }) {
  const { PostAPI } = useApiContext(); const { token } = useAuth();
  const [title, setTitle] = useState(""); const [kind, setKind] = useState<LessonKind>("video_upload"); const [url, setUrl] = useState(""); const [originalName, setOriginalName] = useState(""); const [duration, setDuration] = useState(""); const [uploading, setUploading] = useState(false); const [uploadProgress, setUploadProgress] = useState(0); const [saving, setSaving] = useState(false);
  const file = async (selected?: File) => {
    if (!selected) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadFile(selected, token, setUploadProgress);
      setUrl(result.fullUrl || result.url);
      setOriginalName(selected.name);
      setTitle((current) => current || selected.name.replace(/\.[^.]+$/, ""));
      toast.success("Arquivo enviado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  };
  const save = async () => { if (!title.trim() || !url.trim()) return toast.error("Informe título e conteúdo."); setSaving(true); const res = await PostAPI(`/academy/admin/modules/${module.id}/lessons`, { title: title.trim(), kind, url: url.trim(), originalName: originalName || undefined, durationSeconds: duration ? Number(duration) * 60 : undefined, position: module.lessons.length, required: true }, true); setSaving(false); if (res.status === 200) { toast.success("Aula adicionada."); await onSaved(); } else toast.error((res.body as { message?: string })?.message ?? "Erro ao salvar aula."); };
  return <Dialog.Root open onOpenChange={(open) => !open && onClose()}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[60] bg-slate-950/50" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"><Dialog.Title className="text-lg font-bold text-slate-900">Nova aula — {module.title}</Dialog.Title><div className="mt-5 space-y-4"><Field label="Título"><input value={title} onChange={(event) => setTitle(event.target.value)} /></Field><Field label="Tipo"><select value={kind} onChange={(event) => { setKind(event.target.value as LessonKind); setUrl(""); setOriginalName(""); setUploadProgress(0); }}><option value="video_upload">Vídeo enviado</option><option value="video_youtube">Vídeo do YouTube</option><option value="document">Documento / PDF</option><option value="image">Imagem</option></select></Field>{kind === "video_youtube" ? <Field label="URL do YouTube"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtube.com/…" /></Field> : <div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 hover:bg-slate-50"><Upload className="h-5 w-5" />{uploading ? `Enviando… ${uploadProgress}%` : originalName || "Selecionar arquivo"}<input type="file" className="hidden" disabled={uploading} accept={kind === "video_upload" ? "video/mp4,video/webm,video/quicktime,video/x-matroska" : kind === "document" ? ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt" : "image/jpeg,image/png,image/webp,image/gif"} onChange={(event) => void file(event.target.files?.[0])} /></label>{uploading && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-primary transition-[width]" style={{ width: `${uploadProgress}%` }} /></div>}{url && !uploading && <p className="mt-2 text-xs text-emerald-600">Arquivo pronto para ser adicionado à aula.</p>}</div>}{kind.startsWith("video") && <Field label="Duração aproximada (minutos)"><input type="number" min="0" value={duration} onChange={(event) => setDuration(event.target.value)} /></Field>}</div><div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancelar</button><button onClick={() => void save()} disabled={saving || uploading} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Adicionar</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function AnalyticsPanel({ analytics, hasCompany }: { analytics: Analytics | null; hasCompany: boolean }) {
  if (!hasCompany) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-800">Selecione uma empresa no topo para acompanhar os alunos.</div>;
  if (!analytics?.summary) return <Loading />;
  const cards = [{ label: "Pessoas liberadas", value: analytics.summary.learners, icon: Users }, { label: "Alunos ativos", value: analytics.summary.activeLearners, icon: CheckCircle2 }, { label: "Aulas concluídas", value: analytics.summary.completedLessons, icon: Film }, { label: "Downloads", value: analytics.summary.documentDownloads, icon: FileText }];
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex justify-between text-sm text-slate-500"><span>{label}</span><Icon className="h-5 w-5 text-primary" /></div><strong className="mt-2 block text-2xl text-slate-900">{value}</strong></div>)}</div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-4 py-3">Aluno</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3">Iniciadas</th><th className="px-4 py-3">Concluídas</th><th className="px-4 py-3">Progresso médio</th></tr></thead><tbody>{analytics.learners.map((learner) => <tr key={`${learner.actorType}:${learner.id}`} className="border-t border-slate-100"><td className="px-4 py-3 font-medium text-slate-800">{learner.name}</td><td className="px-4 py-3 text-slate-500">{learner.actorType === "worker" ? "Colaborador" : "Gestor"}</td><td className="px-4 py-3">{learner.startedLessons}</td><td className="px-4 py-3">{learner.completedLessons}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-primary" style={{ width: `${learner.averageProgress}%` }} /></div><span className="text-xs text-slate-500">{learner.averageProgress}%</span></div></td></tr>)}</tbody></table></div></div>;
}
