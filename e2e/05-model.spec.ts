/**
 * Equipment Model — cria modelo mínimo e modelo com árvore.
 */

import { test, expect } from "@playwright/test";
import { deleteApi, findIdByName } from "./helpers/api-cleanup";

const TAG = `E2E-${Date.now()}`;

test("Modelo — cria modelo mínimo (só nome + tipo)", async ({ page }) => {
  const name = `Modelo Min ${TAG}`;
  await page.goto("/modelos/criar");
  await expect(
    page.getByRole("heading", { name: /novo modelo de equipamento/i })
  ).toBeVisible();

  // Primeiro input text do form (mode=model → Nome é o primeiro)
  await page.locator("form input[type='text']").first().fill(name);

  // Seleciona primeiro Tipo de Equipamento — EntitySelect usa Radix Select
  // que renderiza como combobox role. Pega o primeiro combobox visível do form.
  const firstCombo = page.locator("form").getByRole("combobox").first();
  await firstCombo.click();
  await page.getByRole("option").first().click();

  // Submit
  await page.getByRole("button", { name: /^criar modelo$/i }).click();

  // Espera redirect pra /modelos
  await page.waitForURL("**/modelos", { timeout: 15_000 });

  // Cleanup
  const id = await findIdByName("equipment-model", "equipmentModels", name);
  if (id) await deleteApi("equipment-model", "equipmentModels", id);
});

test("Modelo — UI de estrutura aceita adicionar conjunto + subconjunto", async ({
  page,
}) => {
  const name = `Modelo Tree ${TAG}`;
  await page.goto("/modelos/criar");

  // Campos obrigatórios
  await page.locator("form input[type='text']").first().fill(name);
  const firstCombo = page.locator("form").getByRole("combobox").first();
  await firstCombo.click();
  await page.getByRole("option").first().click();

  // Expandir acordeão "Estrutura"
  await page.getByRole("button", { name: /^estrutura/i }).click();

  // Adicionar Conjunto — botão deve aparecer
  const addSetBtn = page.getByRole("button", { name: /adicionar conjunto/i });
  await expect(addSetBtn).toBeVisible();
  await addSetBtn.click();

  // Após clicar, "Adicionar Subconjunto" deve aparecer (porque um SetCard
  // foi criado e está expandido). Isso valida que a interação funcionou.
  const addSubBtn = page.getByRole("button", { name: /adicionar subconjunto/i });
  await expect(addSubBtn).toBeVisible({ timeout: 5_000 });
  await addSubBtn.click();

  // Submit (com set/subset sem nome — backend deve aceitar)
  await page.getByRole("button", { name: /^criar modelo$/i }).click();
  await page.waitForURL("**/modelos", { timeout: 15_000 });

  // Cleanup
  const id = await findIdByName("equipment-model", "equipmentModels", name);
  if (id) await deleteApi("equipment-model", "equipmentModels", id);
});
