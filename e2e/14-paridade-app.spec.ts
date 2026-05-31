/**
 * Paridade app ↔ web (cadastros).
 *
 * O inova-app (React Native) não tem como rodar e2e de UI aqui (precisa de
 * Detox/Maestro + device). Mas o app submete os cadastros pelo MESMO backend do
 * web, via POST /sync/batch (outbox offline-first). Este teste valida esse
 * contrato real do app: cria cada cadastro no formato de operação do app e
 * confirma que ele persiste e aparece no MESMO GET que o inova-adm (web) lê —
 * garantindo paridade de contrato entre os dois.
 *
 * (O web cria os mesmos registros via POST /{entidade}/single, já coberto pelos
 * specs 02/06/08/09.)
 */

import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { apiCtx, deleteApi, findIdByName } from "./helpers/api-cleanup";
import { uniqueName } from "./fixtures";

interface BatchResult {
  results: { clientOpId: string; ok: boolean; error?: string }[];
}

async function syncBatch(
  operations: Record<string, unknown>[],
): Promise<BatchResult> {
  const ctx = await apiCtx();
  const res = await ctx.post("/sync/batch", { data: { operations } });
  const body = (await res.json()) as BatchResult;
  await ctx.dispose();
  return body;
}

function createOp(
  entity: string,
  id: string,
  payload: Record<string, unknown>,
) {
  return { clientOpId: randomUUID(), op: "create", entity, id, payload };
}

test.describe("Paridade app↔web — cadastros via /sync/batch (caminho do inova-app)", () => {
  test("Área criada pelo app aparece no GET que o web lê", async () => {
    const name = uniqueName("Área APP");
    const id = randomUUID();
    const { results } = await syncBatch([
      createOp("area", id, { name, position: "99" }),
    ]);
    expect(results[0]?.ok, results[0]?.error).toBe(true);
    expect(await findIdByName("area", "areas", name)).toBe(id);
    await deleteApi("area", "areas", id);
  });

  test("Setor (FK Área) criado pelo app aparece no GET do web", async () => {
    const areaId = randomUUID();
    const sectorName = uniqueName("Setor APP");
    const sectorId = randomUUID();
    const { results } = await syncBatch([
      createOp("area", areaId, { name: uniqueName("Área APP"), position: "99" }),
      createOp("sector", sectorId, {
        name: sectorName,
        position: "99",
        areaId,
      }),
    ]);
    expect(results[0]?.ok, results[0]?.error).toBe(true);
    expect(results[1]?.ok, results[1]?.error).toBe(true);
    expect(await findIdByName("sector", "sectors", sectorName)).toBe(sectorId);
    await deleteApi("sector", "sectors", sectorId);
    await deleteApi("area", "areas", areaId);
  });

  test("Lookup (Prioridade) criado pelo app aparece no GET do web", async () => {
    const name = uniqueName("Prioridade APP");
    const id = randomUUID();
    const { results } = await syncBatch([
      createOp("lookup", id, { type: "priority", name }),
    ]);
    expect(results[0]?.ok, results[0]?.error).toBe(true);
    expect(await findIdByName("priority", "priorities", name)).toBe(id);
    await deleteApi("priority", "priorities", id);
  });

  test("Serviço criado pelo app aparece no GET do web", async () => {
    const name = uniqueName("Serviço APP");
    const id = randomUUID();
    const { results } = await syncBatch([createOp("service", id, { name })]);
    expect(results[0]?.ok, results[0]?.error).toBe(true);
    expect(await findIdByName("service", "services", name)).toBe(id);
    await deleteApi("service", "services", id);
  });

  test("Equipamento (mínimo) criado pelo app aparece no GET do web", async () => {
    const areaId = randomUUID();
    const sectorId = randomUUID();
    const eqId = randomUUID();
    const tag = uniqueName("EQ-APP").replace(/\s+/g, "-");
    const { results } = await syncBatch([
      createOp("area", areaId, { name: uniqueName("Área APP"), position: "99" }),
      createOp("sector", sectorId, {
        name: uniqueName("Setor APP"),
        position: "99",
        areaId,
      }),
      createOp("equipment", eqId, { tag, name: "Equipamento APP", sectorId }),
    ]);
    expect(results[2]?.ok, results[2]?.error).toBe(true);
    expect(await findIdByName("equipment", "equipments", tag)).toBe(eqId);
    await deleteApi("equipment", "equipments", eqId);
    await deleteApi("sector", "sectors", sectorId);
    await deleteApi("area", "areas", areaId);
  });
});
