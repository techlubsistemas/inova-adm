/**
 * Smoke test — todas as rotas autenticadas carregam sem erro de console.
 * Cobre checklist B.1.
 */

import { test, expect } from "@playwright/test";

const ROUTES = [
  { path: "/", name: "Dashboard" },
  { path: "/parametros", name: "Parâmetros" },
  { path: "/areas", name: "Áreas" },
  { path: "/setores", name: "Setores" },
  { path: "/areas-modelo", name: "Modelos de Área" },
  { path: "/setores-modelo", name: "Modelos de Setor" },
  { path: "/usuarios", name: "Usuários" },
  { path: "/materiais", name: "Materiais" },
  { path: "/servicos", name: "Serviços" },
  { path: "/servicos-modelo", name: "Modelos de Serviço" },
  { path: "/modelos", name: "Modelos" },
  { path: "/modelos/criar", name: "Criar Modelo" },
  { path: "/equipamentos", name: "Equipamentos" },
  { path: "/equipamentos/criar", name: "Criar Equipamento" },
  { path: "/estrutura", name: "Estrutura" },
];

for (const route of ROUTES) {
  test(`smoke: carrega ${route.path}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Filtra erros conhecidos não-críticos
        if (
          text.includes("Failed to load resource") &&
          text.includes("favicon")
        ) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    await page.goto(route.path);

    // Espera o conteúdo principal aparecer (h1 ou main)
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 10_000 });

    // Pequena espera pra captar erros assíncronos
    await page.waitForTimeout(500);

    expect(
      consoleErrors,
      `Console errors em ${route.path}:\n${consoleErrors.join("\n")}`
    ).toHaveLength(0);
  });
}
