/**
 * Parser de planilhas XLSX para importação em lote de Equipment Models e
 * Equipments. Espelha o mobile (`inova-app/lib/modelExcelImport.ts` e
 * `equipmentExcelImport.ts`) mas produz `ModelFormData[]` direto.
 *
 * Formato esperado: 4 sheets (Modelos, Estrutura, Materiais, Servicos) com
 * células no formato "Nome [ID: uuid]" para FKs. Gerado por
 * `GET /equipment-model/template` ou `GET /equipment/template`.
 */

import * as XLSX from "xlsx";
import {
  emptyModelForm,
  newTempId,
} from "@/lib/model-mapping";
import type { ModelFormData, Criticality } from "@/lib/model-form-types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RawRow = Record<string, unknown>;

function getValueFuzzy(row: RawRow, keyword: string): unknown {
  if (row[keyword] !== undefined) return row[keyword];
  const match = Object.keys(row).find((k) =>
    k.toLowerCase().includes(keyword.toLowerCase())
  );
  return match ? row[match] : undefined;
}

function extractId(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  const str = String(val);
  const m = str.match(/\[ID:\s*([^\]]+)\]/i);
  const extracted = m && m[1] ? m[1].trim() : str.trim();
  return UUID_RE.test(extracted) ? extracted : undefined;
}

function cleanString(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  return s === "" ? undefined : s;
}

function numericString(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val).trim().replace(",", ".");
  if (s === "") return "";
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : "";
}

function mapCriticality(val: unknown): Criticality | null {
  const s = cleanString(val);
  if (s === "A" || s === "B" || s === "C") return s;
  return null;
}

function mapOpRegime(val: unknown): string | undefined {
  const s = cleanString(val);
  if (!s) return undefined;
  const lower = s.toLowerCase();
  if (lower.includes("operando") || lower.includes("contínuo") || lower.includes("continuo"))
    return "Operando";
  if (lower.includes("parando") || lower.includes("intermitente"))
    return "Parando";
  if (lower.includes("parada") || lower.includes("parado"))
    return "Parada Geral";
  return s;
}

export interface ParseResult {
  models: ModelFormData[];
  warnings: string[];
}

/**
 * Lê um File (Blob) XLSX e devolve um array de ModelFormData.
 * Suporta tanto Equipment Model quanto Equipment — chamador é responsável por
 * preencher `tag`, `sectorId`, `costCenterId` no caso de Equipment.
 */
export async function parseXlsx(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const warnings: string[] = [];

  const parseSheet = (name: string): RawRow[] => {
    const sheet = workbook.Sheets[name];
    if (!sheet) {
      warnings.push(`Aba "${name}" não encontrada — ignorada.`);
      return [];
    }
    return XLSX.utils.sheet_to_json<RawRow>(sheet);
  };

  const rawModelos = parseSheet("Modelos");
  const rawEstrutura = parseSheet("Estrutura");
  const rawMateriais = parseSheet("Materiais");
  const rawServicos = parseSheet("Servicos");

  if (rawModelos.length === 0) {
    throw new Error(
      "Aba 'Modelos' vazia ou ausente. Baixe o template e preencha pelo menos uma linha."
    );
  }

  const models: ModelFormData[] = rawModelos.map((row, idx) => {
    const modelName = String(getValueFuzzy(row, "Nome (Texto") ?? "").trim();
    if (!modelName) {
      warnings.push(`Linha ${idx + 2} de "Modelos": sem nome — ignorada.`);
      // Retorna form vazio para preservar índice; consumidor filtra depois
      return emptyModelForm();
    }

    // ── Estrutura ──
    const hierRows = rawEstrutura.filter(
      (r) => String(getValueFuzzy(r, "Nome do Modelo") ?? "") === modelName
    );
    const matRows = rawMateriais.filter(
      (r) => String(getValueFuzzy(r, "Nome do Modelo") ?? "") === modelName
    );
    const servRows = rawServicos.filter(
      (r) => String(getValueFuzzy(r, "Nome do Modelo") ?? "") === modelName
    );

    const sets: ModelFormData["sets"] = [];
    const cipNameToTempId = new Map<string, string>();

    for (const r of hierRows) {
      const setName = cleanString(getValueFuzzy(r, "Set - Nome"));
      if (!setName) continue;
      let set = sets.find((s) => s.name === setName);
      if (!set) {
        set = {
          tempId: newTempId("set"),
          name: setName,
          code: String(sets.length + 1).padStart(2, "0"),
          position: String(sets.length + 1),
          setTypeId: extractId(getValueFuzzy(r, "Tipo de Conjunto")) ?? null,
          subSets: [],
        };
        sets.push(set);
      }
      const subName = cleanString(getValueFuzzy(r, "Subset - Nome"));
      if (!subName) continue;
      let sub = set.subSets.find((ss) => ss.name === subName);
      if (!sub) {
        sub = {
          tempId: newTempId("sub"),
          name: subName,
          code: String(set.subSets.length + 1).padStart(2, "0"),
          position: String(set.subSets.length + 1),
          subsetTypeId: extractId(getValueFuzzy(r, "Tipo de Subconjunto")) ?? null,
          cips: [],
        };
        set.subSets.push(sub);
      }
      const cipName = cleanString(getValueFuzzy(r, "Cip - Nome"));
      if (!cipName) continue;
      let cip = sub.cips.find((c) => c.name === cipName);
      if (!cip) {
        cip = {
          tempId: newTempId("cip"),
          name: cipName,
          code: String(sub.cips.length + 1).padStart(2, "0"),
          position: String(sub.cips.length + 1),
          cipTypeId: extractId(getValueFuzzy(r, "Tipo de CIP")) ?? null,
          services: [],
        };
        sub.cips.push(cip);
        // Atenção: se 2 CIPs em modelos diferentes tiverem mesmo nome, este
        // map global por modelo evita conflito porque é re-iniciado por iteração.
        cipNameToTempId.set(cipName, cip.tempId);
      }
    }

    // ── Servicos ──
    for (const r of servRows) {
      const serviceModelId = extractId(getValueFuzzy(r, "Service Model"));
      if (!serviceModelId) {
        warnings.push(
          `Modelo "${modelName}": serviço sem Service Model — ignorado.`
        );
        continue;
      }
      const cipName = cleanString(getValueFuzzy(r, "Cip - Nome"));
      const cipTempId = cipName ? cipNameToTempId.get(cipName) : undefined;
      if (cipName && !cipTempId) {
        warnings.push(
          `Modelo "${modelName}": serviço refere CIP "${cipName}" que não existe na Estrutura.`
        );
        continue;
      }
      // Encontrar o cip no sets[] para inserir o service
      let inserted = false;
      for (const s of sets) {
        for (const ss of s.subSets) {
          const c = ss.cips.find((c) => c.tempId === cipTempId);
          if (c) {
            c.services.push({
              tempId: newTempId("svc"),
              serviceModelId,
              periodId: extractId(getValueFuzzy(r, "Período")) ?? null,
              priorityId: extractId(getValueFuzzy(r, "Prioridade")) ?? null,
              teamId: extractId(getValueFuzzy(r, "Equipe")) ?? null,
              serviceConditionId:
                extractId(getValueFuzzy(r, "Condição Serviço")) ?? null,
              serviceProcedureId:
                extractId(getValueFuzzy(r, "Procedimento Serviço")) ?? null,
              serviceReasonId:
                extractId(getValueFuzzy(r, "Motivo Serviço")) ?? null,
              meterId: extractId(getValueFuzzy(r, "Medidor")) ?? null,
              jobSystemId:
                extractId(getValueFuzzy(r, "Sistema Trabalho")) ?? null,
              executionTimeId:
                extractId(getValueFuzzy(r, "Tempo Execução")) ?? null,
              toolkitId: extractId(getValueFuzzy(r, "Kit Ferramentas")) ?? null,
            });
            inserted = true;
            break;
          }
        }
        if (inserted) break;
      }
    }

    // ── Materiais ──
    const materials: ModelFormData["materials"] = matRows
      .map((r) => {
        const materialId = extractId(getValueFuzzy(r, "Material"));
        if (!materialId) return null;
        return {
          tempId: newTempId("mat"),
          materialId,
          volume: numericString(getValueFuzzy(r, "Volume")),
          unitId: extractId(getValueFuzzy(r, "Unidade")) ?? null,
          contaminationLevel: cleanString(
            getValueFuzzy(r, "Nível Contaminação")
          ),
          filterOilId: extractId(getValueFuzzy(r, "Filtro Óleo")) ?? null,
          filterPressureId:
            extractId(getValueFuzzy(r, "Filtro Pressão")) ?? null,
          filterSuctionId:
            extractId(getValueFuzzy(r, "Filtro Sucção")) ?? null,
          filterReturnId:
            extractId(getValueFuzzy(r, "Filtro Retorno")) ?? null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // ── Build form ──
    return {
      ...emptyModelForm(),
      name: modelName,
      equipmentTypeId:
        extractId(getValueFuzzy(row, "Tipo de Equipamento")) ?? null,
      manufacturerId: extractId(getValueFuzzy(row, "Fabricante")) ?? null,
      model: cleanString(getValueFuzzy(row, "Modelo")) ?? "",
      year: cleanString(getValueFuzzy(row, "Ano")) ?? "",
      description: cleanString(getValueFuzzy(row, "Descrição")) ?? "",
      power: numericString(getValueFuzzy(row, "Potência")),
      powerUnitId: extractId(getValueFuzzy(row, "Unidade de Potência")) ?? null,
      mainComponentId:
        extractId(getValueFuzzy(row, "Componente Principal")) ?? null,
      lubricationSystemId:
        extractId(getValueFuzzy(row, "Sistema de Lubrificação")) ?? null,
      operationTemperature: numericString(getValueFuzzy(row, "Temp. Operação")),
      RPM: numericString(getValueFuzzy(row, "RPM")),
      demulsibilityRequired: numericString(
        getValueFuzzy(row, "Demulsibilidade")
      ),
      ftirRequired: numericString(getValueFuzzy(row, "FTIR")),
      oxidationRequired: numericString(getValueFuzzy(row, "Oxidação")),
      externalDiameter: numericString(getValueFuzzy(row, "Diâmetro Externo")),
      innerDiameter: numericString(getValueFuzzy(row, "Diâmetro Interno")),
      bearingWidth: numericString(getValueFuzzy(row, "Largura Rolamento")),
      initialRotation: numericString(getValueFuzzy(row, "Rotação Inicial")),
      finalRotation: numericString(getValueFuzzy(row, "Rotação Final")),
      DN: numericString(getValueFuzzy(row, "DN")),
      varnishPotentialRequired: cleanString(getValueFuzzy(row, "Pot. Verniz")),
      varnishPotentialLevel: cleanString(getValueFuzzy(row, "Nível Pot. Verniz")),
      pqiRequired: cleanString(getValueFuzzy(row, "PQI")),
      rpvotRequired: numericString(getValueFuzzy(row, "RPVOT")),
      particleCountRequired: cleanString(getValueFuzzy(row, "Partículas")),
      iso4406Required: cleanString(getValueFuzzy(row, "ISO4406")),
      phLevel: numericString(getValueFuzzy(row, "pH")),
      alkalinity: numericString(getValueFuzzy(row, "Alcalinidade")),
      trampOilPercentage: numericString(getValueFuzzy(row, "Tramp Oil")),
      tanRequired: numericString(getValueFuzzy(row, "TAN")),
      tbnRequired: numericString(getValueFuzzy(row, "TBN")),
      clayContentRequired: numericString(getValueFuzzy(row, "Conteúdo Argila")),
      physicalPosition: cleanString(getValueFuzzy(row, "Posição Física")),
      criticality: mapCriticality(getValueFuzzy(row, "Criticidade")),
      operationRegime: mapOpRegime(getValueFuzzy(row, "Regime Operação")),
      safetyConditionId:
        extractId(getValueFuzzy(row, "Condições Segurança")) ?? null,
      materials,
      sets,
    };
  });

  return {
    models: models.filter((m) => m.name.trim() !== ""),
    warnings,
  };
}
