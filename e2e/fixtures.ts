/**
 * Fixtures E2E — fonte única de credenciais e dados conhecidos do seed.
 *
 * Espelha (manualmente) `inova-api/prisma/seed/fixtures.ts`. Se o seed mudar
 * credenciais ou nomes determinísticos, atualize aqui.
 *
 * Os testes logam por padrão como ADMIN DE EMPRESA (Alpha) — não super admin —
 * porque os cadastros organizacionais company-scoped exigem uma empresa ativa.
 */

export const CREDS = {
  superAdmin: { email: "admin@inova.com", password: "Inova@26" },
  companyAdmin: { email: "admin@alpha.com", password: "Senha@123" },
} as const;

/** Nomes determinísticos criados pelo seed operacional (empresa Alpha / globais). */
export const SEED = {
  /** Área da empresa Alpha — usada para vincular um Setor novo. */
  areaName: "Producao",
  /** Modelo de Área global — usado para vincular um Modelo de Setor novo. */
  areaModelName: "Area Modelo Producao",
  /** Tipo de Serviço global — disponível no select de Serviço. */
  serviceTypeName: "Lubrificacao",
} as const;

let counter = 0;

/**
 * Gera um nome único e estável por execução, evitando colisão com o seed e
 * com dados deixados por runs anteriores cujo cleanup tenha falhado.
 */
export function uniqueName(prefix: string): string {
  counter += 1;
  return `${prefix} E2E-${Date.now()}-${counter}`;
}
