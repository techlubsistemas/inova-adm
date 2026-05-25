/**
 * Auth helpers para E2E.
 *
 * O cookie de auth do inova-adm é HTTP-only? Não — usamos `next-client-cookies`
 * que grava no document.cookie. Por isso podemos persistir via storageState
 * do Playwright após login na UI.
 */

import { type Page, type BrowserContext, expect } from "@playwright/test";

export const E2E_EMAIL = process.env.E2E_EMAIL ?? "admin@alpha.com";
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "Senha@123";

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(E2E_EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /entrar/i }).click();
  // Espera redirecionar para área autenticada (login push pra /planejamento)
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}

/**
 * Salva o storageState para reusar entre testes (evita login repetido).
 * Chame uma vez em globalSetup e depois passe storageState nos projetos.
 */
export async function saveAuth(context: BrowserContext, path: string) {
  await context.storageState({ path });
}

/**
 * Helper para esperar que uma toast de sucesso apareça.
 */
export async function expectSuccessToast(page: Page, partial?: string | RegExp) {
  const toast = page.locator("[role='status'], .toast, [data-hot-toast]").first();
  await expect(toast).toBeVisible({ timeout: 5_000 });
  if (partial) {
    await expect(toast).toContainText(partial as string);
  }
}
