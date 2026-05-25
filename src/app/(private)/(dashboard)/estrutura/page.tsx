"use client";

/**
 * /estrutura — Visão hierárquica da planta: Empresa → Área → Setor → Equipamento.
 *
 * Tree view com expand/collapse + criação inline rápida em cada nível.
 * Equipamento abre em modo edit ao clicar; criar leva pra /equipamentos/criar
 * com o sectorId pré-preenchido.
 */

import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { useLookupContext } from "@/context/LookupContext";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Loader2,
  Map as MapIcon,
  Plus,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface AreaItem {
  id: string;
  name: string;
  position?: string;
}

interface SectorItem {
  id: string;
  name: string;
  areaId: string;
  position?: string;
}

interface EquipmentItem {
  id: string;
  tag: string;
  name?: string | null;
  sectorId?: string;
  sector?: { id: string } | null;
  criticality?: "A" | "B" | "C" | null;
}

export default function EstruturaPage() {
  const { GetAPI, PostAPI } = useApiContext();
  const { isSuperAdmin, selectedCompanyId, effectiveCompanyId } = useCompany();
  const { refetch: refetchLookup } = useLookupContext();

  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [creatingArea, setCreatingArea] = useState(false);
  const [creatingSectorIn, setCreatingSectorIn] = useState<AreaItem | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const needsCompany = isSuperAdmin && !selectedCompanyId;

  const fetchAll = useCallback(async () => {
    if (needsCompany) {
      setLoading(false);
      setAreas([]);
      setSectors([]);
      setEquipments([]);
      return;
    }
    setLoading(true);
    setError(null);
    const companyQS = effectiveCompanyId
      ? `?companyId=${encodeURIComponent(effectiveCompanyId)}`
      : "";
    const [areaRes, sectorRes, eqRes] = await Promise.all([
      GetAPI(`/area${companyQS}`, true),
      GetAPI(`/sector${companyQS}`, true),
      GetAPI(`/equipment${companyQS}`, true),
    ]);
    if (areaRes.status !== 200) {
      setError(areaRes.body?.message || "Falha ao carregar áreas.");
      setLoading(false);
      return;
    }
    setAreas((areaRes.body?.areas as AreaItem[]) ?? []);
    setSectors((sectorRes.body?.sectors as SectorItem[]) ?? []);
    setEquipments(
      ((eqRes.body?.equipments as EquipmentItem[]) ?? []).map((eq) => ({
        ...eq,
        sectorId: eq.sectorId ?? eq.sector?.id,
      }))
    );
    setLoading(false);
  }, [GetAPI, effectiveCompanyId, needsCompany]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sectorsByArea = useMemo(() => {
    const map: Map<string, SectorItem[]> = new Map();
    for (const s of sectors) {
      const list = map.get(s.areaId) ?? [];
      list.push(s);
      map.set(s.areaId, list);
    }
    return map;
  }, [sectors]);

  const equipmentsBySector = useMemo(() => {
    const map: Map<string, EquipmentItem[]> = new Map();
    for (const e of equipments) {
      const sid = e.sectorId ?? e.sector?.id;
      if (!sid) continue;
      const list = map.get(sid) ?? [];
      list.push(e);
      map.set(sid, list);
    }
    return map;
  }, [equipments]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const next = new Set<string>();
    for (const a of areas) next.add(a.id);
    for (const s of sectors) next.add(s.id);
    setExpanded(next);
  };

  const collapseAll = () => setExpanded(new Set());

  async function handleCreateArea(name: string) {
    setSubmitting(true);
    const nextPosition = String(areas.length + 1);
    const res = await PostAPI(
      "/area/single",
      {
        name,
        position: nextPosition,
        companyId: effectiveCompanyId ?? undefined,
      },
      true
    );
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success("Área criada.");
      setCreatingArea(false);
      fetchAll();
      void refetchLookup("area");
    } else {
      toast.error(res.body?.message || "Erro ao criar área.");
    }
  }

  async function handleCreateSector(name: string, areaId: string) {
    setSubmitting(true);
    const sectorsInArea = sectorsByArea.get(areaId) ?? [];
    const nextPosition = String(sectorsInArea.length + 1);
    const res = await PostAPI(
      "/sector/single",
      {
        name,
        position: nextPosition,
        areaId,
        companyId: effectiveCompanyId ?? undefined,
      },
      true
    );
    setSubmitting(false);
    if (res.status === 200 || res.status === 201) {
      toast.success("Setor criado.");
      setCreatingSectorIn(null);
      fetchAll();
      void refetchLookup("sector");
    } else {
      toast.error(res.body?.message || "Erro ao criar setor.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Estrutura
          </h1>
          <p className="text-slate-500">
            Visão hierárquica da planta: navegue, expanda e crie áreas, setores
            e equipamentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Expandir tudo
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Colapsar tudo
          </button>
          <button
            type="button"
            onClick={() => setCreatingArea(true)}
            disabled={needsCompany}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nova Área
          </button>
        </div>
      </div>

      {needsCompany && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm">
            Selecione uma empresa no dropdown do header para visualizar a
            estrutura.
          </p>
        </div>
      )}

      {!needsCompany && loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {!needsCompany && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {!needsCompany && !loading && !error && areas.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Nenhuma área cadastrada. Clique em &quot;Nova Área&quot; para
          começar.
        </div>
      )}

      {!loading && !error && areas.length > 0 && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          {areas.map((area) => {
            const areaOpen = expanded.has(area.id);
            const sectorsInArea = sectorsByArea.get(area.id) ?? [];
            return (
              <div key={area.id}>
                <Row
                  level="area"
                  open={areaOpen}
                  onToggle={() => toggle(area.id)}
                  hasChildren={sectorsInArea.length > 0}
                  icon={<MapIcon className="h-4 w-4 text-blue-500" />}
                  label={area.name}
                  meta={`${sectorsInArea.length} setor(es)`}
                  action={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreatingSectorIn(area);
                      }}
                      className="text-primary hover:bg-primary/5 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
                    >
                      <Plus className="h-3 w-3" />
                      Setor
                    </button>
                  }
                />
                {areaOpen && (
                  <div className="ml-4 space-y-1 border-l border-slate-100 pl-3">
                    {sectorsInArea.length === 0 && (
                      <p className="px-2 py-1 text-xs italic text-slate-400">
                        Sem setores nesta área.
                      </p>
                    )}
                    {sectorsInArea.map((sector) => {
                      const secOpen = expanded.has(sector.id);
                      const eqs = equipmentsBySector.get(sector.id) ?? [];
                      return (
                        <div key={sector.id}>
                          <Row
                            level="sector"
                            open={secOpen}
                            onToggle={() => toggle(sector.id)}
                            hasChildren={eqs.length > 0}
                            icon={
                              <LayoutGrid className="h-4 w-4 text-emerald-500" />
                            }
                            label={sector.name}
                            meta={`${eqs.length} equipamento(s)`}
                            action={
                              <Link
                                href={`/equipamentos/criar?sectorId=${sector.id}`}
                                className="text-primary hover:bg-primary/5 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Plus className="h-3 w-3" />
                                Equipamento
                              </Link>
                            }
                          />
                          {secOpen && (
                            <div className="ml-4 space-y-0.5 border-l border-slate-100 pl-3">
                              {eqs.length === 0 && (
                                <p className="px-2 py-1 text-xs italic text-slate-400">
                                  Sem equipamentos neste setor.
                                </p>
                              )}
                              {eqs.map((eq) => (
                                <Link
                                  key={eq.id}
                                  href={`/equipamentos/${eq.id}`}
                                  className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Wrench className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="font-mono text-xs text-slate-500">
                                    {eq.tag}
                                  </span>
                                  <span className="truncate">
                                    {eq.name ?? "(sem nome)"}
                                  </span>
                                  {eq.criticality && (
                                    <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                      {eq.criticality}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <QuickCreateDialog
        open={creatingArea}
        onOpenChange={(open) => !open && setCreatingArea(false)}
        title="Nova Área"
        label="Nome da área"
        placeholder="Ex: Linha de Produção 1"
        isSubmitting={submitting}
        onSubmit={(name) => handleCreateArea(name)}
      />

      <QuickCreateDialog
        open={!!creatingSectorIn}
        onOpenChange={(open) => !open && setCreatingSectorIn(null)}
        title={`Novo Setor em ${creatingSectorIn?.name ?? ""}`}
        label="Nome do setor"
        placeholder="Ex: Máquinas Pesadas"
        isSubmitting={submitting}
        onSubmit={(name) =>
          creatingSectorIn && handleCreateSector(name, creatingSectorIn.id)
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row
// ─────────────────────────────────────────────────────────────────────────────

function Row({
  level,
  open,
  onToggle,
  hasChildren,
  icon,
  label,
  meta,
  action,
}: {
  level: "area" | "sector";
  open: boolean;
  onToggle: () => void;
  hasChildren: boolean;
  icon: React.ReactNode;
  label: string;
  meta: string;
  action: React.ReactNode;
}) {
  return (
    <div
      onClick={onToggle}
      className="group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
      role="button"
    >
      <span className="w-4">
        {hasChildren ? (
          open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )
        ) : null}
      </span>
      {icon}
      <span
        className={
          level === "area"
            ? "font-semibold text-slate-900"
            : "font-medium text-slate-800"
        }
      >
        {label}
      </span>
      <span className="text-xs text-slate-400">· {meta}</span>
      <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
        {action}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QuickCreateDialog
// ─────────────────────────────────────────────────────────────────────────────

function QuickCreateDialog({
  open,
  onOpenChange,
  title,
  label,
  placeholder,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  placeholder?: string;
  isSubmitting: boolean;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-6 shadow-lg outline-none">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {title}
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
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
                disabled={isSubmitting}
                className="border-input focus-visible:ring-primary h-10 w-full rounded-md border bg-white px-3 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                required
              />
            </div>
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
                disabled={isSubmitting || !name.trim()}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
