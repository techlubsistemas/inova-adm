"use client";

import { XlsxImportButton } from "@/components/cadastros/XlsxImportButton";
import { EquipmentFilters } from "@/components/equipment/equipment-filters";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import type { EquipmentFromApi, EquipmentListResponse } from "@/lib/equipment-types";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function EquipamentosPage() {
  const { GetAPI } = useApiContext();
  const { isSuperAdmin, selectedCompanyId } = useCompany();
  const [equipments, setEquipments] = useState<EquipmentFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [criticalityFilter, setCriticalityFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");

  const fetchEquipments = useCallback(async () => {
    const url =
      isSuperAdmin && selectedCompanyId
        ? `/equipment?companyId=${encodeURIComponent(selectedCompanyId)}`
        : "/equipment";
    setLoading(true);
    setError(null);
    const res = await GetAPI(url, true);
    if (res.status === 200 && res.body?.equipments) {
      const data = res.body as EquipmentListResponse;
      setEquipments(data.equipments ?? []);
    } else {
      const msg =
        typeof res.body?.message === "string"
          ? res.body.message
          : "Falha ao carregar equipamentos.";
      setError(msg);
      setEquipments([]);
      toast.error(msg);
    }
    setLoading(false);
  }, [GetAPI, isSuperAdmin, selectedCompanyId]);

  useEffect(() => {
    if (isSuperAdmin && !selectedCompanyId) {
      setLoading(false);
      setEquipments([]);
      setError(null);
      return;
    }
    fetchEquipments();
  }, [fetchEquipments, isSuperAdmin, selectedCompanyId]);

  const sectorOptions = useMemo(() => {
    const names = new Map<string, string>();
    equipments.forEach((eq) => {
      if (eq.sector?.id && eq.sector?.name) {
        names.set(eq.sector.id, eq.sector.name);
      }
    });
    return Array.from(names.entries()).map(([id, name]) => ({ id, name }));
  }, [equipments]);

  const filteredCount = useMemo(() => {
    return equipments.filter((eq) => {
      const matchSearch =
        !search ||
        eq.tag?.toLowerCase().includes(search.toLowerCase()) ||
        (eq.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (eq.model ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCriticality =
        !criticalityFilter || eq.criticality === criticalityFilter;
      const matchSector =
        !sectorFilter || eq.sector?.name === sectorFilter;
      return matchSearch && matchCriticality && matchSector;
    }).length;
  }, [equipments, search, criticalityFilter, sectorFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Equipamentos
          </h1>
          <p className="text-slate-500">
            Gerenciamento de ativos da planta
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            <strong className="text-slate-900">{filteredCount}</strong>{" "}
            {filteredCount === 1 ? "equipamento" : "equipamentos"}
          </span>
          <XlsxImportButton entityKind="equipment" onImported={fetchEquipments} />
          <Link
            href="/equipamentos/criar"
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Equipamento
          </Link>
        </div>
      </div>

      <EquipmentFilters
        search={search}
        onSearchChange={setSearch}
        criticality={criticalityFilter}
        onCriticalityChange={setCriticalityFilter}
        sectorFilter={sectorFilter}
        onSectorFilterChange={setSectorFilter}
        sectorOptions={sectorOptions}
      />

      {isSuperAdmin && !selectedCompanyId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm">
            Selecione uma empresa no dropdown do header para visualizar os equipamentos.
          </p>
        </div>
      )}

      <EquipmentTable
        equipments={equipments}
        loading={loading}
        error={error}
        search={search}
        criticalityFilter={criticalityFilter}
        sectorFilter={sectorFilter}
      />

      {!loading && !error && equipments.length > 0 && (
        <div className="text-sm text-slate-500">
          Exibindo {filteredCount} de {equipments.length} equipamentos
        </div>
      )}
    </div>
  );
}
