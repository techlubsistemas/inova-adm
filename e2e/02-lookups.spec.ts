/**
 * Lookups (/parametros) — CRUD genérico via UI.
 */

import { test, expect } from "@playwright/test";
import { deleteApi, findIdByName } from "./helpers/api-cleanup";

const TAG = `E2E-${Date.now()}`;

test.describe("/parametros — CRUD de lookup", () => {
  test("cria, edita e remove uma prioridade", async ({ page }) => {
    const name = `Prioridade ${TAG}`;
    const renamed = `Prioridade ${TAG} (renomeada)`;

    await page.goto("/parametros");

    // Seleciona "Prioridade" na sidebar de lookups
    await page.getByRole("button", { name: "Prioridade", exact: true }).click();

    // Criar (botão "Novo Prioridade")
    await page.getByRole("button", { name: /novo prioridade/i }).click();
    const dialog = page.getByRole("dialog");
    // Primeiro input do dialog = Nome (autoFocus)
    await dialog.locator("input").first().fill(name);
    await dialog.getByRole("button", { name: /^criar$/i }).click();

    await expect(page.getByText(name).first()).toBeVisible({ timeout: 5_000 });

    // Editar (botão lápis na linha que contém o nome)
    const row = page.locator("tr", { hasText: name });
    await row.getByRole("button", { name: /editar/i }).click();
    const editDialog = page.getByRole("dialog");
    const nameInput = editDialog.locator("input").first();
    await nameInput.fill(renamed);
    await editDialog.getByRole("button", { name: /salvar/i }).click();

    await expect(page.getByText(renamed).first()).toBeVisible({ timeout: 5_000 });

    // Cleanup via API
    const id = await findIdByName("priority", "priorities", renamed);
    if (id) await deleteApi("priority", "priorities", id);
  });
});
