"use client";

/**
 * ModelPickerDialog — modal para selecionar um EquipmentModel existente e
 * copiar seus campos para o form de Equipment (botão "Usar Modelo").
 *
 * Após selecionar, o callback `onSelect` recebe o modelo cru — o consumidor
 * decide quais campos copiar (geralmente via `mapApiToFormData`).
 */

import { useApiContext } from "@/context/ApiContext";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ModelLite {
  id: string;
  name: string;
  model?: string | null;
  equipmentType?: { name: string } | null;
  manufacturer?: { name: string } | null;
  [k: string]: unknown;
}

interface ModelPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (model: ModelLite) => void;
}

export function ModelPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: ModelPickerDialogProps) {
  const { GetAPI } = useApiContext();
  const [models, setModels] = useState<ModelLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchModels = useCallback(async () => {
    setLoading(true);
    const res = await GetAPI("/equipment-model", true);
    if (res.status === 200) {
      setModels((res.body?.equipmentModels as ModelLite[]) ?? []);
    }
    setLoading(false);
  }, [GetAPI]);

  useEffect(() => {
    if (open) fetchModels();
  }, [open, fetchModels]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.model ?? "").toLowerCase().includes(q) ||
        (m.equipmentType?.name ?? "").toLowerCase().includes(q)
    );
  }, [models, search]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 max-h-[80vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg outline-none">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                Usar Modelo
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-sm text-slate-600">
                Selecione um modelo existente para pré-preencher os campos do
                equipamento.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="border-b border-slate-100 px-6 py-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, modelo ou tipo..."
                className="border-input focus-visible:ring-primary h-9 w-full rounded-md border bg-white pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto px-6 py-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                {models.length === 0
                  ? "Nenhum modelo cadastrado. Crie um em Modelos primeiro."
                  : "Nenhum resultado para a busca."}
              </p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(m);
                        onOpenChange(false);
                      }}
                      className="hover:border-primary/40 hover:bg-primary/5 flex w-full flex-col items-start gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-left transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-900">
                        {m.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {m.equipmentType?.name ?? "—"}
                        {m.manufacturer?.name ? ` · ${m.manufacturer.name}` : ""}
                        {m.model ? ` · ${m.model}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
