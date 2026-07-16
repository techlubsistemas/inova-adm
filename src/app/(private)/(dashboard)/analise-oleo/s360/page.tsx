"use client";

import { useApiContext } from "@/context/ApiContext";
import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FlaskConical,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface S360Result {
  numeroAmostra: string;
  status: "NORMAL" | "ATENCAO" | "ANORMAL" | "CRITICO" | string;
  lido: boolean;
  data: string;
  nomeCompartimento?: string;
  modelo?: string;
  tagFrota?: string;
  chassiSerie?: string;
  area?: string;
  obra?: { id: number; nome: string };
  cliente?: { id: number; nome: string };
}

interface ResultPayload {
  results: S360Result[];
  total: number;
  page: number;
  perPage: number;
  summary?: { normal: number; attention: number; abnormal: number; critical: number };
}

interface Translation {
  text: string;
  locale: string;
}

interface TestResult {
  id: number;
  resultValue?: string;
  value?: string;
  resultStatus: string;
  test?: {
    translation?: { name?: string; abbreviation?: string; unit?: string; method?: string };
    name?: Translation[];
    abbreviation?: Translation[];
    unitOfMeasure?: Translation[];
    method?: Translation[];
    testGroup?: { name?: Translation[] | string };
  };
}

interface S360Detail {
  sampleNumber?: string;
  numeroAmostra?: string;
  result?: string;
  evaluation?: string;
  inspectionsActions?: string;
  resultDate?: string;
  equipment?: { tag?: string; model?: string; serial?: string; area?: string; sector?: string };
  compartment?: { name?: string };
  site?: { id: number; name?: string };
  testResults?: TestResult[];
}

const statusStyle: Record<string, string> = {
  NORMAL: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  ATENCAO: "bg-amber-50 text-amber-700 ring-amber-100",
  ANORMAL: "bg-orange-50 text-orange-700 ring-orange-100",
  CRITICO: "bg-red-50 text-red-700 ring-red-100",
};

const statusLabel: Record<string, string> = {
  NORMAL: "Normal",
  ATENCAO: "Atenção",
  ANORMAL: "Anormal",
  CRITICO: "Crítico",
};

export default function S360Page() {
  const { GetAPI } = useApiContext();
  const { effectiveCompanyId, isSuperAdmin } = useCompany();
  const [payload, setPayload] = useState<ResultPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [sampleNumber, setSampleNumber] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showMappings, setShowMappings] = useState(false);

  const companyQuery =
    isSuperAdmin && effectiveCompanyId
      ? `companyId=${encodeURIComponent(effectiveCompanyId)}`
      : "";

  const load = useCallback(async () => {
    if (isSuperAdmin && !effectiveCompanyId) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (companyQuery) params.set("companyId", effectiveCompanyId ?? "");
    if (status) params.set("status", status);
    if (sampleNumber.trim()) params.set("sampleNumber", sampleNumber.trim());
    const res = await GetAPI(`/s360/results?${params.toString()}`, true);
    if (res.status === 200) setPayload(res.body as ResultPayload);
    else {
      const message =
        (res.body as { message?: string })?.message ??
        "Não foi possível consultar a S360.";
      setError(Array.isArray(message) ? message.join(" ") : message);
    }
    setLoading(false);
  }, [GetAPI, companyQuery, effectiveCompanyId, isSuperAdmin, sampleNumber, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(
    () => [
      { label: "Normal", value: payload?.summary?.normal ?? 0, icon: CheckCircle2, color: "text-emerald-600" },
      { label: "Atenção", value: payload?.summary?.attention ?? 0, icon: AlertTriangle, color: "text-amber-600" },
      { label: "Anormal", value: payload?.summary?.abnormal ?? 0, icon: AlertTriangle, color: "text-orange-600" },
      { label: "Crítico", value: payload?.summary?.critical ?? 0, icon: XCircle, color: "text-red-600" },
    ],
    [payload],
  );

  if (isSuperAdmin && !effectiveCompanyId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-amber-800">
        Selecione uma empresa no topo para visualizar os resultados S360.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <FlaskConical className="h-4 w-4" /> Integração laboratorial
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resultados S360</h1>
          <p className="mt-1 text-slate-500">
            Laudos, condição dos ativos e resultados dos ensaios por obra vinculada.
          </p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowMappings(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Settings2 className="h-4 w-4" /> Mapear obras
            </button>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Atualizar
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <strong className="mt-2 block text-2xl text-slate-900">{value}</strong>
            <span className="text-xs text-slate-400">nesta página</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={sampleNumber}
            onChange={(event) => setSampleNumber(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void load()}
            placeholder="Buscar número da amostra"
            className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary"
        >
          <option value="">Todos os diagnósticos</option>
          <option value="NORMAL">Normal</option>
          <option value="ATENCAO">Atenção</option>
          <option value="ANORMAL">Anormal</option>
          <option value="CRITICO">Crítico</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <div className="flex h-52 items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !payload?.results.length ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          Nenhum resultado encontrado nas obras vinculadas a esta empresa.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Amostra</th>
                <th className="px-4 py-3">Equipamento</th>
                <th className="px-4 py-3">Compartimento</th>
                <th className="px-4 py-3">Obra</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {payload.results.map((item) => (
                <tr key={item.numeroAmostra} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.numeroAmostra}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{item.tagFrota || "—"}</div>
                    <div className="text-xs text-slate-400">{item.modelo}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.nomeCompartimento || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.obra?.nome || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold ring-1", statusStyle[item.status] ?? "bg-slate-50 text-slate-600 ring-slate-100")}>
                      {statusLabel[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(item.data).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(item.numeroAmostra)} className="text-sm font-medium text-primary hover:underline">Ver laudo</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <ResultDialog sampleNumber={selected} companyQuery={companyQuery} onClose={() => setSelected(null)} />}
      {showMappings && <MappingDialog onClose={() => setShowMappings(false)} />}
    </div>
  );
}

function ResultDialog({ sampleNumber, companyQuery, onClose }: { sampleNumber: string; companyQuery: string; onClose: () => void }) {
  const { GetAPI } = useApiContext();
  const { token } = useAuth();
  const [detail, setDetail] = useState<S360Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const suffix = companyQuery ? `?${companyQuery}` : "";

  useEffect(() => {
    GetAPI(`/s360/results/${encodeURIComponent(sampleNumber)}${suffix}`, true).then((res) => {
      if (res.status === 200) setDetail(res.body as S360Detail);
      else toast.error((res.body as { message?: string })?.message ?? "Erro ao abrir o laudo.");
      setLoading(false);
    });
  }, [GetAPI, sampleNumber, suffix]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/s360/results/${encodeURIComponent(sampleNumber)}/pdf${suffix}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Não foi possível abrir o PDF da S360.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(960px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-900">Amostra {sampleNumber}</Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">Detalhes e ensaios laboratoriais retornados pela S360.</Dialog.Description>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">×</button>
          </div>
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : detail ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Resultado" value={statusLabel[detail.result ?? ""] ?? detail.result} />
                <Info label="Equipamento" value={detail.equipment?.tag} />
                <Info label="Modelo" value={detail.equipment?.model} />
                <Info label="Compartimento" value={detail.compartment?.name} />
              </div>
              {(detail.evaluation || detail.inspectionsActions) && (
                <div className="grid gap-3 md:grid-cols-2">
                  <TextPanel title="Avaliação" text={detail.evaluation} />
                  <TextPanel title="Ações recomendadas" text={detail.inspectionsActions} />
                </div>
              )}
              <div>
                <h3 className="mb-3 font-semibold text-slate-900">Resultados dos ensaios</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(detail.testResults ?? []).map((result) => (
                    <div key={result.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-800">{testText(result, "name") || "Ensaio"}</div>
                          <div className="text-xs text-slate-400">{testText(result, "method")}</div>
                        </div>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusStyle[result.resultStatus])}>{statusLabel[result.resultStatus] ?? result.resultStatus}</span>
                      </div>
                      <div className="mt-2 text-lg font-bold text-slate-900">{result.resultValue ?? result.value ?? "—"} <span className="text-xs font-normal text-slate-500">{testText(result, "unit")}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => void downloadPdf()} disabled={downloading} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Abrir PDF oficial
              </button>
              <p className="text-xs text-slate-400">Ao abrir o detalhe ou o PDF, a S360 pode marcar o resultado como lido.</p>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function testText(result: TestResult, field: "name" | "method" | "unit") {
  const direct = result.test?.translation?.[field];
  if (direct) return direct;
  const values = field === "unit" ? result.test?.unitOfMeasure : result.test?.[field];
  if (!Array.isArray(values)) return "";
  return values.find((item) => item.locale === "pt_BR")?.text ?? values[0]?.text ?? "";
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div><div className="text-xs uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 text-sm font-semibold text-slate-800">{value || "—"}</div></div>;
}

function TextPanel({ title, text }: { title: string; text?: string }) {
  return <div className="rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-800">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{text || "—"}</p></div>;
}

interface SiteMapping {
  siteId: number;
  siteName: string;
  companyId: string;
  active: boolean;
}

function MappingDialog({ onClose }: { onClose: () => void }) {
  const { GetAPI, PutAPI } = useApiContext();
  const { companies } = useCompany();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<{ siteId: number; siteName: string }[]>([]);
  const [mappingBySite, setMappingBySite] = useState<Record<number, SiteMapping>>({});
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    GetAPI("/s360/sites", true).then((res) => {
      if (res.status === 200) {
        setAvailable(res.body.available ?? []);
        setMappingBySite(Object.fromEntries((res.body.mappings ?? []).map((mapping: SiteMapping) => [mapping.siteId, mapping])));
      } else toast.error((res.body as { message?: string })?.message ?? "Erro ao consultar obras S360.");
      setLoading(false);
    });
  }, [GetAPI]);

  const save = async (site: { siteId: number; siteName: string }, companyId: string) => {
    const current = mappingBySite[site.siteId];
    if (!companyId && !current) return;
    setSaving(site.siteId);
    const res = await PutAPI(`/s360/sites/${site.siteId}/mapping`, {
      siteName: site.siteName,
      companyId: companyId || current.companyId,
      active: !!companyId,
    }, true);
    if (res.status === 200) {
      setMappingBySite((current) => ({ ...current, [site.siteId]: res.body as SiteMapping }));
      toast.success("Obra vinculada à empresa.");
    } else toast.error((res.body as { message?: string })?.message ?? "Erro ao salvar vínculo.");
    setSaving(null);
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[86vh] w-[min(760px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <Dialog.Title className="text-xl font-bold text-slate-900">Mapeamento de obras S360</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-slate-500">Defina qual empresa Inova pode visualizar cada obra. Sem vínculo, nenhum resultado é exposto.</Dialog.Description>
          {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div> : (
            <div className="mt-5 space-y-3">
              {available.map((site) => (
                <div key={site.siteId} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1"><div className="font-medium text-slate-800">{site.siteName}</div><div className="text-xs text-slate-400">ID S360: {site.siteId}</div></div>
                  <select
                    value={mappingBySite[site.siteId]?.active ? mappingBySite[site.siteId].companyId : ""}
                    onChange={(event) => void save(site, event.target.value)}
                    disabled={saving === site.siteId}
                    className="h-9 min-w-64 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="">Não vinculada</option>
                    {companies.map((company) => <option key={company.id} value={company.id}>{company.corporateName}</option>)}
                  </select>
                  {saving === site.siteId && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
