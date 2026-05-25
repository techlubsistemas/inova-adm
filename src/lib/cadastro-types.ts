/**
 * Tipos compartilhados pelos fluxos de cadastro.
 */

/** Forma mínima de qualquer item de lookup (priority, period, manufacturer, etc.). */
export interface LookupItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

/**
 * Chaves dos lookups suportados pelo LookupContext.
 * Espelham os endpoints da inova-api (em kebab-case).
 */
export type LookupKey =
  // Tipos de estrutura (globais)
  | "equipment-type"
  | "set-type"
  | "subset-type"
  | "cip-type"
  // Materiais e fluidos (globais)
  | "material"
  | "material-type"
  | "material-family"
  | "manufacturer"
  | "supplier"
  | "unit"
  | "power-unit"
  | "main-component"
  | "lubrication-system"
  | "filter-oil"
  | "filter-pressure"
  | "filter-suction"
  | "filter-return"
  // Serviço (mix globais e por empresa)
  | "service"
  | "service-type"
  | "service-model"
  | "service-reason"
  | "service-problem-reason"
  | "service-condition"
  | "service-procedure"
  | "execution-time"
  | "job-system"
  | "meter"
  | "period"
  | "priority"
  // Pessoas/operação
  | "access-level"
  | "worker-role"
  | "team"
  | "extra-team"
  | "estimated-extra-team-time"
  | "toolkit"
  | "cost-center"
  // Estrutura organizacional (empresa-scoped)
  | "area"
  | "sector"
  | "area-model"
  | "sector-model";

export type LookupCategory =
  | "Estrutura"
  | "Materiais e Fluidos"
  | "Serviço"
  | "Pessoas e Operação"
  | "Organizacional";

export interface LookupExtraField {
  key: string;
  label: string;
  type: "text" | "number";
  required?: boolean;
  placeholder?: string;
}

export interface LookupRegistryEntry {
  /** Endpoint base na API (ex: "priority" → GET /priority). */
  endpoint: LookupKey;
  /** Nome do array no body da resposta (ex: "priorities" para GET /priority). */
  listKey: string;
  /** Se true, requer companyId no querystring (`?companyId=...`). */
  companyScoped: boolean;
  /** Se true, suporta criação inline via EntitySelect (POST /:endpoint/single com { name }). */
  inlineCreate: boolean;
  /** Label amigável em pt-BR para UI. */
  label: string;
  /** Categoria de agrupamento na tela /parametros. */
  category: LookupCategory;
  /** Campos extras além de `name` para criar/editar. Ex: period.days, materialFamily.symbol. */
  extraFields?: LookupExtraField[];
  /** Se true, exibe apenas leitura (sem create/edit/delete) — ex: accessLevel. */
  readOnly?: boolean;
  /** Se true, é gerenciado por uma página dedicada — NÃO aparecer em /parametros. */
  dedicatedPage?: boolean;
}
