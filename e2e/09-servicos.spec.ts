/**
 * Serviços e Modelos de Serviço (páginas dedicadas — ServicesPageShell).
 *
 * "Novo {label}" → ServiceFormDialog (Nome + Descrição + Tipo de Serviço) →
 * "Criar". A verificação é feita pela API (persistência) para não depender do
 * layout da lista. Cleanup via DELETE.
 */

import { test, expect } from "@playwright/test";
import { deleteApi, findIdByName } from "./helpers/api-cleanup";
import { uniqueName } from "./fixtures";

test("Serviço — cria via /servicos", async ({ page }) => {
  const name = uniqueName("Serviço");

  await page.goto("/servicos");
  await page.getByRole("button", { name: "Novo Serviço" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[type="text"]').first().fill(name);
  await dialog.getByRole("button", { name: /^criar$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });

  // Verifica persistência via API (company-scoped → usa companyId do JWT).
  const id = await findIdByName("service", "services", name);
  expect(id, "Serviço deveria persistir na API").not.toBeNull();
  if (id) await deleteApi("service", "services", id);
});

test("Modelo de Serviço — cria via /servicos-modelo", async ({ page }) => {
  const name = uniqueName("Modelo de Serviço");

  await page.goto("/servicos-modelo");
  await page.getByRole("button", { name: "Novo Modelo de Serviço" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[type="text"]').first().fill(name);
  await dialog.getByRole("button", { name: /^criar$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });

  const id = await findIdByName("service-model", "serviceModels", name);
  expect(id, "Modelo de Serviço deveria persistir na API").not.toBeNull();
  // Nota: o controller de service-model usa "services" como query key no DELETE.
  if (id) await deleteApi("service-model", "services", id);
});
