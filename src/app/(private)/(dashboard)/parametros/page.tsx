"use client";

/**
 * /parametros — Gestão de lookups (tabelas de parâmetros).
 *
 * UI: sidebar à esquerda com categorias colapsáveis + tabela à direita
 * para o lookup selecionado. Cada lookup tem CRUD genérico via LookupManager.
 *
 * Lookups com `dedicatedPage: true` (area, sector, area-model, sector-model)
 * NÃO aparecem aqui — eles têm página própria (Fase 3).
 */

import { LookupManager } from "@/components/parametros/LookupManager";
import { LOOKUP_REGISTRY } from "@/context/LookupContext";
import type { LookupCategory, LookupKey } from "@/lib/cadastro-types";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

const CATEGORY_ORDER: LookupCategory[] = [
  "Estrutura",
  "Materiais e Fluidos",
  "Serviço",
  "Pessoas e Operação",
];

export default function ParametrosPage() {
  const grouped = useMemo(() => {
    const map = new Map<LookupCategory, LookupKey[]>();
    for (const [key, entry] of Object.entries(LOOKUP_REGISTRY) as [
      LookupKey,
      (typeof LOOKUP_REGISTRY)[LookupKey],
    ][]) {
      if (entry.dedicatedPage) continue; // Tem página própria (Fase 3)
      const list = map.get(entry.category) ?? [];
      list.push(key);
      list.sort((a, b) =>
        LOOKUP_REGISTRY[a].label.localeCompare(LOOKUP_REGISTRY[b].label)
      );
      map.set(entry.category, list);
    }
    return map;
  }, []);

  const [openCategories, setOpenCategories] = useState<Set<LookupCategory>>(
    new Set(CATEGORY_ORDER)
  );
  const [selected, setSelected] = useState<LookupKey>(() => {
    // Default: primeiro lookup da primeira categoria
    for (const cat of CATEGORY_ORDER) {
      const list = grouped.get(cat);
      if (list && list.length > 0) return list[0];
    }
    return "priority";
  });

  const toggleCategory = (cat: LookupCategory) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Parâmetros
        </h1>
        <p className="text-slate-500">
          Configure as tabelas auxiliares do sistema (tipos, classificações, opções).
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Sidebar de lookups */}
        <aside className="lg:w-72 lg:flex-shrink-0">
          <nav className="space-y-1 rounded-lg border border-slate-200 bg-white p-2">
            {CATEGORY_ORDER.map((cat) => {
              const list = grouped.get(cat);
              if (!list || list.length === 0) return null;
              const isOpen = openCategories.has(cat);
              return (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="flex w-full items-center justify-between rounded px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase hover:bg-slate-50"
                  >
                    <span>{cat}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        isOpen ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="space-y-0.5">
                      {list.map((key) => {
                        const entry = LOOKUP_REGISTRY[key];
                        const isSelected = selected === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelected(key)}
                            className={cn(
                              "flex w-full items-center rounded px-3 py-1.5 text-left text-sm transition-colors",
                              isSelected
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            {entry.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo do lookup selecionado */}
        <main className="flex-1">
          <LookupManager key={selected} entity={selected} />
        </main>
      </div>
    </div>
  );
}
