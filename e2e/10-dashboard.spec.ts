/**
 * Dashboard (/) — valida que os widgets consomem dados reais da API
 * (GET /dashboard/summary, /supply-alerts, /schedule), não mais o mock.
 */

import { test, expect } from "@playwright/test";

test.describe("/dashboard — dados reais", () => {
  test("KPIs reais carregam e o mock antigo sumiu", async ({ page }) => {
    await page.goto("/");

    // Títulos reais (únicos — não existem na sidebar)
    await expect(page.getByText("Backlog (OS atrasadas)")).toBeVisible();
    await expect(page.getByText("Aderência ao Plano (30d)")).toBeVisible();
    await expect(page.getByText("Anomalias Abertas")).toBeVisible();

    // O mock antigo não deve mais existir
    await expect(page.getByText("92% Operacional")).toHaveCount(0);

    // O valor do card de Backlog (h3 irmão do título) deve ser numérico (saiu do "…")
    const backlogValue = page
      .getByText("Backlog (OS atrasadas)", { exact: true })
      .locator("xpath=following-sibling::h3");
    await expect(backlogValue).toHaveText(/^\d+$/, { timeout: 10_000 });
  });

  test("widgets de cronograma e insumos resolvem o fetch", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Cronograma de Execução")).toBeVisible();
    await expect(page.getByText("Alertas de Insumos")).toBeVisible();

    // Insumos: ou lista (SKU:) ou estado vazio — provando que o fetch terminou.
    await expect(
      page.getByText(/Nenhum insumo abaixo|SKU:/).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
