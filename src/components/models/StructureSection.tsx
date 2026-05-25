"use client";

/**
 * StructureSection — árvore aninhada Set → Subset → CIP → CipService.
 *
 * Editor inline com adição/remoção em cada nível. Services ficam aninhados
 * dentro dos cips na UI; o mapping faz o flatten antes de enviar à API.
 */

import { EntitySelect } from "@/components/cadastros/EntitySelect";
import {
  emptyCipItem,
  emptyServiceItem,
  emptySetItem,
  emptySubsetItem,
} from "@/lib/model-mapping";
import type {
  CipFormItem,
  ServiceFormItem,
  SetFormItem,
  SubsetFormItem,
} from "@/lib/model-form-types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface StructureSectionProps {
  sets: SetFormItem[];
  onChange: (sets: SetFormItem[]) => void;
}

export function StructureSection({ sets, onChange }: StructureSectionProps) {
  const addSet = () => {
    const next = [
      ...sets,
      {
        ...emptySetItem(
          String(sets.length + 1),
          String(sets.length + 1).padStart(2, "0")
        ),
      },
    ];
    onChange(next);
  };

  const updateSet = (idx: number, patch: Partial<SetFormItem>) => {
    onChange(sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSet = (idx: number) => {
    onChange(sets.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {sets.length === 0 && (
        <p className="rounded border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          Nenhum conjunto cadastrado. Clique em &quot;Adicionar Conjunto&quot;
          para começar a montar a estrutura.
        </p>
      )}
      {sets.map((set, i) => (
        <SetCard
          key={set.tempId}
          set={set}
          onUpdate={(patch) => updateSet(i, patch)}
          onRemove={() => removeSet(i)}
        />
      ))}
      <button
        type="button"
        onClick={addSet}
        className="text-primary hover:bg-primary/5 flex items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium"
      >
        <Plus className="h-4 w-4" />
        Adicionar Conjunto
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SetCard
// ─────────────────────────────────────────────────────────────────────────────

function SetCard({
  set,
  onUpdate,
  onRemove,
}: {
  set: SetFormItem;
  onUpdate: (patch: Partial<SetFormItem>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);

  const addSubset = () => {
    onUpdate({
      subSets: [
        ...set.subSets,
        emptySubsetItem(
          String(set.subSets.length + 1),
          String(set.subSets.length + 1).padStart(2, "0")
        ),
      ],
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      <CardHeader
        open={open}
        onToggle={() => setOpen(!open)}
        prefix="Conjunto"
        code={set.code}
        name={set.name}
        countLabel={`${set.subSets.length} subconjunto(s)`}
        onRemove={onRemove}
        borderColor="bg-blue-500"
      />
      {open && (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3">
          <CardFields
            name={set.name}
            code={set.code}
            position={set.position}
            typeId={set.setTypeId ?? null}
            typeEntity="set-type"
            onChange={(patch) => onUpdate(patch as Partial<SetFormItem>)}
            typeKey="setTypeId"
          />
          <div className="space-y-2 pl-2">
            {set.subSets.map((ss, j) => (
              <SubsetCard
                key={ss.tempId}
                subset={ss}
                onUpdate={(patch) =>
                  onUpdate({
                    subSets: set.subSets.map((x, k) =>
                      k === j ? { ...x, ...patch } : x
                    ),
                  })
                }
                onRemove={() =>
                  onUpdate({
                    subSets: set.subSets.filter((_, k) => k !== j),
                  })
                }
              />
            ))}
            <button
              type="button"
              onClick={addSubset}
              className="text-primary hover:bg-primary/5 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Subconjunto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubsetCard
// ─────────────────────────────────────────────────────────────────────────────

function SubsetCard({
  subset,
  onUpdate,
  onRemove,
}: {
  subset: SubsetFormItem;
  onUpdate: (patch: Partial<SubsetFormItem>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(true);

  const addCip = () => {
    onUpdate({
      cips: [
        ...subset.cips,
        emptyCipItem(
          String(subset.cips.length + 1),
          String(subset.cips.length + 1).padStart(2, "0")
        ),
      ],
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <CardHeader
        open={open}
        onToggle={() => setOpen(!open)}
        prefix="Subconjunto"
        code={subset.code}
        name={subset.name}
        countLabel={`${subset.cips.length} CIP(s)`}
        onRemove={onRemove}
        borderColor="bg-emerald-500"
      />
      {open && (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3">
          <CardFields
            name={subset.name}
            code={subset.code}
            position={subset.position}
            typeId={subset.subsetTypeId ?? null}
            typeEntity="subset-type"
            onChange={(patch) =>
              onUpdate(patch as Partial<SubsetFormItem>)
            }
            typeKey="subsetTypeId"
          />
          <div className="space-y-2 pl-2">
            {subset.cips.map((c, j) => (
              <CipCard
                key={c.tempId}
                cip={c}
                onUpdate={(patch) =>
                  onUpdate({
                    cips: subset.cips.map((x, k) =>
                      k === j ? { ...x, ...patch } : x
                    ),
                  })
                }
                onRemove={() =>
                  onUpdate({
                    cips: subset.cips.filter((_, k) => k !== j),
                  })
                }
              />
            ))}
            <button
              type="button"
              onClick={addCip}
              className="text-primary hover:bg-primary/5 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar CIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CipCard
// ─────────────────────────────────────────────────────────────────────────────

function CipCard({
  cip,
  onUpdate,
  onRemove,
}: {
  cip: CipFormItem;
  onUpdate: (patch: Partial<CipFormItem>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  const addService = () =>
    onUpdate({ services: [...cip.services, emptyServiceItem()] });

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <CardHeader
        open={open}
        onToggle={() => setOpen(!open)}
        prefix="CIP"
        code={cip.code}
        name={cip.name}
        countLabel={`${cip.services.length} serviço(s)`}
        onRemove={onRemove}
        borderColor="bg-amber-500"
      />
      {open && (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3">
          <CardFields
            name={cip.name}
            code={cip.code}
            position={cip.position}
            typeId={cip.cipTypeId ?? null}
            typeEntity="cip-type"
            onChange={(patch) => onUpdate(patch as Partial<CipFormItem>)}
            typeKey="cipTypeId"
          />
          <div className="space-y-2 pl-2">
            {cip.services.map((sv, j) => (
              <ServiceRow
                key={sv.tempId}
                service={sv}
                onUpdate={(patch) =>
                  onUpdate({
                    services: cip.services.map((x, k) =>
                      k === j ? { ...x, ...patch } : x
                    ),
                  })
                }
                onRemove={() =>
                  onUpdate({
                    services: cip.services.filter((_, k) => k !== j),
                  })
                }
              />
            ))}
            <button
              type="button"
              onClick={addService}
              className="text-primary hover:bg-primary/5 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Serviço a este CIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceRow
// ─────────────────────────────────────────────────────────────────────────────

function ServiceRow({
  service,
  onUpdate,
  onRemove,
}: {
  service: ServiceFormItem;
  onUpdate: (patch: Partial<ServiceFormItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600">
          Serviço
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SmallField label="Modelo de Serviço *">
          <EntitySelect
            entity="service-model"
            value={service.serviceModelId || null}
            onChange={(v) => onUpdate({ serviceModelId: v ?? "" })}
          />
        </SmallField>
        <SmallField label="Período">
          <EntitySelect
            entity="period"
            value={service.periodId ?? null}
            onChange={(v) => onUpdate({ periodId: v })}
          />
        </SmallField>
        <SmallField label="Prioridade">
          <EntitySelect
            entity="priority"
            value={service.priorityId ?? null}
            onChange={(v) => onUpdate({ priorityId: v })}
          />
        </SmallField>
        <SmallField label="Equipe">
          <EntitySelect
            entity="team"
            value={service.teamId ?? null}
            onChange={(v) => onUpdate({ teamId: v })}
          />
        </SmallField>
        <SmallField label="Condição">
          <EntitySelect
            entity="service-condition"
            value={service.serviceConditionId ?? null}
            onChange={(v) => onUpdate({ serviceConditionId: v })}
          />
        </SmallField>
        <SmallField label="Procedimento">
          <EntitySelect
            entity="service-procedure"
            value={service.serviceProcedureId ?? null}
            onChange={(v) => onUpdate({ serviceProcedureId: v })}
          />
        </SmallField>
        <SmallField label="Motivo">
          <EntitySelect
            entity="service-reason"
            value={service.serviceReasonId ?? null}
            onChange={(v) => onUpdate({ serviceReasonId: v })}
          />
        </SmallField>
        <SmallField label="Medidor">
          <EntitySelect
            entity="meter"
            value={service.meterId ?? null}
            onChange={(v) => onUpdate({ meterId: v })}
          />
        </SmallField>
        <SmallField label="Sistema de Trabalho">
          <EntitySelect
            entity="job-system"
            value={service.jobSystemId ?? null}
            onChange={(v) => onUpdate({ jobSystemId: v })}
          />
        </SmallField>
        <SmallField label="Tempo de Execução">
          <EntitySelect
            entity="execution-time"
            value={service.executionTimeId ?? null}
            onChange={(v) => onUpdate({ executionTimeId: v })}
          />
        </SmallField>
        <SmallField label="Toolkit">
          <EntitySelect
            entity="toolkit"
            value={service.toolkitId ?? null}
            onChange={(v) => onUpdate({ toolkitId: v })}
          />
        </SmallField>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CardHeader({
  open,
  onToggle,
  prefix,
  code,
  name,
  countLabel,
  onRemove,
  borderColor,
}: {
  open: boolean;
  onToggle: () => void;
  prefix: string;
  code: string;
  name: string;
  countLabel?: string;
  onRemove: () => void;
  borderColor: string;
}) {
  return (
    <div className="flex items-center">
      <div className={cn("w-1 self-stretch", borderColor)} />
      <button
        type="button"
        onClick={onToggle}
        className="flex flex-1 items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
        <span className="text-xs font-mono text-slate-500">{code || "—"}</span>
        <span className="font-medium text-slate-900">
          {prefix}: {name || <em className="text-slate-400 not-italic">(sem nome)</em>}
        </span>
        {countLabel && (
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {countLabel}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="mr-2 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        aria-label="Remover"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

interface CardFieldsProps {
  name: string;
  code: string;
  position: string;
  typeId: string | null;
  typeEntity: "set-type" | "subset-type" | "cip-type";
  typeKey: string;
  onChange: (patch: Record<string, unknown>) => void;
}

function CardFields({
  name,
  code,
  position,
  typeId,
  typeEntity,
  typeKey,
  onChange,
}: CardFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <SmallField label="Nome">
        <input
          type="text"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm focus:border-primary focus:outline-none"
        />
      </SmallField>
      <SmallField label="Código">
        <input
          type="text"
          value={code}
          onChange={(e) => onChange({ code: e.target.value })}
          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm focus:border-primary focus:outline-none"
        />
      </SmallField>
      <SmallField label="Posição">
        <input
          type="text"
          value={position}
          onChange={(e) => onChange({ position: e.target.value })}
          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm focus:border-primary focus:outline-none"
        />
      </SmallField>
      <SmallField label="Tipo">
        <EntitySelect
          entity={typeEntity}
          value={typeId}
          onChange={(v) => onChange({ [typeKey]: v })}
        />
      </SmallField>
    </div>
  );
}

function SmallField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
