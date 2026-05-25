"use client";

/**
 * AccordionSection — bloco colapsável para agrupar campos em formulários grandes.
 *
 * Usado em forms com muitos campos (Material, Equipment, EquipmentModel).
 * Auto-controlado por default, mas aceita controle externo via `open`/`onOpenChange`.
 */

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface AccordionSectionProps {
  title: string;
  description?: string;
  /** Controle externo: se omitido, o componente gerencia o estado internamente. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Estado inicial quando não controlado. */
  defaultOpen?: boolean;
  /** Badge à direita do título (ex.: "* obrigatório", contagem de campos preenchidos). */
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AccordionSection({
  title,
  description,
  open,
  onOpenChange,
  defaultOpen = false,
  badge,
  children,
  className,
}: AccordionSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-slate-200 bg-white",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
        aria-expanded={isOpen}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {badge}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {isOpen && (
        <div className="border-t border-slate-100 px-4 py-4">{children}</div>
      )}
    </div>
  );
}
