/**
 * Helpers compartilhados pelos fluxos de cadastro (Equipment, Equipment Model,
 * Material, Worker, etc.). Espelham as funções equivalentes do app mobile
 * (`inova-app/app/(equipment)/equipment-create.tsx`) para garantir consistência
 * de serialização entre web e mobile.
 */

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Converte string numérica (aceitando vírgula como decimal) para number.
 * Retorna `undefined` se vazio ou inválido — Prisma rejeita `NaN`.
 */
export function parseNum(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const str = String(value).trim().replace(",", ".");
  if (str === "") return undefined;
  const n = Number(str);
  return Number.isFinite(n) ? n : undefined;
}

/** Trim e retorna `undefined` se string vazia. */
export function cleanString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  return str === "" ? undefined : str;
}

/** Retorna o valor se for UUID v4 válido, senão `undefined`. */
export function cleanUuid(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return UUID_V4_REGEX.test(value) ? value : undefined;
}

/**
 * Remove recursivamente chaves com valor `undefined` de objetos e arrays.
 * Prisma rejeita propriedades com `undefined` em alguns contextos.
 */
export function removeUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => removeUndefined(v)) as unknown as T;
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value === undefined) continue;
      result[key] = removeUndefined(value);
    }
    return result as T;
  }
  return obj;
}

/**
 * Formata a TAG de equipamento com 3 dígitos finais (ex.: "1" → "001",
 * "AB12" → "AB012"). Espelha `formatTagSuffix3Digits` do app mobile.
 */
export function formatTagSuffix3Digits(tag: string): string {
  if (!tag) return tag;
  const trimmed = tag.trim();
  const match = trimmed.match(/^(.*?)(\d+)$/);
  if (!match) return trimmed;
  const [, prefix, digits] = match;
  return prefix + digits.padStart(3, "0");
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapeamentos de enums (form <-> API) — espelham o mobile
// ─────────────────────────────────────────────────────────────────────────────

export const CONTAMINATION_LEVEL_FORM_TO_API = {
  Leve: "low",
  Médio: "medium",
  Crítico: "critical",
} as const;

export const CONTAMINATION_LEVEL_API_TO_FORM: Record<string, string> = {
  low: "Leve",
  medium: "Médio",
  critical: "Crítico",
  high: "Crítico",
};

export const OPERATION_REGIME_FORM_TO_API = {
  Operando: "Contínuo",
  Parando: "Intermitente",
  "Parada Geral": "Parado",
} as const;

export const OPERATION_REGIME_API_TO_FORM: Record<string, string> = {
  Contínuo: "Operando",
  Intermitente: "Parando",
  Parado: "Parada Geral",
};

export const SAFETY_MEASURES_FORM_TO_API = {
  "Necessita Bloqueio": "fullStop",
  "Sem Bloqueio": "none",
} as const;

export const SAFETY_MEASURES_API_TO_FORM: Record<string, string> = {
  fullStop: "Necessita Bloqueio",
  none: "Sem Bloqueio",
};

export const CRITICALITY_OPTIONS = ["A", "B", "C"] as const;
export type Criticality = (typeof CRITICALITY_OPTIONS)[number];
