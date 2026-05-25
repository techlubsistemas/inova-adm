"use client";

import { Badge } from "@/components/ui/badge";
import {
  criticalityMap,
  type CriticalityApi,
  type EquipmentFromApi,
} from "@/lib/equipment-types";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface EquipmentHeaderProps {
  equipment: EquipmentFromApi | null;
  loading: boolean;
}

function getCriticalityVariant(
  c: CriticalityApi | null
): "high" | "medium" | "low" {
  if (!c) return "low";
  return criticalityMap[c]?.variant ?? "low";
}

function getCriticalityLabel(c: CriticalityApi | null): string {
  if (!c) return "—";
  return criticalityMap[c]?.label ?? c;
}

export function EquipmentHeader({ equipment, loading }: EquipmentHeaderProps) {
  if (loading) {
    return (
      <div className="sticky top-0 z-10 -mx-8 -mt-6 flex items-center justify-center border-b border-slate-200 bg-white px-8 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="sticky top-0 z-10 -mx-8 -mt-6 border-b border-slate-200 bg-white px-8 py-6">
        <Link
          href="/equipamentos"
          className="hover:text-primary inline-flex items-center gap-2 text-sm text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <p className="mt-4 text-slate-500">Equipamento não encontrado.</p>
      </div>
    );
  }

  const photo = equipment.photos?.[0];

  return (
    <div className="sticky top-0 z-10 -mx-8 -mt-6 border-b border-slate-200 bg-white px-8 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/equipamentos"
            className="hover:text-primary mt-1 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            {photo?.url ? (
              <Image
                src={photo.fullUrl || photo.url}
                alt=""
                width={80}
                height={80}
                className="h-20 w-20 object-cover"
                unoptimized
              />
            ) : (
              <span className="text-sm text-slate-400">—</span>
            )}
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {equipment.tag}
              </h1>
              <Badge variant={getCriticalityVariant(equipment.criticality)}>
                {getCriticalityLabel(equipment.criticality)}
              </Badge>
            </div>
            <p className="mb-2 text-slate-600">
              {equipment.name ?? "—"}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {equipment.sector?.name && (
                <span className="text-slate-500">
                  Setor:{" "}
                  <span className="font-medium text-slate-700">
                    {equipment.sector.name}
                  </span>
                </span>
              )}
              {equipment.model && (
                <span className="text-slate-500">
                  Modelo:{" "}
                  <span className="font-medium text-slate-700">
                    {equipment.model}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <Link
            href={`/equipamentos/${equipment.id}/editar`}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}
