"use client";

import { ModelForm } from "@/components/models/ModelForm";
import { useApiContext } from "@/context/ApiContext";
import { useLookupContext } from "@/context/LookupContext";
import { emptyModelForm, mapFormToApiPayload } from "@/lib/model-mapping";
import type { ModelFormData } from "@/lib/model-form-types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CriarModeloPage() {
  const router = useRouter();
  const { PostAPI } = useApiContext();
  const { refetch: refetchLookup } = useLookupContext();
  const [form, setForm] = useState<ModelFormData>(emptyModelForm);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const payload = mapFormToApiPayload(form);
    const res = await PostAPI("/equipment-model/single", payload, true);
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success("Modelo criado.");
      void refetchLookup("service-model");
      router.push("/modelos");
    } else {
      toast.error(res.body?.message || "Erro ao criar modelo.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Novo Modelo de Equipamento
        </h1>
        <p className="text-slate-500">
          Preencha as seções abaixo. Apenas nome e tipo de equipamento são
          obrigatórios; as demais informações podem ser completadas depois.
        </p>
      </div>

      <ModelForm
        form={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/modelos")}
        isSubmitting={submitting}
        isEdit={false}
      />
    </div>
  );
}
