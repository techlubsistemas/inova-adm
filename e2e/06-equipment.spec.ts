/**
 * Equipment — cria equipamento mínimo.
 */

import { test, expect } from "@playwright/test";
import { deleteApi, findIdByName } from "./helpers/api-cleanup";

const TAG = `E2E-${Date.now()}`;

test("Equipment — cria com TAG, Setor, Nome e Tipo", async ({ page }) => {
  const tag = `${TAG}-EQ`;
  const name = `Equipamento ${TAG}`;

  await page.goto("/equipamentos/criar");
  await expect(
    page.getByRole("heading", { name: /novo equipamento/i })
  ).toBeVisible();

  // TAG: tem placeholder específico "Ex: BOM-001" em mode=equipment
  await page.getByPlaceholder("Ex: BOM-001").fill(tag);

  // No equipment mode, a ordem dos inputs no Identification:
  //   [0] TAG (text)        — preenchido acima
  //   [1] Nome (text)       — preencher abaixo
  //   [2..N] outros texts
  // Combobox ordem: [0] Setor, [1] Tipo de Equipamento, [2] Fabricante, [3] Centro de Custo
  // (porque EntitySelect renderiza como combobox)
  const textInputs = page.locator("form input[type='text']");
  // Nome é o segundo text input após TAG
  await textInputs.nth(1).fill(name);

  // Setor — primeiro combobox
  const combos = page.locator("form").getByRole("combobox");
  await combos.nth(0).click();
  await page.getByRole("option").first().click();

  // Tipo de Equipamento — segundo combobox
  await combos.nth(1).click();
  await page.getByRole("option").first().click();

  // Submit
  await page.getByRole("button", { name: /^criar equipamento$/i }).click();
  await page.waitForURL("**/equipamentos", { timeout: 15_000 });

  // Verifica via API (busca por tag)
  const id = await findIdByName("equipment", "equipments", tag);
  expect(id, `Equipamento com tag "${tag}" não encontrado`).not.toBeNull();

  // Cleanup
  if (id) await deleteApi("equipment", "equipments", id);
});
