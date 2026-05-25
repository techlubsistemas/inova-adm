/**
 * Material — criar com nome mínimo.
 */

import { test, expect } from "@playwright/test";
import { deleteApi, findIdByName } from "./helpers/api-cleanup";

const TAG = `E2E-${Date.now()}`;

test("Material — cria com nome mínimo", async ({ page }) => {
  const name = `Material ${TAG}`;
  await page.goto("/materiais");
  await expect(page.getByRole("heading", { name: /^materiais$/i })).toBeVisible();

  await page.getByRole("button", { name: /novo material/i }).click();

  const dialog = page.getByRole("dialog");
  // Primeiro input do dialog = Nome (Identificação aberto por default)
  await dialog.locator("input[type='text']").first().fill(name);

  await dialog.getByRole("button", { name: /^criar$/i }).click();
  await page.waitForTimeout(1500);

  // Verifica via API
  await expect
    .poll(async () => await findIdByName("material", "materials", name), {
      timeout: 10_000,
    })
    .not.toBeNull();

  const id = await findIdByName("material", "materials", name);
  if (id) await deleteApi("material", "materials", id);
});
