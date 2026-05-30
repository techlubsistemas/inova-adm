/**
 * Análise de Óleo — criar amostra, lançar resultados e ver o diagnóstico
 * computado. Empresa Alpha contratou ANALISE_OLEO.
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

test("cria amostra, lança resultados e gera diagnóstico crítico", async ({
  page,
}) => {
  await loginAs(page, "admin@alpha.com", "Senha@123");
  await page.goto("/analise-oleo");

  await expect(
    page.getByRole("heading", { name: "Análise de Óleo" }),
  ).toBeVisible();

  // Nova amostra
  await page.getByRole("button", { name: /Nova amostra/i }).click();
  const createDialog = page.getByRole("dialog");
  // Espera o select de equipamento carregar (valor não-vazio) antes de criar.
  await expect(createDialog.locator("select")).not.toHaveValue("", {
    timeout: 10_000,
  });
  await createDialog.getByRole("button", { name: /^criar$/i }).click();
  await expect(createDialog).toBeHidden({ timeout: 10_000 });

  // Abrir a primeira amostra (aguarda a linha aparecer)
  const abrir = page.getByRole("button", { name: "Abrir", exact: true }).first();
  await expect(abrir).toBeVisible({ timeout: 10_000 });
  await abrir.click();
  const detail = page.getByRole("dialog");
  await expect(detail).toBeVisible();

  // Lançar TAN e TBN críticos (TAN>=4, TBN<=2)
  await detail.locator("input").nth(0).fill("5"); // TAN
  await detail.locator("input").nth(1).fill("1"); // TBN
  await detail.getByRole("button", { name: /Salvar resultados/i }).click();

  // Diagnóstico crítico aparece
  await expect(detail.getByText("Crítico").first()).toBeVisible({
    timeout: 10_000,
  });
});
