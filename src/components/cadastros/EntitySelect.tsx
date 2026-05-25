"use client";

/**
 * EntitySelect — Select tipado para entidades de lookup.
 *
 * - Carrega items via LookupContext (lazy + cached)
 * - Funciona como input controlado (compatível com react-hook-form Controller)
 * - Permite criar novo item inline (quando suportado pelo lookup)
 *
 * Para lookups com inlineCreate=false (ex: period, area, sector, access-level),
 * o botão "Criar..." fica oculto.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLookup } from "@/context/LookupContext";
import type { LookupKey } from "@/lib/cadastro-types";
import { LOOKUP_REGISTRY } from "@/context/LookupContext";
import { cn } from "@/lib/utils";
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";

interface EntitySelectProps {
  /** Tipo do lookup (ex: "priority", "manufacturer"). */
  entity: LookupKey;
  /** ID do item selecionado (UUID), ou undefined/null. */
  value: string | null | undefined;
  /** Chamado quando o usuário escolhe um item. */
  onChange: (id: string | null) => void;
  /** Placeholder do trigger (default: "Selecionar..."). */
  placeholder?: string;
  /** Desabilita o controle. */
  disabled?: boolean;
  /** Classe adicional no trigger. */
  className?: string;
}

export function EntitySelect({
  entity,
  value,
  onChange,
  placeholder = "Selecionar...",
  disabled,
  className,
}: EntitySelectProps) {
  const { items, loading, error, createItem } = useLookup(entity);
  const entry = LOOKUP_REGISTRY[entity];
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Limpar seleção
  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    const created = await createItem(newName);
    setSubmitting(false);
    if (created?.id) {
      onChange(created.id);
    }
    setNewName("");
    setCreating(false);
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex-1">
        <Select
          value={value ?? undefined}
          onValueChange={(v) => onChange(v || null)}
          disabled={disabled || loading}
        >
          <SelectTrigger className={cn(className)}>
            {loading ? (
              <span className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Carregando...
              </span>
            ) : error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>
          <SelectContent>
            {items.length === 0 && !loading && (
              <div className="px-3 py-2 text-sm text-slate-400">
                Nenhum item disponível
              </div>
            )}
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
            {entry.inlineCreate && (
              <div className="border-t border-slate-100 px-2 py-1.5">
                {creating ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreate();
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          setCreating(false);
                          setNewName("");
                        }
                      }}
                      placeholder={`Nome do novo ${entry.label.toLowerCase()}`}
                      className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-primary"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={!newName.trim() || submitting}
                      className="text-primary disabled:text-slate-300"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="text-primary flex w-full items-center gap-2 rounded px-1 py-1 text-sm hover:bg-primary/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Criar novo {entry.label.toLowerCase()}
                  </button>
                )}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Limpar seleção"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
