/**
 * Cadastros organizacionais (páginas dedicadas) — Área, Modelo de Área,
 * Setor (FK Área) e Modelo de Setor (FK Modelo de Área).
 *
 * Todos usam o OrgEntityPage genérico: "Novo {label}" → dialog (Nome + parent
 * EntitySelect) → "Criar". Os FKs usam dados determinísticos do seed (empresa
 * Alpha) via fixtures. DELETE de cleanup: /{endpoint}?{listKey}={id}.
 */

import { test, expect, type Page } from "@playwright/test";
import { deleteApi, findIdByName } from "./helpers/api-cleanup";
import { uniqueName, SEED } from "./fixtures";

async function selectParent(page: Page, optionName: string) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: optionName, exact: true }).click();
}

test("Área — cria e edita via /areas", async ({ page }) => {
  const name = uniqueName("Área");
  const renamed = `${name} (ed)`;

  await page.goto("/areas");
  await page.getByRole("button", { name: "Novo Área" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[type="text"]').first().fill(name);
  await dialog.getByRole("button", { name: /^criar$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });

  const search = page.getByPlaceholder(/^buscar/i);
  await search.fill(name);
  const row = page.locator("tr", { hasText: name });
  await expect(row).toBeVisible({ timeout: 5_000 });

  await row.getByRole("button", { name: "Editar" }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.locator('input[type="text"]').first().fill(renamed);
  await editDialog.getByRole("button", { name: /^salvar$/i }).click();
  await expect(editDialog).toBeHidden({ timeout: 10_000 });

  const id = await findIdByName("area", "areas", renamed);
  if (id) await deleteApi("area", "areas", id);
});

test("Modelo de Área — cria via /areas-modelo", async ({ page }) => {
  const name = uniqueName("Modelo de Área");

  await page.goto("/areas-modelo");
  await page.getByRole("button", { name: "Novo Modelo de Área" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[type="text"]').first().fill(name);
  await dialog.getByRole("button", { name: /^criar$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });

  await page.getByPlaceholder(/^buscar/i).fill(name);
  await expect(page.locator("tr", { hasText: name })).toBeVisible({ timeout: 5_000 });

  const id = await findIdByName("area-model", "areaModels", name);
  if (id) await deleteApi("area-model", "areaModels", id);
});

test("Setor — cria com Área (FK) via /setores", async ({ page }) => {
  const name = uniqueName("Setor");

  await page.goto("/setores");
  await page.getByRole("button", { name: "Novo Setor" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[type="text"]').first().fill(name);
  await selectParent(page, SEED.areaName);
  await dialog.getByRole("button", { name: /^criar$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });

  await page.getByPlaceholder(/^buscar/i).fill(name);
  await expect(page.locator("tr", { hasText: name })).toBeVisible({ timeout: 5_000 });

  const id = await findIdByName("sector", "sectors", name);
  if (id) await deleteApi("sector", "sectors", id);
});

test("Modelo de Setor — cria com Modelo de Área (FK) via /setores-modelo", async ({ page }) => {
  const name = uniqueName("Modelo de Setor");

  await page.goto("/setores-modelo");
  await page.getByRole("button", { name: "Novo Modelo de Setor" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[type="text"]').first().fill(name);
  await selectParent(page, SEED.areaModelName);
  await dialog.getByRole("button", { name: /^criar$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });

  await page.getByPlaceholder(/^buscar/i).fill(name);
  await expect(page.locator("tr", { hasText: name })).toBeVisible({ timeout: 5_000 });

  const id = await findIdByName("sector-model", "sectorModels", name);
  if (id) await deleteApi("sector-model", "sectorModels", id);
});
