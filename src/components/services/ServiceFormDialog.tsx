"use client";

/**
 * ServiceFormDialog — form compartilhado para Service e ServiceModel.
 *
 * Service:        name + description + serviceTypeId
 * ServiceModel:   name + description + serviceTypeId + periodCountFromLastExecution
 *
 * O componente é configurado via `showPeriodToggle` (true só para ServiceModel).
 */

import { EntitySelect } from "@/components/cadastros/EntitySelect";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface ServiceFormData {
  name: string;
  description?: string;
  serviceTypeId?: string | null;
  periodCountFromLastExecution?: boolean;
}

export interface ServiceRow extends ServiceFormData {
  id: string;
}

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  isSubmitting: boolean;
  initialData?: ServiceRow | null;
  /** Título customizado (ex: "Novo Serviço" vs "Novo Modelo de Serviço"). */
  entityLabel: string;
  /** Se true, renderiza o toggle de `periodCountFromLastExecution` (apenas ServiceModel). */
  showPeriodToggle?: boolean;
}

interface FormState {
  name: string;
  description: string;
  serviceTypeId: string | null;
  periodCountFromLastExecution: boolean;
}

const EMPTY: FormState = {
  name: "",
  description: "",
  serviceTypeId: null,
  periodCountFromLastExecution: false,
};

function fromInitial(item: ServiceRow | null | undefined): FormState {
  if (!item) return { ...EMPTY };
  return {
    name: item.name ?? "",
    description: item.description ?? "",
    serviceTypeId: item.serviceTypeId ?? null,
    periodCountFromLastExecution: item.periodCountFromLastExecution ?? false,
  };
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
  entityLabel,
  showPeriodToggle = false,
}: ServiceFormDialogProps) {
  const isEdit = !!initialData?.id;
  const [form, setForm] = useState<FormState>(() => fromInitial(initialData));

  useEffect(() => {
    setForm(fromInitial(initialData));
  }, [initialData]);

  const canSubmit = form.name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payload: ServiceFormData = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      serviceTypeId: form.serviceTypeId || undefined,
    };
    if (showPeriodToggle) {
      payload.periodCountFromLastExecution = form.periodCountFromLastExecution;
    }
    await onSubmit(payload);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {isEdit ? "Editar" : "Novo"} {entityLabel}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={isSubmitting}
                className="border-input focus-visible:ring-primary h-10 w-full rounded-md border bg-white px-3 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                disabled={isSubmitting}
                rows={3}
                className="border-input focus-visible:ring-primary w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Tipo de Serviço
              </label>
              <EntitySelect
                entity="service-type"
                value={form.serviceTypeId}
                onChange={(v) => setForm({ ...form, serviceTypeId: v })}
                disabled={isSubmitting}
              />
            </div>

            {showPeriodToggle && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.periodCountFromLastExecution}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        periodCountFromLastExecution: e.target.checked,
                      })
                    }
                    disabled={isSubmitting}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Contar período a partir da última execução
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Se marcado, a periodicidade conta a partir da execução
                      anterior. Se desmarcado, conta a partir da data de
                      planejamento.
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Salvar" : "Criar"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
