"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { MaterialRow } from "@/components/materials/MaterialFormDialog";
import { Edit2, Loader2, Trash2 } from "lucide-react";

interface MaterialsTableProps {
  materials: MaterialRow[];
  loading: boolean;
  error: string | null;
  search: string;
  onEdit: (m: MaterialRow) => void;
  onDelete: (m: MaterialRow) => void;
}

export function MaterialsTable({
  materials,
  loading,
  error,
  search,
  onEdit,
  onDelete,
}: MaterialsTableProps) {
  const filtered = materials.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.name ?? "").toLowerCase().includes(q) ||
      (m.sku ?? "").toLowerCase().includes(q) ||
      (m.location ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {materials.length === 0
          ? "Nenhum material cadastrado."
          : "Nenhum resultado para a busca."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((m) => {
            const current = m.currentStock ?? null;
            const min = m.minStock ?? null;
            const max = m.maxStock ?? null;
            const stockBelowMin =
              current != null && min != null && current < min;
            const stockOverMax =
              current != null && max != null && current > max;

            return (
              <TableRow key={m.id}>
                <TableCell className="font-medium text-slate-900">
                  {m.name}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {m.sku ?? "—"}
                </TableCell>
                <TableCell>{m.unit ?? "—"}</TableCell>
                <TableCell>
                  {current != null ? (
                    <span>
                      {current}
                      {max != null ? ` / ${max}` : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {stockBelowMin ? (
                    <Badge variant="warning">Abaixo do mínimo</Badge>
                  ) : stockOverMax ? (
                    <Badge variant="default">Acima do máximo</Badge>
                  ) : current != null ? (
                    <Badge variant="success">OK</Badge>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(m)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
