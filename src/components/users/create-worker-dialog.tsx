"use client";

/**
 * WorkerDialog — modal de criação OU edição de colaborador.
 *
 * Modo controlado por `initialData` (null = create, objeto = edit).
 * Inclui todos os campos do mobile + accessLevel + workerRoles + auto-atribuição.
 */

import { EntitySelect } from "@/components/cadastros/EntitySelect";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { useLookup } from "@/context/LookupContext";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  rg: z.string().min(1, "RG é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "UF inválido").max(2),
  zipCode: z.string().min(1, "CEP é obrigatório"),
  extension: z.string().optional(),
  accessLevelId: z.string().nullable().optional(),
  workerRoleIds: z.array(z.string()).optional(),
});

export type WorkerFormData = z.infer<typeof schema>;

export interface WorkerInitialData extends Partial<WorkerFormData> {
  id?: string;
}

interface WorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WorkerFormData) => Promise<void>;
  isSubmitting: boolean;
  /** Se fornecido, abre em modo edição com dados pré-preenchidos. */
  initialData?: WorkerInitialData | null;
}

const textFields: {
  name: keyof Omit<WorkerFormData, "accessLevelId" | "workerRoleIds">;
  label: string;
  placeholder: string;
  half?: boolean;
}[] = [
  { name: "name", label: "Nome Completo", placeholder: "Nome do colaborador" },
  { name: "phone", label: "Telefone", placeholder: "(00) 00000-0000", half: true },
  { name: "cpf", label: "CPF", placeholder: "000.000.000-00", half: true },
  { name: "rg", label: "RG", placeholder: "RG", half: true },
  { name: "extension", label: "Ramal (opcional)", placeholder: "Ramal", half: true },
  { name: "address", label: "Endereço", placeholder: "Rua, número" },
  { name: "neighborhood", label: "Bairro", placeholder: "Bairro", half: true },
  { name: "city", label: "Cidade", placeholder: "Cidade", half: true },
  { name: "state", label: "UF", placeholder: "SP", half: true },
  { name: "zipCode", label: "CEP", placeholder: "00000-000", half: true },
];

/**
 * Auto-atribuição de accessLevelId quando o usuário não escolhe um.
 * Espelha a lógica do mobile (WorkerRegistrationSheet.tsx:367-401).
 *
 * Heurística (em ordem):
 *   1. Nível com executeServiceOrders=true E createEquipment=false
 *   2. Nível com nome contendo: técnico, operador, executante, manutenção, chão de fábrica
 *   3. Qualquer nível com executeServiceOrders=true
 *   4. Retorna null se nenhum encontrado
 */
function autoAssignAccessLevel(
  levels: Array<{ id: string; name?: string } & Record<string, unknown>>
): string | null {
  if (levels.length === 0) return null;

  // 1. executeServiceOrders=true E createEquipment=false
  const ideal = levels.find(
    (l) => l.executeServiceOrders === true && l.createEquipment === false
  );
  if (ideal) return ideal.id;

  // 2. Por nome
  const keywords = ["técnico", "tecnico", "operador", "executante", "manutenção", "manutencao", "chão de fábrica", "chao de fabrica"];
  const byName = levels.find((l) =>
    keywords.some((kw) => (l.name ?? "").toLowerCase().includes(kw))
  );
  if (byName) return byName.id;

  // 3. Qualquer com executeServiceOrders=true
  const fallback = levels.find((l) => l.executeServiceOrders === true);
  if (fallback) return fallback.id;

  return null;
}

export function CreateWorkerDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: WorkerDialogProps) {
  const isEdit = !!initialData?.id;
  const { items: accessLevels } = useLookup("access-level");
  const { items: workerRoles } = useLookup("worker-role");

  const defaultValues = useMemo<WorkerFormData>(
    () => ({
      name: initialData?.name ?? "",
      phone: initialData?.phone ?? "",
      cpf: initialData?.cpf ?? "",
      rg: initialData?.rg ?? "",
      address: initialData?.address ?? "",
      neighborhood: initialData?.neighborhood ?? "",
      city: initialData?.city ?? "",
      state: initialData?.state ?? "",
      zipCode: initialData?.zipCode ?? "",
      extension: initialData?.extension ?? "",
      accessLevelId: initialData?.accessLevelId ?? null,
      workerRoleIds: initialData?.workerRoleIds ?? [],
    }),
    [initialData]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<WorkerFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Re-popular o form quando initialData mudar (ex: abrir edit de outro worker)
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const selectedRoleIds = watch("workerRoleIds") ?? [];

  async function handle(data: WorkerFormData) {
    // Auto-atribuição se accessLevelId vazio (apenas em create)
    let finalAccessLevelId = data.accessLevelId;
    if (!isEdit && !finalAccessLevelId) {
      finalAccessLevelId = autoAssignAccessLevel(
        accessLevels as Array<{ id: string; name?: string } & Record<string, unknown>>
      );
    }
    await onSubmit({ ...data, accessLevelId: finalAccessLevelId ?? null });
    if (!isEdit) reset();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v && !isEdit) reset();
        onOpenChange(v);
      }}
      modal
    >
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {isEdit ? "Editar Colaborador" : "Novo Colaborador"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(handle)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {textFields.map((f) => (
                <div
                  key={f.name}
                  className={cn(f.half ? "col-span-1" : "col-span-2")}
                >
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {f.label}
                  </label>
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        onBlur={onBlur}
                        disabled={isSubmitting}
                        className="border-input placeholder:text-muted-foreground focus-visible:ring-primary flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50"
                      />
                    )}
                  />
                  {errors[f.name] && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {errors[f.name]?.message}
                    </p>
                  )}
                </div>
              ))}

              {/* Access Level */}
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Nível de Acesso{" "}
                  {!isEdit && (
                    <span className="text-slate-400">
                      (atribuído automaticamente se vazio)
                    </span>
                  )}
                </label>
                <Controller
                  control={control}
                  name="accessLevelId"
                  render={({ field: { value, onChange } }) => (
                    <EntitySelect
                      entity="access-level"
                      value={value ?? null}
                      onChange={onChange}
                      disabled={isSubmitting}
                      placeholder="Selecionar nível..."
                    />
                  )}
                />
              </div>

              {/* Worker Roles (multi) */}
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Funções / Cargos
                </label>
                <MultiSelectDropdown
                  label="Selecionar funções"
                  items={workerRoles.map((r) => ({
                    id: r.id,
                    name: r.name ?? "",
                  }))}
                  selectedIds={selectedRoleIds}
                  onToggle={(id, checked) => {
                    const current = selectedRoleIds;
                    const next = checked
                      ? [...current, id]
                      : current.filter((x) => x !== id);
                    setValue("workerRoleIds", next, { shouldDirty: true });
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
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
