"use client";

import { ModelForm } from "@/components/models/ModelForm";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import {
  emptyModelForm,
  mapApiToFormData,
  mapFormToEquipmentPayload,
} from "@/lib/model-mapping";
import type { ModelFormData } from "@/lib/model-form-types";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function EditarEquipamentoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { GetAPI, PutAPI } = useApiContext();
  const { effectiveCompanyId } = useCompany();

  const [form, setForm] = useState<ModelFormData>(emptyModelForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await GetAPI(`/equipment/single/${id}`, true);
    if (res.status === 200 && res.body?.equipment) {
      setForm(mapApiToFormData(res.body.equipment));
    } else {
      setError(res.body?.message || "Falha ao carregar equipamento.");
    }
    setLoading(false);
  }, [GetAPI, id]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  async function handleSubmit() {
    setSubmitting(true);
    const payload = mapFormToEquipmentPayload(
      form,
      effectiveCompanyId ?? undefined
    );
    const res = await PutAPI(`/equipment/single/${id}`, payload, true);
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success("Equipamento atualizado.");
      router.push("/equipamentos");
    } else {
      toast.error(res.body?.message || "Erro ao atualizar equipamento.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Editar Equipamento
        </h1>
        <p className="text-slate-500">
          Atualize os dados do equipamento. Alterações são propagadas
          imediatamente.
        </p>
      </div>

      <ModelForm
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/equipamentos")}
        isSubmitting={submitting}
        isEdit
        mode="equipment"
      />
    </div>
  );
}
