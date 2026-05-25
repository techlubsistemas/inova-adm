"use client";

/**
 * MaterialFormDialog — create/edit de Material com ~27 campos em 4 acordeões.
 *
 * Seções:
 * 1. Identificação (nome, sku, descrição, catálogo, posição)
 * 2. Classificação (manufacturer, supplier, materialType, materialFamily, unit)
 * 3. Propriedades Técnicas (viscosity, flashPoint, dnFactor, packaging, etc.)
 * 4. Estoque e Logística (currentStock, minStock, maxStock, resupplyPoint, etc.)
 *
 * Em modo edit, prepopula todos os campos via `initialData`.
 */

import { AccordionSection } from "@/components/cadastros/AccordionSection";
import { EntitySelect } from "@/components/cadastros/EntitySelect";
import { useCompany } from "@/context/CompanyContext";
import { parseNum } from "@/lib/cadastro-helpers";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface MaterialFormData {
  name: string;
  sku?: string;
  description?: string;
  catalog?: string;
  catalogId?: string | null;
  position?: string;
  location?: string;
  unit?: string;
  manufacturerId?: string | null;
  supplierId?: string | null;
  materialTypeId?: string | null;
  materialFamilyId?: string | null;
  greaseConsistency?: string;
  viscosity?: number;
  flashPoint?: number;
  ignitionPoint?: number;
  dnFactor?: number;
  baseOilViscosity?: number;
  greaseThickener?: string;
  packagingType?: string;
  packagingVolume?: number;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  resupplyPoint?: number;
  resupplyTime?: string;
}

export interface MaterialRow extends MaterialFormData {
  id: string;
}

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MaterialFormData) => Promise<void>;
  isSubmitting: boolean;
  initialData?: MaterialRow | null;
}

interface FormState {
  name: string;
  sku: string;
  description: string;
  catalog: string;
  catalogId: string | null;
  position: string;
  location: string;
  unit: string;
  manufacturerId: string | null;
  supplierId: string | null;
  materialTypeId: string | null;
  materialFamilyId: string | null;
  greaseConsistency: string;
  viscosity: string;
  flashPoint: string;
  ignitionPoint: string;
  dnFactor: string;
  baseOilViscosity: string;
  greaseThickener: string;
  packagingType: string;
  packagingVolume: string;
  currentStock: string;
  minStock: string;
  maxStock: string;
  resupplyPoint: string;
  resupplyTime: string;
}

const EMPTY: FormState = {
  name: "",
  sku: "",
  description: "",
  catalog: "",
  catalogId: null,
  position: "",
  location: "",
  unit: "",
  manufacturerId: null,
  supplierId: null,
  materialTypeId: null,
  materialFamilyId: null,
  greaseConsistency: "",
  viscosity: "",
  flashPoint: "",
  ignitionPoint: "",
  dnFactor: "",
  baseOilViscosity: "",
  greaseThickener: "",
  packagingType: "",
  packagingVolume: "",
  currentStock: "",
  minStock: "",
  maxStock: "",
  resupplyPoint: "",
  resupplyTime: "",
};

function fromInitial(item: MaterialRow | null | undefined): FormState {
  if (!item) return { ...EMPTY };
  return {
    name: item.name ?? "",
    sku: item.sku ?? "",
    description: item.description ?? "",
    catalog: item.catalog ?? "",
    catalogId: item.catalogId ?? null,
    position: item.position ?? "",
    location: item.location ?? "",
    unit: item.unit ?? "",
    manufacturerId: item.manufacturerId ?? null,
    supplierId: item.supplierId ?? null,
    materialTypeId: item.materialTypeId ?? null,
    materialFamilyId: item.materialFamilyId ?? null,
    greaseConsistency: item.greaseConsistency ?? "",
    viscosity: item.viscosity != null ? String(item.viscosity) : "",
    flashPoint: item.flashPoint != null ? String(item.flashPoint) : "",
    ignitionPoint: item.ignitionPoint != null ? String(item.ignitionPoint) : "",
    dnFactor: item.dnFactor != null ? String(item.dnFactor) : "",
    baseOilViscosity:
      item.baseOilViscosity != null ? String(item.baseOilViscosity) : "",
    greaseThickener: item.greaseThickener ?? "",
    packagingType: item.packagingType ?? "",
    packagingVolume:
      item.packagingVolume != null ? String(item.packagingVolume) : "",
    currentStock: item.currentStock != null ? String(item.currentStock) : "",
    minStock: item.minStock != null ? String(item.minStock) : "",
    maxStock: item.maxStock != null ? String(item.maxStock) : "",
    resupplyPoint: item.resupplyPoint != null ? String(item.resupplyPoint) : "",
    resupplyTime: item.resupplyTime ?? "",
  };
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: MaterialFormDialogProps) {
  const isEdit = !!initialData?.id;
  const { effectiveCompanyId } = useCompany();
  const [form, setForm] = useState<FormState>(() => fromInitial(initialData));

  useEffect(() => {
    setForm(fromInitial(initialData));
  }, [initialData]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit = useMemo(() => form.name.trim().length > 0, [form.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload: MaterialFormData & { companyId?: string } = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      description: form.description.trim() || undefined,
      catalog: form.catalog.trim() || undefined,
      catalogId: form.catalogId || undefined,
      position: form.position.trim() || undefined,
      location: form.location.trim() || undefined,
      unit: form.unit.trim() || undefined,
      manufacturerId: form.manufacturerId || undefined,
      supplierId: form.supplierId || undefined,
      materialTypeId: form.materialTypeId || undefined,
      materialFamilyId: form.materialFamilyId || undefined,
      greaseConsistency: form.greaseConsistency.trim() || undefined,
      viscosity: parseNum(form.viscosity),
      flashPoint: parseNum(form.flashPoint),
      ignitionPoint: parseNum(form.ignitionPoint),
      dnFactor: parseNum(form.dnFactor),
      baseOilViscosity: parseNum(form.baseOilViscosity),
      greaseThickener: form.greaseThickener.trim() || undefined,
      packagingType: form.packagingType.trim() || undefined,
      packagingVolume: parseNum(form.packagingVolume),
      currentStock: parseNum(form.currentStock),
      minStock: parseNum(form.minStock),
      maxStock: parseNum(form.maxStock),
      resupplyPoint: parseNum(form.resupplyPoint),
      resupplyTime: form.resupplyTime.trim() || undefined,
    };
    if (effectiveCompanyId) payload.companyId = effectiveCompanyId;

    await onSubmit(payload);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {isEdit ? "Editar Material" : "Novo Material"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-600">
                Preencha as seções abaixo. Apenas o nome é obrigatório.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Seção 1: Identificação */}
            <AccordionSection
              title="Identificação"
              description="Nome, SKU, descrição e localização no catálogo"
              defaultOpen
            >
              <div className="grid grid-cols-2 gap-3">
                <FieldText
                  label="Nome *"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  required
                  className="col-span-2"
                  disabled={isSubmitting}
                />
                <FieldText
                  label="SKU"
                  value={form.sku}
                  onChange={(v) => set("sku", v)}
                  disabled={isSubmitting}
                />
                <FieldText
                  label="Catálogo (texto)"
                  value={form.catalog}
                  onChange={(v) => set("catalog", v)}
                  disabled={isSubmitting}
                />
                <FieldText
                  label="Posição"
                  value={form.position}
                  onChange={(v) => set("position", v)}
                  placeholder="Ex: Galpão A - Prateleira 3"
                  disabled={isSubmitting}
                />
                <FieldText
                  label="Localização"
                  value={form.location}
                  onChange={(v) => set("location", v)}
                  disabled={isSubmitting}
                />
                <FieldTextarea
                  label="Descrição"
                  value={form.description}
                  onChange={(v) => set("description", v)}
                  className="col-span-2"
                  disabled={isSubmitting}
                />
              </div>
            </AccordionSection>

            {/* Seção 2: Classificação */}
            <AccordionSection
              title="Classificação"
              description="Fabricante, fornecedor, tipo e família"
            >
              <div className="grid grid-cols-2 gap-3">
                <FieldEntity
                  label="Fabricante"
                  entity="manufacturer"
                  value={form.manufacturerId}
                  onChange={(v) => set("manufacturerId", v)}
                  disabled={isSubmitting}
                />
                <FieldEntity
                  label="Fornecedor"
                  entity="supplier"
                  value={form.supplierId}
                  onChange={(v) => set("supplierId", v)}
                  disabled={isSubmitting}
                />
                <FieldEntity
                  label="Tipo de Material"
                  entity="material-type"
                  value={form.materialTypeId}
                  onChange={(v) => set("materialTypeId", v)}
                  disabled={isSubmitting}
                />
                <FieldEntity
                  label="Família de Material"
                  entity="material-family"
                  value={form.materialFamilyId}
                  onChange={(v) => set("materialFamilyId", v)}
                  disabled={isSubmitting}
                />
                <FieldText
                  label="Unidade (texto)"
                  value={form.unit}
                  onChange={(v) => set("unit", v)}
                  placeholder="Ex: Litro, kg"
                  disabled={isSubmitting}
                />
              </div>
            </AccordionSection>

            {/* Seção 3: Propriedades Técnicas */}
            <AccordionSection
              title="Propriedades Técnicas"
              description="Viscosidade, pontos de fulgor/ignição, embalagem"
            >
              <div className="grid grid-cols-2 gap-3">
                <FieldText
                  label="Consistência da Graxa"
                  value={form.greaseConsistency}
                  onChange={(v) => set("greaseConsistency", v)}
                  placeholder="Ex: NLGI 2"
                  disabled={isSubmitting}
                />
                <FieldText
                  label="Espessante da Graxa"
                  value={form.greaseThickener}
                  onChange={(v) => set("greaseThickener", v)}
                  placeholder="Ex: Sabão de lítio"
                  disabled={isSubmitting}
                />
                <FieldNumber
                  label="Viscosidade (cSt)"
                  value={form.viscosity}
                  onChange={(v) => set("viscosity", v)}
                  disabled={isSubmitting}
                />
                <FieldNumber
                  label="Visc. Óleo Base (cSt)"
                  value={form.baseOilViscosity}
                  onChange={(v) => set("baseOilViscosity", v)}
                  disabled={isSubmitting}
                />
                <FieldNumber
                  label="Ponto de Fulgor (°C)"
                  value={form.flashPoint}
                  onChange={(v) => set("flashPoint", v)}
                  disabled={isSubmitting}
                />
                <FieldNumber
                  label="Ponto de Ignição (°C)"
                  value={form.ignitionPoint}
                  onChange={(v) => set("ignitionPoint", v)}
                  disabled={isSubmitting}
                />
                <FieldNumber
                  label="Fator DN"
                  value={form.dnFactor}
                  onChange={(v) => set("dnFactor", v)}
                  disabled={isSubmitting}
                />
                <FieldText
                  label="Tipo de Embalagem"
                  value={form.packagingType}
                  onChange={(v) => set("packagingType", v)}
                  placeholder="Ex: Tambor"
                  disabled={isSubmitting}
                />
                <FieldNumber
                  label="Volume da Embalagem"
                  value={form.packagingVolume}
                  onChange={(v) => set("packagingVolume", v)}
                  disabled={isSubmitting}
                />
              </div>
            </AccordionSection>

            {/* Seção 4: Estoque */}
            <AccordionSection
              title="Estoque e Logística"
              description="Níveis de estoque, ressuprimento e tempos"
            >
              <div className="grid grid-cols-2 gap-3">
                <FieldNumber
                  label="Estoque Atual"
                  value={form.currentStock}
                  onChange={(v) => set("currentStock", v)}
                  disabled={isSubmitting}
                />
                <FieldNumber
                  label="Ponto de Ressuprimento"
                  value={form.resupplyPoint}
                  onChange={(v) => set("resupplyPoint", v)}
                  disabled={isSubmitting}
                />
                <FieldNumber
                  label="Estoque Mínimo"
                  value={form.minStock}
                  onChange={(v) => set("minStock", v)}
                  disabled={isSubmitting}
                />
                <FieldNumber
                  label="Estoque Máximo"
                  value={form.maxStock}
                  onChange={(v) => set("maxStock", v)}
                  disabled={isSubmitting}
                />
                <FieldText
                  label="Tempo de Ressuprimento"
                  value={form.resupplyTime}
                  onChange={(v) => set("resupplyTime", v)}
                  placeholder="Ex: 7 dias"
                  className="col-span-2"
                  disabled={isSubmitting}
                />
              </div>
            </AccordionSection>

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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de campo
// ─────────────────────────────────────────────────────────────────────────────

const FIELD_INPUT_CLASS =
  "border-input focus-visible:ring-primary h-9 w-full rounded-md border bg-white px-3 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50";

function FieldText({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={FIELD_INPUT_CLASS}
      />
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={FIELD_INPUT_CLASS}
      />
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        className="border-input focus-visible:ring-primary w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
      />
    </div>
  );
}

function FieldEntity({
  label,
  entity,
  value,
  onChange,
  disabled,
  className,
}: {
  label: string;
  entity: Parameters<typeof EntitySelect>[0]["entity"];
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <EntitySelect
        entity={entity}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
