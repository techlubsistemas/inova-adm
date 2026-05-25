"use client";

/**
 * ModelForm — form completo de Equipment Model (criar/editar).
 *
 * 7 seções (AccordionSection):
 *  1. Identification
 *  2. Specifications
 *  3. Dynamics
 *  4. Products (Materials array)
 *  5. Fluids (parâmetros)
 *  6. Location
 *  7. Structure (Set → Subset → CIP → Service tree)
 *
 * Estado é local (não usa react-hook-form porque a árvore aninhada não cabe bem
 * em controllers). Toda mutação passa por setters tipados.
 */

import { AccordionSection } from "@/components/cadastros/AccordionSection";
import { EntitySelect } from "@/components/cadastros/EntitySelect";
import { PhotoUpload } from "@/components/cadastros/PhotoUpload";
import { StructureSection } from "@/components/models/StructureSection";
import { CRITICALITY_OPTIONS } from "@/lib/cadastro-helpers";
import { emptyMaterialItem } from "@/lib/model-mapping";
import type {
  Criticality,
  MaterialFormItem,
  ModelFormData,
  SetFormItem,
} from "@/lib/model-form-types";
import type { LookupKey } from "@/lib/cadastro-types";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface ModelFormProps {
  form: ModelFormData;
  onChange: (form: ModelFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEdit: boolean;
  /** "model" (default) ou "equipment". Equipment adiciona tag/sectorId/costCenter. */
  mode?: "model" | "equipment";
  /** Slot opcional pra renderizar botões extras no header (ex: "Usar Modelo"). */
  headerExtras?: React.ReactNode;
}

export function ModelForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isEdit,
  mode = "model",
  headerExtras,
}: ModelFormProps) {
  const isEquipment = mode === "equipment";
  const set = <K extends keyof ModelFormData>(key: K, value: ModelFormData[K]) =>
    onChange({ ...form, [key]: value });

  const canSubmit = isEquipment
    ? form.name.trim().length > 0 &&
      !!form.equipmentTypeId &&
      (form.tag ?? "").trim().length > 0 &&
      !!form.sectorId
    : form.name.trim().length > 0 && !!form.equipmentTypeId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-24">
      {headerExtras && <div className="flex justify-end">{headerExtras}</div>}

      {/* 1. Identification */}
      <AccordionSection
        title="Identificação"
        description="Nome, tipo, fabricante, série e descrição"
        defaultOpen
        badge={
          <span className="text-xs text-red-500">
            * {isEquipment
              ? "Nome, TAG, Setor e Tipo de Equipamento obrigatórios"
              : "Nome e Tipo de Equipamento obrigatórios"}
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {isEquipment && (
            <>
              <Text
                label="TAG *"
                value={form.tag ?? ""}
                onChange={(v) => set("tag", v)}
                disabled={isSubmitting}
                required
                placeholder="Ex: BOM-001"
              />
              <Entity
                label="Setor *"
                entity="sector"
                value={form.sectorId ?? null}
                onChange={(v) => set("sectorId", v)}
                disabled={isSubmitting}
              />
            </>
          )}
          <Text
            label="Nome *"
            value={form.name}
            onChange={(v) => set("name", v)}
            disabled={isSubmitting}
            required
            className="col-span-2"
          />
          <Entity
            label="Tipo de Equipamento *"
            entity="equipment-type"
            value={form.equipmentTypeId}
            onChange={(v) => set("equipmentTypeId", v)}
            disabled={isSubmitting}
          />
          <Entity
            label="Fabricante"
            entity="manufacturer"
            value={form.manufacturerId ?? null}
            onChange={(v) => set("manufacturerId", v)}
            disabled={isSubmitting}
          />
          <Text
            label="Modelo / Série"
            value={form.model ?? ""}
            onChange={(v) => set("model", v)}
            disabled={isSubmitting}
          />
          <Text
            label="Ano de Fabricação"
            value={form.year ?? ""}
            onChange={(v) => set("year", v)}
            disabled={isSubmitting}
          />
          {isEquipment && (
            <Entity
              label="Centro de Custo"
              entity="cost-center"
              value={form.costCenterId ?? null}
              onChange={(v) => set("costCenterId", v)}
              disabled={isSubmitting}
            />
          )}
          <Textarea
            label="Descrição"
            value={form.description ?? ""}
            onChange={(v) => set("description", v)}
            disabled={isSubmitting}
            className="col-span-2"
          />
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Fotos
            </label>
            <PhotoUpload
              value={form.photos}
              onChange={(photos) => set("photos", photos)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </AccordionSection>

      {/* 2. Specifications */}
      <AccordionSection
        title="Especificações Técnicas"
        description="Potência, temperatura, RPM e requisitos"
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Num
            label="Potência"
            value={form.power ?? ""}
            onChange={(v) => set("power", v)}
            disabled={isSubmitting}
          />
          <Entity
            label="Unidade de Potência"
            entity="power-unit"
            value={form.powerUnitId ?? null}
            onChange={(v) => set("powerUnitId", v)}
            disabled={isSubmitting}
          />
          <Entity
            label="Componente Principal"
            entity="main-component"
            value={form.mainComponentId ?? null}
            onChange={(v) => set("mainComponentId", v)}
            disabled={isSubmitting}
          />
          <Entity
            label="Sistema de Lubrificação"
            entity="lubrication-system"
            value={form.lubricationSystemId ?? null}
            onChange={(v) => set("lubricationSystemId", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Temperatura de Operação (°C)"
            value={form.operationTemperature ?? ""}
            onChange={(v) => set("operationTemperature", v)}
            disabled={isSubmitting}
          />
          <Num
            label="RPM"
            value={form.RPM ?? ""}
            onChange={(v) => set("RPM", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Demulsibilidade Requerida"
            value={form.demulsibilityRequired ?? ""}
            onChange={(v) => set("demulsibilityRequired", v)}
            disabled={isSubmitting}
          />
          <Num
            label="FTIR Requerido"
            value={form.ftirRequired ?? ""}
            onChange={(v) => set("ftirRequired", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Oxidação Requerida"
            value={form.oxidationRequired ?? ""}
            onChange={(v) => set("oxidationRequired", v)}
            disabled={isSubmitting}
          />
        </div>
      </AccordionSection>

      {/* 3. Dynamics */}
      <AccordionSection
        title="Dinâmica / Rolamentos"
        description="Diâmetros, rotações e fator DN"
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Num
            label="Diâmetro Externo"
            value={form.externalDiameter ?? ""}
            onChange={(v) => set("externalDiameter", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Diâmetro Interno"
            value={form.innerDiameter ?? ""}
            onChange={(v) => set("innerDiameter", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Largura do Rolamento"
            value={form.bearingWidth ?? ""}
            onChange={(v) => set("bearingWidth", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Rotação Inicial"
            value={form.initialRotation ?? ""}
            onChange={(v) => set("initialRotation", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Rotação Final"
            value={form.finalRotation ?? ""}
            onChange={(v) => set("finalRotation", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Fator DN"
            value={form.DN ?? ""}
            onChange={(v) => set("DN", v)}
            disabled={isSubmitting}
          />
        </div>
      </AccordionSection>

      {/* 4. Products (Materials array) */}
      <AccordionSection
        title="Produtos / Materiais"
        description="Materiais usados pelo modelo e seus filtros associados"
        badge={
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {form.materials.length} material(is)
          </span>
        }
      >
        <ProductsList
          items={form.materials}
          onChange={(materials) => set("materials", materials)}
          disabled={isSubmitting}
        />
      </AccordionSection>

      {/* 5. Fluids (parâmetros) */}
      <AccordionSection
        title="Parâmetros de Fluido"
        description="Verniz, PQI, RPVOT, partículas, TAN, TBN, etc."
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Text
            label="Potencial de Verniz Requerido"
            value={form.varnishPotentialRequired ?? ""}
            onChange={(v) => set("varnishPotentialRequired", v)}
            disabled={isSubmitting}
          />
          <Text
            label="Nível Potencial Verniz"
            value={form.varnishPotentialLevel ?? ""}
            onChange={(v) => set("varnishPotentialLevel", v)}
            disabled={isSubmitting}
          />
          <Text
            label="PQI Requerido"
            value={form.pqiRequired ?? ""}
            onChange={(v) => set("pqiRequired", v)}
            disabled={isSubmitting}
          />
          <Num
            label="RPVOT Requerido (min)"
            value={form.rpvotRequired ?? ""}
            onChange={(v) => set("rpvotRequired", v)}
            disabled={isSubmitting}
          />
          <Text
            label="Contagem de Partículas"
            value={form.particleCountRequired ?? ""}
            onChange={(v) => set("particleCountRequired", v)}
            disabled={isSubmitting}
          />
          <Text
            label="ISO 4406 Requerido"
            value={form.iso4406Required ?? ""}
            onChange={(v) => set("iso4406Required", v)}
            disabled={isSubmitting}
          />
          <Num
            label="TAN Requerido (mgKOH/g)"
            value={form.tanRequired ?? ""}
            onChange={(v) => set("tanRequired", v)}
            disabled={isSubmitting}
          />
          <Num
            label="TBN Requerido (mgKOH/g)"
            value={form.tbnRequired ?? ""}
            onChange={(v) => set("tbnRequired", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Teor de Argila (%)"
            value={form.clayContentRequired ?? ""}
            onChange={(v) => set("clayContentRequired", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Concentração (%)"
            value={form.concentrationPercentage ?? ""}
            onChange={(v) => set("concentrationPercentage", v)}
            disabled={isSubmitting}
          />
          <Num
            label="pH"
            value={form.phLevel ?? ""}
            onChange={(v) => set("phLevel", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Alcalinidade (mgKOH/g)"
            value={form.alkalinity ?? ""}
            onChange={(v) => set("alkalinity", v)}
            disabled={isSubmitting}
          />
          <Num
            label="Tramp Oil (%)"
            value={form.trampOilPercentage ?? ""}
            onChange={(v) => set("trampOilPercentage", v)}
            disabled={isSubmitting}
          />
          <Text
            label="Nível de Contaminação"
            value={form.contaminationLevel ?? ""}
            onChange={(v) => set("contaminationLevel", v)}
            disabled={isSubmitting}
          />
        </div>
      </AccordionSection>

      {/* 6. Location */}
      <AccordionSection
        title="Localização e Operação"
        description="Posição física, criticidade, regime e segurança"
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Text
            label="Posição Física"
            value={form.physicalPosition ?? ""}
            onChange={(v) => set("physicalPosition", v)}
            disabled={isSubmitting}
            className="lg:col-span-2"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Criticidade
            </label>
            <select
              value={form.criticality ?? ""}
              onChange={(e) =>
                set(
                  "criticality",
                  (e.target.value || null) as Criticality | null
                )
              }
              disabled={isSubmitting}
              className="border-input focus-visible:ring-primary h-9 w-full rounded-md border bg-white px-3 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            >
              <option value="">—</option>
              {CRITICALITY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Text
            label="Regime de Operação"
            value={form.operationRegime ?? ""}
            onChange={(v) => set("operationRegime", v)}
            disabled={isSubmitting}
            placeholder="Contínuo / Intermitente / Parado"
          />
          <Text
            label="Posição"
            value={form.position ?? ""}
            onChange={(v) => set("position", v)}
            disabled={isSubmitting}
          />
        </div>
      </AccordionSection>

      {/* 7. Structure (tree) */}
      <AccordionSection
        title="Estrutura"
        description="Hierarquia Conjunto → Subconjunto → CIP → Serviço"
        badge={
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {form.sets.length} conjunto(s)
          </span>
        }
      >
        <StructureSection
          sets={form.sets}
          onChange={(sets: SetFormItem[]) => set("sets", sets)}
        />
      </AccordionSection>

      {/* Sticky footer — colado na base da viewport; padding-bottom no form garante que conteúdo não fique atrás */}
      <div className="fixed right-0 bottom-0 left-0 z-10 border-t border-slate-200 bg-white px-6 py-3 shadow-lg lg:left-20">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit
              ? isEquipment
                ? "Salvar Equipamento"
                : "Salvar Modelo"
              : isEquipment
                ? "Criar Equipamento"
                : "Criar Modelo"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductsList (Materials)
// ─────────────────────────────────────────────────────────────────────────────

function ProductsList({
  items,
  onChange,
  disabled,
}: {
  items: MaterialFormItem[];
  onChange: (items: MaterialFormItem[]) => void;
  disabled?: boolean;
}) {
  const addItem = () => onChange([...items, emptyMaterialItem()]);
  const updateItem = (idx: number, patch: Partial<MaterialFormItem>) =>
    onChange(items.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  const removeItem = (idx: number) =>
    onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="rounded border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          Nenhum material associado.
        </p>
      )}
      {items.map((m, i) => (
        <div
          key={m.tempId}
          className="rounded-md border border-slate-200 bg-white p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Material #{i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={disabled}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            <Mini label="Material *">
              <EntitySelect
                entity="material"
                value={m.materialId || null}
                onChange={(v) => updateItem(i, { materialId: v ?? "" })}
                disabled={disabled}
              />
            </Mini>
            <Mini label="Volume">
              <input
                type="text"
                inputMode="decimal"
                value={m.volume ?? ""}
                onChange={(e) => updateItem(i, { volume: e.target.value })}
                disabled={disabled}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </Mini>
            <Mini label="Unidade">
              <EntitySelect
                entity="unit"
                value={m.unitId ?? null}
                onChange={(v) => updateItem(i, { unitId: v })}
                disabled={disabled}
              />
            </Mini>
            <Mini label="Nível Contaminação">
              <select
                value={m.contaminationLevel ?? ""}
                onChange={(e) =>
                  updateItem(i, { contaminationLevel: e.target.value })
                }
                disabled={disabled}
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">—</option>
                <option value="Leve">Leve</option>
                <option value="Médio">Médio</option>
                <option value="Crítico">Crítico</option>
              </select>
            </Mini>
            <Mini label="Filtro Óleo">
              <EntitySelect
                entity="filter-oil"
                value={m.filterOilId ?? null}
                onChange={(v) => updateItem(i, { filterOilId: v })}
                disabled={disabled}
              />
            </Mini>
            <Mini label="Filtro Pressão">
              <EntitySelect
                entity="filter-pressure"
                value={m.filterPressureId ?? null}
                onChange={(v) => updateItem(i, { filterPressureId: v })}
                disabled={disabled}
              />
            </Mini>
            <Mini label="Filtro Sucção">
              <EntitySelect
                entity="filter-suction"
                value={m.filterSuctionId ?? null}
                onChange={(v) => updateItem(i, { filterSuctionId: v })}
                disabled={disabled}
              />
            </Mini>
            <Mini label="Filtro Retorno">
              <EntitySelect
                entity="filter-return"
                value={m.filterReturnId ?? null}
                onChange={(v) => updateItem(i, { filterReturnId: v })}
                disabled={disabled}
              />
            </Mini>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        disabled={disabled}
        className="text-primary hover:bg-primary/5 flex items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Adicionar Material
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field helpers
// ─────────────────────────────────────────────────────────────────────────────

const BASE_INPUT =
  "border-input focus-visible:ring-primary h-9 w-full rounded-md border bg-white px-3 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50";

function Text({
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
        className={BASE_INPUT}
      />
    </div>
  );
}

function Num({
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
        className={BASE_INPUT}
      />
    </div>
  );
}

function Textarea({
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

function Entity({
  label,
  entity,
  value,
  onChange,
  disabled,
  className,
}: {
  label: string;
  entity: LookupKey;
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

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
