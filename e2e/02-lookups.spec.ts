/**
 * /parametros — CRUD genérico de TODOS os lookups (cobertura completa).
 *
 * Espelha o LOOKUP_REGISTRY (src/context/LookupContext.tsx), excluindo os de
 * página dedicada (material, service, service-model, area, sector, area-model,
 * sector-model) e o read-only (access-level).
 *
 * Padrão do LookupManager: sidebar com botão do tipo → "Novo {label}" →
 * dialog (Nome + extras) → "Criar" → editar (aria-label "Editar") → "Salvar".
 * DELETE de cleanup: /{endpoint}?{listKey}={id}.
 *
 * `broken` marca cadastros com defeito CONFIRMADO no backend (ver probe em
 * 30/05). Esses viram `test.fixme` (verde, mas rastreado). Remova o marcador
 * quando a rota/DTO da API for corrigida — o teso volta a validar de verdade.
 */

import { test, expect } from "@playwright/test";
import { deleteApi, findIdByName } from "./helpers/api-cleanup";
import { uniqueName } from "./fixtures";

interface Lookup {
  /** Texto exato do botão na sidebar e base do "Novo {label}". */
  label: string;
  endpoint: string;
  listKey: string;
  /** Valores para campos além do Nome, na ordem em que aparecem no dialog. */
  extras?: string[];
  /** Defeito conhecido no backend — quando presente, o teste vira fixme. */
  broken?: string;
}

const LOOKUPS: Lookup[] = [
  // ── Estrutura ──
  { label: "Tipo de Equipamento", endpoint: "equipment-type", listKey: "equipmentTypes" },
  { label: "Tipo de Conjunto", endpoint: "set-type", listKey: "setTypes" },
  { label: "Tipo de Subconjunto", endpoint: "subset-type", listKey: "subsetTypes" },
  { label: "Tipo de CIP", endpoint: "cip-type", listKey: "cipTypes" },
  // ── Materiais e Fluidos ──
  { label: "Tipo de Material", endpoint: "material-type", listKey: "materialTypes" },
  { label: "Família de Material", endpoint: "material-family", listKey: "materialFamilies", extras: ["MO"] },
  { label: "Fabricante", endpoint: "manufacturer", listKey: "manufacturers" },
  { label: "Fornecedor", endpoint: "supplier", listKey: "suppliers" },
  { label: "Unidade", endpoint: "unit", listKey: "units", extras: ["L"] },
  { label: "Unidade de Potência", endpoint: "power-unit", listKey: "powerUnits", extras: ["CV"] },
  { label: "Componente Principal", endpoint: "main-component", listKey: "mainComponents" },
  { label: "Sistema de Lubrificação", endpoint: "lubrication-system", listKey: "lubricationSystems" },
  { label: "Filtro de Óleo", endpoint: "filter-oil", listKey: "filterOils" },
  { label: "Filtro de Pressão", endpoint: "filter-pressure", listKey: "filterPressures" },
  { label: "Filtro de Sucção", endpoint: "filter-suction", listKey: "filterSuctions" },
  { label: "Filtro de Retorno", endpoint: "filter-return", listKey: "filterReturns" },
  // ── Serviço ──
  { label: "Tipo de Serviço", endpoint: "service-type", listKey: "serviceTypes" },
  { label: "Motivo do Serviço", endpoint: "service-reason", listKey: "serviceReasons" },
  { label: "Motivo de Anomalia", endpoint: "service-problem-reason", listKey: "serviceProblemReasons" },
  { label: "Condição do Serviço", endpoint: "service-condition", listKey: "serviceConditions" },
  { label: "Procedimento", endpoint: "service-procedure", listKey: "serviceProcedures", extras: ["PR-001"] },
  // "Tempo de Execução" tem teste dedicado abaixo (o backend deriva o nome de `minutes`).
  { label: "Sistema de Trabalho", endpoint: "job-system", listKey: "jobSystems" },
  { label: "Medidor", endpoint: "meter", listKey: "meters", extras: ["h"] },
  { label: "Período", endpoint: "period", listKey: "periods", extras: ["30"] },
  { label: "Prioridade", endpoint: "priority", listKey: "priorities" },
  // ── Pessoas e Operação ──
  { label: "Função / Cargo", endpoint: "worker-role", listKey: "workerRoles" },
  { label: "Equipe", endpoint: "team", listKey: "teams" },
  { label: "Equipe Extra", endpoint: "extra-team", listKey: "extraTeams" },
  { label: "Tempo Estimado Equipe Extra", endpoint: "estimated-extra-team-time", listKey: "estimatedExtraTeamTimes" },
  { label: "Kit de Ferramentas", endpoint: "toolkit", listKey: "toolkits" },
  { label: "Centro de Custo", endpoint: "cost-center", listKey: "costCenters" },
];

test.describe("/parametros — CRUD de todos os lookups", () => {
  for (const lk of LOOKUPS) {
    test(`lookup: ${lk.label}`, async ({ page }) => {
      test.fixme(!!lk.broken, lk.broken ?? "");

      const name = uniqueName(lk.label);
      const renamed = `${name} (ed)`;

      await page.goto("/parametros");
      await page.getByRole("button", { name: lk.label, exact: true }).click();

      // ── criar ──
      await page.getByRole("button", { name: `Novo ${lk.label}` }).click();
      const dialog = page.getByRole("dialog");
      await dialog.locator("input").nth(0).fill(name);
      const extras = lk.extras ?? [];
      for (let i = 0; i < extras.length; i++) {
        await dialog.locator("input").nth(i + 1).fill(extras[i]);
      }
      await dialog.getByRole("button", { name: /^criar$/i }).click();
      await expect(dialog).toBeHidden({ timeout: 10_000 });

      // ── verificar (filtra pela busca p/ evitar paginação) ──
      const search = page.getByPlaceholder(/^buscar/i);
      await search.fill(name);
      const row = page.locator("tr", { hasText: name });
      await expect(row).toBeVisible({ timeout: 5_000 });

      // ── editar ──
      await row.getByRole("button", { name: "Editar" }).click();
      const editDialog = page.getByRole("dialog");
      await editDialog.locator("input").nth(0).fill(renamed);
      await editDialog.getByRole("button", { name: /^salvar$/i }).click();
      await expect(editDialog).toBeHidden({ timeout: 10_000 });

      await search.fill(renamed);
      await expect(page.locator("tr", { hasText: renamed })).toBeVisible({ timeout: 5_000 });

      // ── cleanup via API ──
      const id = await findIdByName(lk.endpoint, lk.listKey, renamed);
      if (id) await deleteApi(lk.endpoint, lk.listKey, id);
    });
  }
});

/**
 * Tempo de Execução é especial: o backend normaliza o registro e DERIVA o nome
 * a partir de `minutes` (ex.: 30 → "30 min"), ignorando o nome digitado. Por
 * isso a verificação usa o nome derivado, não o nome livre.
 */
test("lookup especial: Tempo de Execução (nome derivado de minutos)", async ({ page }) => {
  const minutes = 9000 + (Date.now() % 1000); // valor improvável de já existir
  const expected = `${minutes} min`;

  await page.goto("/parametros");
  await page.getByRole("button", { name: "Tempo de Execução", exact: true }).click();

  await page.getByRole("button", { name: "Novo Tempo de Execução" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("input").nth(0).fill("auto"); // Nome (ignorado pelo backend)
  await dialog.locator("input").nth(1).fill(String(minutes)); // Minutos
  await dialog.getByRole("button", { name: /^criar$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });

  const search = page.getByPlaceholder(/^buscar/i);
  await search.fill(expected);
  await expect(page.locator("tr", { hasText: expected })).toBeVisible({ timeout: 5_000 });

  const id = await findIdByName("execution-time", "executionTimes", expected);
  if (id) await deleteApi("execution-time", "executionTimes", id);
});
