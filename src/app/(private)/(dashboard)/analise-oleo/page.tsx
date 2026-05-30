"use client";

import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { cn } from "@/lib/utils";
import { Droplets, Loader2, Plus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

type DiagStatus = "normal" | "caution" | "critical";

interface Finding {
  parameter: string;
  label: string;
  value: number;
  status: DiagStatus;
}
interface Diagnosis {
  overallStatus: DiagStatus;
  findings: Finding[];
  recommendation?: string | null;
  reviewStatus: string;
}
interface OilResult {
  tan?: number | null;
  tbn?: number | null;
  waterContent?: number | null;
  viscosity40?: number | null;
  viscosity100?: number | null;
  iso4406_14um?: number | null;
  oxidation?: number | null;
  pqIndex?: number | null;
  ironPpm?: number | null;
}
interface Sample {
  id: string;
  sampleCode?: string | null;
  collectedAt: string;
  collectedBy?: string | null;
  status: string;
  reviewNotes?: string | null;
  equipment: { id: string; tag: string; name?: string | null };
  result?: OilResult | null;
  diagnosis?: Diagnosis | null;
}
interface EquipmentOption {
  id: string;
  tag: string;
  name?: string | null;
}

const SAMPLE_STATUS_LABEL: Record<string, string> = {
  collected: "Coletada",
  sent_to_lab: "No laboratório",
  results_in: "Resultados recebidos",
  reviewed: "Revisada",
};

const DIAG_BADGE: Record<DiagStatus, string> = {
  normal: "bg-green-50 text-green-700 ring-1 ring-green-100",
  caution: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  critical: "bg-red-50 text-red-700 ring-1 ring-red-100",
};
const DIAG_LABEL: Record<DiagStatus, string> = {
  normal: "Normal",
  caution: "Atenção",
  critical: "Crítico",
};

const RESULT_FIELDS: { key: keyof OilResult; label: string }[] = [
  { key: "tan", label: "TAN" },
  { key: "tbn", label: "TBN" },
  { key: "waterContent", label: "Água (%)" },
  { key: "viscosity40", label: "Visc. 40°C" },
  { key: "viscosity100", label: "Visc. 100°C" },
  { key: "iso4406_14um", label: "ISO ≥14µm" },
  { key: "oxidation", label: "Oxidação" },
  { key: "pqIndex", label: "PQ Index" },
  { key: "ironPpm", label: "Ferro (ppm)" },
];

export default function AnaliseOleoPage() {
  const { GetAPI, PostAPI } = useApiContext();
  const { effectiveCompanyId, isSuperAdmin } = useCompany();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const cidQs = isSuperAdmin && effectiveCompanyId
    ? `?companyId=${encodeURIComponent(effectiveCompanyId)}`
    : "";

  const fetchSamples = useCallback(() => {
    setLoading(true);
    GetAPI(`/oil-sample${cidQs}`, true).then((res) => {
      if (res.status === 200) setSamples((res.body?.samples ?? []) as Sample[]);
      setLoading(false);
    });
  }, [GetAPI, cidQs]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Análise de Óleo
          </h1>
          <p className="text-slate-500">
            Gestão local das amostras com diagnóstico automático e status
            editável.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nova amostra
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : samples.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
          Nenhuma amostra cadastrada.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Equipamento</th>
                <th className="px-4 py-2 font-medium">Código</th>
                <th className="px-4 py-2 font-medium">Coleta</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Diagnóstico</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-900">{s.equipment?.tag}</td>
                  <td className="px-4 py-2 text-slate-600">{s.sampleCode ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {new Date(s.collectedAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {SAMPLE_STATUS_LABEL[s.status] ?? s.status}
                  </td>
                  <td className="px-4 py-2">
                    {s.diagnosis ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          DIAG_BADGE[s.diagnosis.overallStatus],
                        )}
                      >
                        {DIAG_LABEL[s.diagnosis.overallStatus]}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">sem resultado</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setOpenId(s.id)}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <NewSampleDialog
          GetAPI={GetAPI}
          PostAPI={PostAPI}
          companyQs={cidQs}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            fetchSamples();
          }}
        />
      )}

      {openId && (
        <SampleDetailDialog
          sampleId={openId}
          onClose={() => setOpenId(null)}
          onChanged={fetchSamples}
        />
      )}
    </div>
  );
}

function NewSampleDialog({
  GetAPI,
  PostAPI,
  companyQs,
  onClose,
  onSaved,
}: {
  GetAPI: (url: string, auth: boolean) => Promise<{ status: number; body: any }>;
  PostAPI: (url: string, data: unknown, auth: boolean) => Promise<{ status: number; body: any }>;
  companyQs: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [equipments, setEquipments] = useState<EquipmentOption[]>([]);
  const [equipmentId, setEquipmentId] = useState("");
  const [collectedAt, setCollectedAt] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [sampleCode, setSampleCode] = useState("");
  const [collectedBy, setCollectedBy] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    GetAPI(`/equipment${companyQs}`, true).then((res) => {
      if (res.status === 200) {
        const list = (res.body?.equipments ?? res.body ?? []) as EquipmentOption[];
        setEquipments(list);
        if (list.length > 0) setEquipmentId(list[0].id);
      }
    });
  }, [GetAPI, companyQs]);

  const save = async () => {
    if (!equipmentId) {
      toast.error("Selecione um equipamento.");
      return;
    }
    setSaving(true);
    const res = await PostAPI(
      "/oil-sample",
      {
        equipmentId,
        collectedAt: new Date(collectedAt).toISOString(),
        sampleCode: sampleCode.trim() || undefined,
        collectedBy: collectedBy.trim() || undefined,
      },
      true,
    );
    setSaving(false);
    if (res.status === 200 || res.status === 201) {
      toast.success("Amostra criada.");
      onSaved();
    } else {
      toast.error((res.body as { message?: string })?.message ?? "Erro ao criar.");
    }
  };

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            Nova amostra de óleo
          </Dialog.Title>
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Equipamento <span className="text-red-500">*</span>
              </label>
              <select
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                className="border-input h-10 w-full rounded-md border bg-white px-3 text-sm"
              >
                {equipments.length === 0 && <option value="">Nenhum equipamento</option>}
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.tag}
                    {eq.name ? ` — ${eq.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Data da coleta
              </label>
              <input
                type="datetime-local"
                value={collectedAt}
                onChange={(e) => setCollectedAt(e.target.value)}
                className="border-input h-10 w-full rounded-md border bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Código da amostra
              </label>
              <input
                value={sampleCode}
                onChange={(e) => setSampleCode(e.target.value)}
                className="border-input h-10 w-full rounded-md border bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Coletado por
              </label>
              <input
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                className="border-input h-10 w-full rounded-md border bg-white px-3 text-sm"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !equipmentId}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SampleDetailDialog({
  sampleId,
  onClose,
  onChanged,
}: {
  sampleId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { GetAPI, PutAPI } = useApiContext();
  const [sample, setSample] = useState<Sample | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("collected");
  const [reviewNotes, setReviewNotes] = useState("");
  const [savingResult, setSavingResult] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(() => {
    GetAPI(`/oil-sample/${sampleId}`, true).then((res) => {
      if (res.status === 200) {
        const s = res.body as Sample;
        setSample(s);
        setStatus(s.status);
        setReviewNotes(s.reviewNotes ?? "");
        const f: Record<string, string> = {};
        for (const fld of RESULT_FIELDS) {
          const v = s.result?.[fld.key];
          f[fld.key] = v == null ? "" : String(v);
        }
        setForm(f);
      }
    });
  }, [GetAPI, sampleId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveResult = async () => {
    setSavingResult(true);
    const payload: Record<string, number> = {};
    for (const fld of RESULT_FIELDS) {
      const raw = form[fld.key]?.trim();
      if (raw) {
        const n = Number(raw.replace(",", "."));
        if (Number.isFinite(n)) payload[fld.key] = n;
      }
    }
    const res = await PutAPI(`/oil-sample/${sampleId}/result`, payload, true);
    setSavingResult(false);
    if (res.status === 200) {
      toast.success("Resultados salvos e diagnóstico recalculado.");
      setSample(res.body as Sample);
      onChanged();
    } else {
      toast.error((res.body as { message?: string })?.message ?? "Erro ao salvar.");
    }
  };

  const saveStatus = async () => {
    setSavingStatus(true);
    const res = await PutAPI(
      `/oil-sample/${sampleId}/status`,
      { status, reviewNotes, reviewStatus: status === "reviewed" ? "reviewed" : "auto" },
      true,
    );
    setSavingStatus(false);
    if (res.status === 200) {
      toast.success("Status atualizado.");
      setSample(res.body as Sample);
      onChanged();
    } else {
      toast.error((res.body as { message?: string })?.message ?? "Erro ao salvar.");
    }
  };

  const diag = sample?.diagnosis;

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold text-slate-900">
            Amostra — {sample?.equipment?.tag ?? "..."}
          </Dialog.Title>

          {!sample ? (
            <div className="flex h-40 items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Resultados */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">
                  Resultados medidos
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {RESULT_FIELDS.map((fld) => (
                    <div key={fld.key}>
                      <label className="mb-0.5 block text-[11px] text-slate-500">
                        {fld.label}
                      </label>
                      <input
                        value={form[fld.key] ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, [fld.key]: e.target.value }))
                        }
                        className="border-input h-8 w-full rounded-md border bg-white px-2 text-xs"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={saveResult}
                  disabled={savingResult}
                  className="bg-primary hover:bg-primary/90 mt-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  {savingResult && <Loader2 className="h-3 w-3 animate-spin" />}
                  Salvar resultados
                </button>
              </div>

              {/* Diagnóstico + status */}
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Droplets className="h-4 w-4 text-slate-400" />
                    Diagnóstico
                  </h3>
                  {diag ? (
                    <div className="space-y-2">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          DIAG_BADGE[diag.overallStatus],
                        )}
                      >
                        {DIAG_LABEL[diag.overallStatus]}
                      </span>
                      <ul className="space-y-1 text-xs">
                        {diag.findings.map((f) => (
                          <li key={f.parameter} className="flex justify-between">
                            <span className="text-slate-600">{f.label}</span>
                            <span
                              className={cn(
                                "font-medium",
                                f.status === "critical"
                                  ? "text-red-600"
                                  : f.status === "caution"
                                    ? "text-amber-600"
                                    : "text-green-600",
                              )}
                            >
                              {f.value} · {DIAG_LABEL[f.status]}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {diag.recommendation && (
                        <p className="rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                          {diag.recommendation}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Lance os resultados para gerar o diagnóstico.
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">
                    Status / revisão
                  </h3>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="border-input mb-2 h-8 w-full rounded-md border bg-white px-2 text-xs"
                  >
                    {Object.entries(SAMPLE_STATUS_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={2}
                    placeholder="Observações da revisão..."
                    className="border-input mb-2 w-full rounded-md border bg-white px-2 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={saveStatus}
                    disabled={savingStatus}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {savingStatus && <Loader2 className="h-3 w-3 animate-spin" />}
                    Salvar revisão
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
