/**
 * Treinamentos — catálogo (super admin) e gestão de conclusão (admin de empresa).
 * Começa deslogado para escolher o usuário por teste.
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

test("catálogo: super admin vê treinamentos do seed e pode criar", async ({
  page,
}) => {
  await loginAs(page, "admin@inova.com", "Inova@26");
  await page.goto("/treinamentos");

  await expect(
    page.getByRole("heading", { name: "Treinamentos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Fundamentos de Lubrificacao" }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByRole("heading", { name: "Seguranca em Motores Eletricos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Novo treinamento/i }),
  ).toBeVisible();
});

test("gestão: admin de empresa vê progresso dos colaboradores", async ({
  page,
}) => {
  await loginAs(page, "admin@alpha.com", "Senha@123");
  await page.goto("/treinamentos");

  await page.getByRole("button", { name: "Gestão", exact: true }).click();
  // João concluiu o treinamento exigido pela função dele (seed).
  await expect(page.getByText("Joao Pereira")).toBeVisible({ timeout: 10_000 });
  // Admin de empresa não vê o botão de criar (apenas super admin gerencia o catálogo).
  await expect(
    page.getByRole("button", { name: /Novo treinamento/i }),
  ).toHaveCount(0);
});
