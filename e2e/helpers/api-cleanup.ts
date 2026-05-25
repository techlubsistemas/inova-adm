/**
 * Helpers para limpar dados criados pelos testes E2E via API direta.
 * Útil porque alguns fluxos não têm botão de delete e/ou criam efeitos
 * colaterais que precisam ser removidos no afterAll.
 */

import { request, type APIRequestContext } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3333";
const E2E_EMAIL = process.env.E2E_EMAIL ?? "admin@alpha.com";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "Senha@123";

let cachedToken: string | null = null;

export async function getApiToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const ctx = await request.newContext();
  const res = await ctx.post(`${API_URL}/admin/signin`, {
    data: { email: E2E_EMAIL, password: E2E_PASSWORD },
  });
  const body = await res.json();
  cachedToken = body.accessToken;
  await ctx.dispose();
  if (!cachedToken) throw new Error("Login E2E falhou: sem accessToken");
  return cachedToken;
}

export async function apiCtx(): Promise<APIRequestContext> {
  const token = await getApiToken();
  return await request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "any",
    },
  });
}

/** Deleta um lookup/entidade por endpoint + query param (ex: deleteApi("priority","priorities",id)) */
export async function deleteApi(endpoint: string, queryKey: string, id: string) {
  const ctx = await apiCtx();
  await ctx.delete(`/${endpoint}?${queryKey}=${encodeURIComponent(id)}`);
  await ctx.dispose();
}

/** Procura uma entidade pelo nome dentro de uma lista da API e retorna o id. */
export async function findIdByName(
  endpoint: string,
  listKey: string,
  name: string,
  companyId?: string
): Promise<string | null> {
  const ctx = await apiCtx();
  const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : "";
  const res = await ctx.get(`/${endpoint}${qs}`);
  const body = await res.json();
  await ctx.dispose();
  const list = (body?.[listKey] ?? []) as Array<{ id: string; name?: string; tag?: string }>;
  const found = list.find((x) => x.name === name || x.tag === name);
  return found?.id ?? null;
}
