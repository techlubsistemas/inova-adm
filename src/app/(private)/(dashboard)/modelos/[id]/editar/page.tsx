"use client";

import { ModelForm } from "@/components/models/ModelForm";
import { useApiContext } from "@/context/ApiContext";
import { useLookupContext } from "@/context/LookupContext";
import {
  emptyModelForm,
  mapApiToFormData,
  mapFormToApiPayload,
} from "@/lib/model-mapping";
import type { ModelFormData } from "@/lib/model-form-types";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function EditarModeloPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { GetAPI, PutAPI } = useApiContext();
  const { refetch: refetchLookup } = useLookupContext();

  const [form, setForm] = useState<ModelFormData>(emptyModelForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchModel = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await GetAPI(`/equipment-model/single/${id}`, true);
    if (res.status === 200 && res.body?.equipmentModel) {
      setForm(mapApiToFormData(res.body.equipmentModel));
    } else {
      setError(res.body?.message || "Falha ao carregar modelo.");
    }
    setLoading(false);
  }, [GetAPI, id]);

  useEffect(() => {
    fetchModel();
  }, [fetchModel]);

  async function handleSubmit() {
    setSubmitting(true);
    const payload = mapFormToApiPayload(form);
    const res = await PutAPI(`/equipment-model/single/${id}`, payload, true);
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success("Modelo atualizado.");
      void refetchLookup("service-model");
      router.push("/modelos");
    } else {
      toast.error(res.body?.message || "Erro ao atualizar modelo.");
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
          Editar Modelo
        </h1>
        <p className="text-slate-500">
          Atualize as informações do modelo. Alterações afetam apenas o
          template — equipamentos já criados continuam inalterados.
        </p>
      </div>

      <ModelForm
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/modelos")}
        isSubmitting={submitting}
        isEdit
      />
    </div>
  );
}
