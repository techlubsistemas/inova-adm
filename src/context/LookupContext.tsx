"use client";

/**
 * LookupContext — registry central de lookups (priority, manufacturer, period, etc.)
 *
 * Estratégia:
 * - Lazy: cada lookup só é carregado quando `useLookup(key)` é chamado pela 1ª vez
 * - Cache em memória por (key, companyId)
 * - Refetch automático quando `effectiveCompanyId` muda (para lookups company-scoped)
 * - Refetch manual via `refetch()`
 * - Criação inline via `createLookupItem(key, name)` — útil para EntitySelect
 *
 * Convenção API: GET /:endpoint retorna { <listKey>: Item[] }. Para lookups
 * company-scoped, envia `?companyId=...`. Inline create: POST /:endpoint/single
 * com body `{ name }`.
 */

import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import type {
  LookupItem,
  LookupKey,
  LookupRegistryEntry,
} from "@/lib/cadastro-types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

export const LOOKUP_REGISTRY: Record<LookupKey, LookupRegistryEntry> = {
  // ───── Estrutura (globais) ─────
  "equipment-type": {
    endpoint: "equipment-type",
    listKey: "equipmentTypes",
    companyScoped: false,
    inlineCreate: true,
    label: "Tipo de Equipamento",
    category: "Estrutura",
  },
  "set-type": {
    endpoint: "set-type",
    listKey: "setTypes",
    companyScoped: false,
    inlineCreate: true,
    label: "Tipo de Conjunto",
    category: "Estrutura",
  },
  "subset-type": {
    endpoint: "subset-type",
    listKey: "subsetTypes",
    companyScoped: false,
    inlineCreate: true,
    label: "Tipo de Subconjunto",
    category: "Estrutura",
  },
  "cip-type": {
    endpoint: "cip-type",
    listKey: "cipTypes",
    companyScoped: false,
    inlineCreate: true,
    label: "Tipo de CIP",
    category: "Estrutura",
  },

  // ───── Materiais e Fluidos ─────
  material: {
    endpoint: "material",
    listKey: "materials",
    companyScoped: true,
    inlineCreate: false, // tem ~27 campos — usa página dedicada
    label: "Material",
    category: "Materiais e Fluidos",
    dedicatedPage: true,
  },
  "material-type": {
    endpoint: "material-type",
    listKey: "materialTypes",
    companyScoped: false,
    inlineCreate: true,
    label: "Tipo de Material",
    category: "Materiais e Fluidos",
  },
  "material-family": {
    endpoint: "material-family",
    listKey: "materialFamilies",
    companyScoped: false,
    inlineCreate: false,
    label: "Família de Material",
    category: "Materiais e Fluidos",
    extraFields: [
      { key: "symbol", label: "Símbolo", type: "text", required: true, placeholder: "Ex: MO" },
    ],
  },
  manufacturer: {
    endpoint: "manufacturer",
    listKey: "manufacturers",
    companyScoped: false,
    inlineCreate: true,
    label: "Fabricante",
    category: "Materiais e Fluidos",
  },
  supplier: {
    endpoint: "supplier",
    listKey: "suppliers",
    companyScoped: false,
    inlineCreate: true,
    label: "Fornecedor",
    category: "Materiais e Fluidos",
  },
  unit: {
    endpoint: "unit",
    listKey: "units",
    companyScoped: false,
    inlineCreate: false,
    label: "Unidade",
    category: "Materiais e Fluidos",
    extraFields: [
      { key: "symbol", label: "Símbolo", type: "text", required: true, placeholder: "Ex: L" },
    ],
  },
  "power-unit": {
    endpoint: "power-unit",
    listKey: "powerUnits",
    companyScoped: false,
    inlineCreate: false,
    label: "Unidade de Potência",
    category: "Materiais e Fluidos",
    extraFields: [
      { key: "symbol", label: "Símbolo", type: "text", required: true, placeholder: "Ex: CV" },
    ],
  },
  "main-component": {
    endpoint: "main-component",
    listKey: "mainComponents",
    companyScoped: false,
    inlineCreate: true,
    label: "Componente Principal",
    category: "Materiais e Fluidos",
  },
  "lubrication-system": {
    endpoint: "lubrication-system",
    listKey: "lubricationSystems",
    companyScoped: false,
    inlineCreate: true,
    label: "Sistema de Lubrificação",
    category: "Materiais e Fluidos",
  },
  "filter-oil": {
    endpoint: "filter-oil",
    listKey: "filterOils",
    companyScoped: false,
    inlineCreate: true,
    label: "Filtro de Óleo",
    category: "Materiais e Fluidos",
  },
  "filter-pressure": {
    endpoint: "filter-pressure",
    listKey: "filterPressures",
    companyScoped: false,
    inlineCreate: true,
    label: "Filtro de Pressão",
    category: "Materiais e Fluidos",
  },
  "filter-suction": {
    endpoint: "filter-suction",
    listKey: "filterSuctions",
    companyScoped: false,
    inlineCreate: true,
    label: "Filtro de Sucção",
    category: "Materiais e Fluidos",
  },
  "filter-return": {
    endpoint: "filter-return",
    listKey: "filterReturns",
    companyScoped: false,
    inlineCreate: true,
    label: "Filtro de Retorno",
    category: "Materiais e Fluidos",
  },

  // ───── Serviço ─────
  service: {
    endpoint: "service",
    listKey: "services",
    companyScoped: true,
    inlineCreate: false, // tem description + serviceTypeId — usa página dedicada
    label: "Serviço",
    category: "Serviço",
    dedicatedPage: true,
  },
  "service-type": {
    endpoint: "service-type",
    listKey: "serviceTypes",
    companyScoped: false,
    inlineCreate: true,
    label: "Tipo de Serviço",
    category: "Serviço",
  },
  "service-model": {
    endpoint: "service-model",
    listKey: "serviceModels",
    companyScoped: false,
    inlineCreate: false, // tem description + serviceTypeId + periodCountFromLastExecution
    label: "Modelo de Serviço",
    category: "Serviço",
    dedicatedPage: true,
  },
  "service-reason": {
    endpoint: "service-reason",
    listKey: "serviceReasons",
    companyScoped: false,
    inlineCreate: true,
    label: "Motivo do Serviço",
    category: "Serviço",
  },
  "service-problem-reason": {
    endpoint: "service-problem-reason",
    listKey: "serviceProblemReasons",
    companyScoped: false,
    inlineCreate: true,
    label: "Motivo de Anomalia",
    category: "Serviço",
  },
  "service-condition": {
    endpoint: "service-condition",
    listKey: "serviceConditions",
    companyScoped: false,
    inlineCreate: true,
    label: "Condição do Serviço",
    category: "Serviço",
  },
  "service-procedure": {
    endpoint: "service-procedure",
    listKey: "serviceProcedures",
    companyScoped: false,
    inlineCreate: false,
    label: "Procedimento",
    category: "Serviço",
    extraFields: [
      { key: "code", label: "Código", type: "text", required: true, placeholder: "Ex: PR-001" },
    ],
  },
  "execution-time": {
    endpoint: "execution-time",
    listKey: "executionTimes",
    companyScoped: false,
    inlineCreate: false,
    label: "Tempo de Execução",
    category: "Serviço",
    extraFields: [
      { key: "minutes", label: "Minutos", type: "number", required: true, placeholder: "Ex: 30" },
    ],
  },
  "job-system": {
    endpoint: "job-system",
    listKey: "jobSystems",
    companyScoped: false,
    inlineCreate: true,
    label: "Sistema de Trabalho",
    category: "Serviço",
  },
  meter: {
    endpoint: "meter",
    listKey: "meters",
    companyScoped: false,
    inlineCreate: false,
    label: "Medidor",
    category: "Serviço",
    extraFields: [
      { key: "complement", label: "Complemento", type: "text", required: true, placeholder: "Ex: h" },
    ],
  },
  period: {
    endpoint: "period",
    listKey: "periods",
    companyScoped: false,
    inlineCreate: false,
    label: "Período",
    category: "Serviço",
    extraFields: [
      { key: "days", label: "Dias", type: "number", required: true, placeholder: "Ex: 30" },
    ],
  },
  priority: {
    endpoint: "priority",
    listKey: "priorities",
    companyScoped: false,
    inlineCreate: true,
    label: "Prioridade",
    category: "Serviço",
  },

  // ───── Pessoas e Operação ─────
  "access-level": {
    endpoint: "access-level",
    listKey: "accessLevels",
    companyScoped: false,
    inlineCreate: false,
    label: "Nível de Acesso",
    category: "Pessoas e Operação",
    readOnly: true,
  },
  "worker-role": {
    endpoint: "worker-role",
    listKey: "workerRoles",
    companyScoped: false,
    inlineCreate: true,
    label: "Função / Cargo",
    category: "Pessoas e Operação",
  },
  team: {
    endpoint: "team",
    listKey: "teams",
    companyScoped: false, // backend não filtra por company (TeamController.fetch é global)
    inlineCreate: true,
    label: "Equipe",
    category: "Pessoas e Operação",
  },
  "extra-team": {
    endpoint: "extra-team",
    listKey: "extraTeams",
    companyScoped: false,
    inlineCreate: true,
    label: "Equipe Extra",
    category: "Pessoas e Operação",
  },
  "estimated-extra-team-time": {
    endpoint: "estimated-extra-team-time",
    listKey: "estimatedExtraTeamTimes",
    companyScoped: false,
    inlineCreate: true,
    label: "Tempo Estimado Equipe Extra",
    category: "Pessoas e Operação",
  },
  toolkit: {
    endpoint: "toolkit",
    listKey: "toolkits",
    companyScoped: true,
    inlineCreate: true,
    label: "Kit de Ferramentas",
    category: "Pessoas e Operação",
  },
  "cost-center": {
    endpoint: "cost-center",
    listKey: "costCenters",
    companyScoped: true,
    inlineCreate: true,
    label: "Centro de Custo",
    category: "Pessoas e Operação",
  },

  // ───── Organizacional (página dedicada na Fase 3) ─────
  area: {
    endpoint: "area",
    listKey: "areas",
    companyScoped: true,
    inlineCreate: false,
    label: "Área",
    category: "Organizacional",
    dedicatedPage: true,
  },
  sector: {
    endpoint: "sector",
    listKey: "sectors",
    companyScoped: true,
    inlineCreate: false,
    label: "Setor",
    category: "Organizacional",
    dedicatedPage: true,
  },
  "area-model": {
    endpoint: "area-model",
    listKey: "areaModels",
    companyScoped: false,
    inlineCreate: false,
    label: "Modelo de Área",
    category: "Organizacional",
    dedicatedPage: true,
  },
  "sector-model": {
    endpoint: "sector-model",
    listKey: "sectorModels",
    companyScoped: false,
    inlineCreate: false,
    label: "Modelo de Setor",
    category: "Organizacional",
    dedicatedPage: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Estado interno
// ─────────────────────────────────────────────────────────────────────────────

interface LookupState {
  items: LookupItem[];
  loading: boolean;
  error: string | null;
  /** Cache key (companyId atual quando carregado, ou "global"). */
  cacheKey: string;
}

interface LookupContextValue {
  /**
   * Snapshot puro do estado atual do lookup. NÃO dispara fetch.
   * Sempre seguro de chamar durante render.
   */
  getLookupSnapshot: (key: LookupKey) => LookupState;
  /**
   * Garante que o lookup foi carregado (idempotente). Pode disparar fetch
   * e setState — chame de dentro de useEffect, NUNCA durante render.
   */
  ensureLoaded: (key: LookupKey) => void;
  /** Força recarga de um lookup. */
  refetch: (key: LookupKey) => Promise<void>;
  /** Cria um item via POST /:endpoint/single { name } e atualiza cache. Retorna o item criado (com id) ou null. */
  createLookupItem: (key: LookupKey, name: string) => Promise<LookupItem | null>;
}

const LookupContext = createContext<LookupContextValue | undefined>(undefined);

// Aceita resposta no formato { <listKey>: [...] } ou faz fallback para o primeiro array do body.
function extractItems(body: unknown, listKey: string): LookupItem[] {
  if (!body || typeof body !== "object") return [];
  const obj = body as Record<string, unknown>;
  const direct = obj[listKey];
  if (Array.isArray(direct)) return direct as LookupItem[];
  // Fallback: pega o primeiro array do body
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) return v as LookupItem[];
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function LookupProvider({ children }: { children: React.ReactNode }) {
  const { GetAPI, PostAPI } = useApiContext();
  const { effectiveCompanyId } = useCompany();

  // O estado de cada lookup é um sub-estado num único `state` para gerar re-renders
  // quando QUALQUER lookup for atualizado.
  const [state, setState] = useState<Partial<Record<LookupKey, LookupState>>>({});

  // Refs para deduplicar fetches paralelos da mesma key.
  const inflightRef = useRef<Partial<Record<LookupKey, Promise<void>>>>({});

  const fetchLookup = useCallback(
    async (key: LookupKey) => {
      const entry = LOOKUP_REGISTRY[key];
      const cacheKey = entry.companyScoped ? (effectiveCompanyId ?? "none") : "global";

      // Marca loading
      setState((prev) => ({
        ...prev,
        [key]: {
          items: prev[key]?.items ?? [],
          loading: true,
          error: null,
          cacheKey,
        },
      }));

      const url = entry.companyScoped && effectiveCompanyId
        ? `/${entry.endpoint}?companyId=${encodeURIComponent(effectiveCompanyId)}`
        : `/${entry.endpoint}`;

      const res = await GetAPI(url, true);

      if (res.status === 200) {
        const items = extractItems(res.body, entry.listKey);
        setState((prev) => ({
          ...prev,
          [key]: { items, loading: false, error: null, cacheKey },
        }));
      } else {
        const msg =
          typeof res.body?.message === "string"
            ? res.body.message
            : `Falha ao carregar ${entry.label.toLowerCase()}.`;
        setState((prev) => ({
          ...prev,
          [key]: { items: prev[key]?.items ?? [], loading: false, error: msg, cacheKey },
        }));
      }
    },
    [GetAPI, effectiveCompanyId]
  );

  // Ref pro state atual — usado em `ensureLoaded` que precisa ser estável
  // (sem depender de `state` no deps) pra não invalidar o useEffect dos consumidores.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const ensureLoaded = useCallback(
    (key: LookupKey) => {
      const entry = LOOKUP_REGISTRY[key];
      const currentCacheKey = entry.companyScoped
        ? (effectiveCompanyId ?? "none")
        : "global";
      const existing = stateRef.current[key];
      if (existing && existing.cacheKey === currentCacheKey && !existing.error) {
        return;
      }
      if (inflightRef.current[key]) return;
      const promise = fetchLookup(key).finally(() => {
        delete inflightRef.current[key];
      });
      inflightRef.current[key] = promise;
    },
    [effectiveCompanyId, fetchLookup]
  );

  const getLookupSnapshot = useCallback(
    (key: LookupKey): LookupState => {
      const entry = LOOKUP_REGISTRY[key];
      const currentCacheKey = entry.companyScoped
        ? (effectiveCompanyId ?? "none")
        : "global";
      return (
        state[key] ?? {
          items: [],
          loading: true,
          error: null,
          cacheKey: currentCacheKey,
        }
      );
    },
    [state, effectiveCompanyId]
  );

  const refetch = useCallback(
    (key: LookupKey) => fetchLookup(key),
    [fetchLookup]
  );

  const createLookupItem = useCallback(
    async (key: LookupKey, name: string): Promise<LookupItem | null> => {
      const entry = LOOKUP_REGISTRY[key];
      if (!entry.inlineCreate) {
        toast.error(
          `${entry.label} requer cadastro completo, não suporta criação inline.`
        );
        return null;
      }
      const trimmed = name.trim();
      if (!trimmed) {
        toast.error("Informe um nome.");
        return null;
      }

      // Payload: { name } + companyId se for company-scoped
      const payload: Record<string, unknown> = { name: trimmed };
      if (entry.companyScoped && effectiveCompanyId) {
        payload.companyId = effectiveCompanyId;
      }

      const res = await PostAPI(`/${entry.endpoint}/single`, payload, true);
      if (res.status === 200 || res.status === 201) {
        toast.success(`${entry.label} criado.`);
        await fetchLookup(key);
        // Tenta extrair o item criado do response (alguns endpoints retornam, outros não)
        const created = (res.body && typeof res.body === "object"
          ? (res.body as Record<string, unknown>)
          : null) as LookupItem | null;
        return created && created.id ? created : null;
      } else {
        const msg =
          typeof res.body?.message === "string"
            ? res.body.message
            : `Erro ao criar ${entry.label.toLowerCase()}.`;
        toast.error(msg);
        return null;
      }
    },
    [PostAPI, effectiveCompanyId, fetchLookup]
  );

  const value = useMemo<LookupContextValue>(
    () => ({ getLookupSnapshot, ensureLoaded, refetch, createLookupItem }),
    [getLookupSnapshot, ensureLoaded, refetch, createLookupItem]
  );

  return (
    <LookupContext.Provider value={value}>{children}</LookupContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook público
// ─────────────────────────────────────────────────────────────────────────────

export function useLookup(key: LookupKey) {
  const ctx = useContext(LookupContext);
  if (!ctx)
    throw new Error("useLookup deve ser usado dentro de <LookupProvider>");

  // Dispara o fetch via efeito (não durante render) — evita
  // "Cannot update a component while rendering a different component".
  useEffect(() => {
    ctx.ensureLoaded(key);
  }, [ctx, key]);

  const state = ctx.getLookupSnapshot(key);
  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    refetch: () => ctx.refetch(key),
    createItem: (name: string) => ctx.createLookupItem(key, name),
  };
}

export function useLookupContext() {
  const ctx = useContext(LookupContext);
  if (!ctx)
    throw new Error(
      "useLookupContext deve ser usado dentro de <LookupProvider>"
    );
  return ctx;
}
