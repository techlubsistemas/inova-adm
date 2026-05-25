"use client";

import { ModelForm } from "@/components/models/ModelForm";
import { ModelPickerDialog } from "@/components/models/ModelPickerDialog";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import {
  emptyModelForm,
  mapApiToFormData,
  mapFormToEquipmentPayload,
} from "@/lib/model-mapping";
import type { ModelFormData } from "@/lib/model-form-types";
import { Layers } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CriarEquipamentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledSectorId = searchParams?.get("sectorId") ?? null;
  const { PostAPI } = useApiContext();
  const { isSuperAdmin, selectedCompanyId, effectiveCompanyId } = useCompany();
  const [form, setForm] = useState<ModelFormData>(() => ({
    ...emptyModelForm(),
    sectorId: prefilledSectorId,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Se o sectorId vier por query depois do mount (improvável mas seguro), aplica
  useEffect(() => {
    if (prefilledSectorId && !form.sectorId) {
      setForm((f) => ({ ...f, sectorId: prefilledSectorId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledSectorId]);

  const needsCompany = isSuperAdmin && !selectedCompanyId;

  async function handleSubmit() {
    setSubmitting(true);
    const payload = mapFormToEquipmentPayload(
      form,
      effectiveCompanyId ?? undefined
    );
    const res = await PostAPI("/equipment/single", payload, true);
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success("Equipamento criado.");
      router.push("/equipamentos");
    } else {
      toast.error(res.body?.message || "Erro ao criar equipamento.");
    }
  }

  function handleSelectModel(modelData: { id: string; [k: string]: unknown }) {
    // Mapeia os campos do modelo (que tem mesma forma) para o form, preservando
    // tag/sector vazios (são específicos do equipment).
    const fromModel = mapApiToFormData(
      modelData as Parameters<typeof mapApiToFormData>[0]
    );
    setForm({
      ...fromModel,
      tag: form.tag,
      sectorId: form.sectorId,
      costCenterId: form.costCenterId,
    });
    toast.success("Campos do modelo importados.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Novo Equipamento
          </h1>
          <p className="text-slate-500">
            Preencha as informações do equipamento. TAG, Setor, Nome e Tipo de
            Equipamento são obrigatórios.
          </p>
        </div>
      </div>

      {needsCompany && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm">
            Selecione uma empresa no dropdown do header antes de criar o
            equipamento.
          </p>
        </div>
      )}

      <ModelForm
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/equipamentos")}
        isSubmitting={submitting}
        isEdit={false}
        mode="equipment"
        headerExtras={
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Layers className="h-4 w-4" />
            Usar Modelo
          </button>
        }
      />

      <ModelPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelectModel}
      />
    </div>
  );
}
