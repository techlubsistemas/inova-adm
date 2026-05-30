/**
 * Entitlements — gating da sidebar por módulo contratado e página /empresas.
 *
 * Começa deslogado (ignora o storageState de admin@alpha do global-setup) para
 * poder logar como empresa parcial (Beta) e como super admin.
 */

import { test, expect, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}

test("sidebar gateada: empresa parcial (Beta) esconde módulos não contratados", async ({
  page,
}) => {
  // Beta contratou CADASTROS, DASHBOARD, TREINAMENTOS (ver seed).
  await loginAs(page, "admin@beta.com", "Senha@123");

  const nav = page.locator("aside nav");
  // Módulos contratados → visíveis
  await expect(nav.getByRole("link", { name: "Estrutura" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Equipamentos" })).toBeVisible();
  // Módulos NÃO contratados → ocultos
  await expect(nav.getByRole("link", { name: "Ordens de Serviço" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Anomalias" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Planejamento" })).toHaveCount(0);
  // Item de super admin não aparece para admin de empresa
  await expect(nav.getByRole("link", { name: "Empresas" })).toHaveCount(0);
});

test("super admin: vê 'Empresas' e gerencia módulos contratados", async ({
  page,
}) => {
  await loginAs(page, "admin@inova.com", "Inova@26");

  await expect(
    page.locator("aside nav").getByRole("link", { name: "Empresas" }),
  ).toBeVisible();

  await page.goto("/empresas");
  await expect(
    page.getByRole("heading", { name: /Módulos Contratados/i }),
  ).toBeVisible();
  // Escopado ao conteúdo (o label "Análise de Óleo" também existe na sidebar).
  const main = page.getByRole("main");
  await expect(main.getByText("Cadastros", { exact: true })).toBeVisible();
  await expect(main.getByText("Análise de Óleo", { exact: true })).toBeVisible();
});
