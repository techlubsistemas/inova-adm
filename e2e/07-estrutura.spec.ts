/**
 * Estrutura — tree view + quick create.
 * Cobre B.8.
 */

import { test, expect } from "@playwright/test";
import { deleteApi, findIdByName } from "./helpers/api-cleanup";

const TAG = `E2E-${Date.now()}`;

test("Estrutura — cria Área via quick create modal", async ({ page }) => {
  const areaName = `Área ${TAG}`;

  await page.goto("/estrutura");
  await expect(page.getByRole("heading", { name: /^estrutura$/i })).toBeVisible();

  await page.getByRole("button", { name: /nova área/i }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder(/linha de produção/i).fill(areaName);
  await dialog.getByRole("button", { name: /^criar$/i }).click();

  await expect(dialog).toBeHidden({ timeout: 10_000 });

  // Área aparece na tree
  await expect(page.getByText(areaName)).toBeVisible({ timeout: 5_000 });

  // Cleanup via API
  const id = await findIdByName("area", "areas", areaName);
  if (id) await deleteApi("area", "areas", id);
});
