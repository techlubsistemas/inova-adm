/**
 * Worker — criar.
 * Usa placeholders exatos para evitar ambiguidade (CEP/telefone têm formatos parecidos).
 */

import { test, expect } from "@playwright/test";
import { apiCtx, findIdByName } from "./helpers/api-cleanup";

const TAG = `E2E-${Date.now()}`;

/**
 * CPF único por run (11 dígitos). Combina os últimos 8 dígitos do timestamp
 * + 3 dígitos randômicos. Evita colisão de UNIQUE constraint em workers.cpf
 * caso cleanup falhe em runs anteriores.
 */
function uniqueCpf(): string {
  const ts = String(Date.now()).slice(-8);
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return ts + rand;
}

test("Worker — criar com todos os campos básicos", async ({ page }) => {
  const name = `Colaborador ${TAG}`;
  const cpf = uniqueCpf();
  await page.goto("/usuarios");
  await expect(page.getByRole("heading", { name: /usuários/i })).toBeVisible();

  await page.getByRole("button", { name: /novo colaborador/i }).click();

  const dialog = page.getByRole("dialog");

  // Usa placeholders exatos
  await dialog.getByPlaceholder("Nome do colaborador").fill(name);
  await dialog.getByPlaceholder("(00) 00000-0000").fill("11999990000");
  await dialog.getByPlaceholder("000.000.000-00").fill(cpf);
  await dialog.getByPlaceholder("RG", { exact: true }).fill("11.222.333-4");
  await dialog.getByPlaceholder("Rua, número").fill("Rua Teste, 123");
  await dialog.getByPlaceholder("Bairro", { exact: true }).fill("Centro");
  await dialog.getByPlaceholder("Cidade", { exact: true }).fill("São Paulo");
  await dialog.getByPlaceholder("SP", { exact: true }).fill("SP");
  await dialog.getByPlaceholder("00000-000", { exact: true }).fill("01000-000");

  await dialog.getByRole("button", { name: /^criar$/i }).click();

  // Aguardar dialog fechar ou modal de senha temporária aparecer
  await page.waitForTimeout(1500);

  // Verifica criação via API
  const id = await findIdByName("workers", "workers", name);
  expect(id, `Worker "${name}" não encontrado na API`).not.toBeNull();

  // Cleanup
  if (id) {
    const ctx = await apiCtx();
    await ctx.delete(`/workers/${id}`);
    await ctx.dispose();
  }
});
