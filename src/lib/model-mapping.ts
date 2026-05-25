/**
 * Conversão bidirecional entre o form de Equipment Model e o payload da API.
 *
 * - `mapFormToApiPayload`: form (strings) → payload (numbers, undefined limpos, services achatados)
 * - `mapApiToFormData`: response da API → form (strings, services dentro dos cips)
 */

import { parseNum } from "@/lib/cadastro-helpers";
import type {
  CipFormItem,
  MaterialFormItem,
  ModelFormData,
  ServiceFormItem,
  SetFormItem,
  SubsetFormItem,
} from "@/lib/model-form-types";

// ─────────────────────────────────────────────────────────────────────────────
// Form vazio (defaults)
// ─────────────────────────────────────────────────────────────────────────────

export function emptyModelForm(): ModelFormData {
  return {
    name: "",
    description: "",
    equipmentTypeId: null,
    manufacturerId: null,
    model: "",
    year: "",
    power: "",
    powerUnitId: null,
    mainComponentId: null,
    lubricationSystemId: null,
    operationTemperature: "",
    RPM: "",
    ftirRequired: "",
    oxidationRequired: "",
    demulsibilityRequired: "",
    innerDiameter: "",
    externalDiameter: "",
    bearingWidth: "",
    initialRotation: "",
    finalRotation: "",
    DN: "",
    varnishPotentialRequired: "",
    varnishPotentialLevel: "",
    pqiRequired: "",
    rpvotRequired: "",
    particleCountRequired: "",
    iso4406Required: "",
    tanRequired: "",
    tbnRequired: "",
    clayContentRequired: "",
    concentrationPercentage: "",
    phLevel: "",
    alkalinity: "",
    trampOilPercentage: "",
    contaminationLevel: "",
    physicalPosition: "",
    criticality: null,
    operationRegime: "",
    safetyConditionId: null,
    position: "",
    materials: [],
    sets: [],
    photos: [],
    tag: "",
    sectorId: null,
    costCenterId: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers para tempIds
// ─────────────────────────────────────────────────────────────────────────────

let _tempIdCounter = 0;
export function newTempId(prefix = "tmp"): string {
  _tempIdCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${_tempIdCounter}`;
}

export function emptyServiceItem(): ServiceFormItem {
  return {
    tempId: newTempId("svc"),
    serviceModelId: "",
  };
}

export function emptyCipItem(position = "1", code = "01"): CipFormItem {
  return {
    tempId: newTempId("cip"),
    name: "",
    code,
    position,
    services: [],
  };
}

export function emptySubsetItem(position = "1", code = "01"): SubsetFormItem {
  return {
    tempId: newTempId("sub"),
    name: "",
    code,
    position,
    cips: [],
  };
}

export function emptySetItem(position = "1", code = "01"): SetFormItem {
  return {
    tempId: newTempId("set"),
    name: "",
    code,
    position,
    subSets: [],
  };
}

export function emptyMaterialItem(): MaterialFormItem {
  return { tempId: newTempId("mat"), materialId: "" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Form → API payload
// ─────────────────────────────────────────────────────────────────────────────

interface ApiServicePayload {
  id?: string;
  cipModelId?: string;
  serviceModelId: string;
  periodId?: string;
  priorityId?: string;
  teamId?: string;
  serviceConditionId?: string;
  serviceProcedureId?: string;
  serviceReasonId?: string;
  meterId?: string;
  jobSystemId?: string;
  executionTimeId?: string;
  toolkitId?: string;
}

interface ApiCipPayload {
  id?: string;
  name: string;
  code: string;
  position: string;
  cipTypeId?: string;
}

interface ApiSubsetPayload {
  id?: string;
  name: string;
  code: string;
  position: string;
  subsetTypeId?: string;
  cips: ApiCipPayload[];
}

interface ApiSetPayload {
  id?: string;
  name: string;
  code: string;
  position: string;
  setTypeId?: string;
  subSets: ApiSubsetPayload[];
}

interface ApiMaterialPayload {
  materialId: string;
  volume?: number;
  unitId?: string;
  contaminationLevel?: string;
  filterOilId?: string;
  filterPressureId?: string;
  filterSuctionId?: string;
  filterReturnId?: string;
}

export interface ApiEquipmentPayload extends ApiModelPayload {
  tag: string;
  sectorId: string;
  costCenterId?: string;
  companyId?: string;
}

export interface ApiModelPayload {
  name: string;
  description?: string;
  equipmentTypeId: string;
  manufacturerId?: string;
  model?: string;
  year?: string;
  power?: number;
  powerUnitId?: string;
  mainComponentId?: string;
  lubricationSystemId?: string;
  operationTemperature?: number;
  RPM?: number;
  innerDiameter?: number;
  externalDiameter?: number;
  bearingWidth?: number;
  initialRotation?: number;
  finalRotation?: number;
  DN?: number;
  ftirRequired?: number;
  oxidationRequired?: number;
  demulsibilityRequired?: number;
  varnishPotentialRequired?: string;
  varnishPotentialLevel?: string;
  pqiRequired?: string;
  rpvotRequired?: number;
  particleCountRequired?: string;
  iso4406Required?: string;
  tanRequired?: number;
  tbnRequired?: number;
  clayContentRequired?: number;
  concentrationPercentage?: number;
  phLevel?: number;
  alkalinity?: number;
  trampOilPercentage?: number;
  contaminationLevel?: string;
  physicalPosition?: string;
  criticality?: "A" | "B" | "C";
  operationRegime?: string;
  safetyConditionId?: string;
  position?: string;
  photos: { url: string; fullUrl: string }[];
  sets?: { sets: ApiSetPayload[] };
  materials?: ApiMaterialPayload[];
  services?: ApiServicePayload[];
}

function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

export function mapFormToApiPayload(form: ModelFormData): ApiModelPayload {
  // Achatar services e ligar via cipModelId (id real ou tempId — backend recebe tempId em creates)
  const flatServices: ApiServicePayload[] = [];
  const apiSets: ApiSetPayload[] = form.sets.map((s) => ({
    ...(s.id ? { id: s.id } : {}),
    name: s.name,
    code: s.code,
    position: s.position,
    ...(s.setTypeId ? { setTypeId: s.setTypeId } : {}),
    subSets: s.subSets.map((ss) => ({
      ...(ss.id ? { id: ss.id } : {}),
      name: ss.name,
      code: ss.code,
      position: ss.position,
      ...(ss.subsetTypeId ? { subsetTypeId: ss.subsetTypeId } : {}),
      cips: ss.cips.map((c) => {
        // Coletar services desse cip pra lista achatada
        for (const svc of c.services) {
          if (!svc.serviceModelId) continue; // filtra services incompletos
          flatServices.push(
            omitEmpty({
              ...(svc.id ? { id: svc.id } : {}),
              cipModelId: c.id ?? c.tempId,
              serviceModelId: svc.serviceModelId,
              periodId: svc.periodId ?? undefined,
              priorityId: svc.priorityId ?? undefined,
              teamId: svc.teamId ?? undefined,
              serviceConditionId: svc.serviceConditionId ?? undefined,
              serviceProcedureId: svc.serviceProcedureId ?? undefined,
              serviceReasonId: svc.serviceReasonId ?? undefined,
              meterId: svc.meterId ?? undefined,
              jobSystemId: svc.jobSystemId ?? undefined,
              executionTimeId: svc.executionTimeId ?? undefined,
              toolkitId: svc.toolkitId ?? undefined,
            }) as ApiServicePayload
          );
        }
        return {
          ...(c.id ? { id: c.id } : { id: c.tempId }), // tempId pra ligação com services no backend
          name: c.name,
          code: c.code,
          position: c.position,
          ...(c.cipTypeId ? { cipTypeId: c.cipTypeId } : {}),
        };
      }),
    })),
  }));

  const apiMaterials: ApiMaterialPayload[] = form.materials
    .filter((m) => m.materialId)
    .map((m) =>
      omitEmpty({
        materialId: m.materialId,
        volume: parseNum(m.volume),
        unitId: m.unitId ?? undefined,
        contaminationLevel: m.contaminationLevel ?? undefined,
        filterOilId: m.filterOilId ?? undefined,
        filterPressureId: m.filterPressureId ?? undefined,
        filterSuctionId: m.filterSuctionId ?? undefined,
        filterReturnId: m.filterReturnId ?? undefined,
      }) as ApiMaterialPayload
    );

  const payload: ApiModelPayload = {
    name: form.name.trim(),
    equipmentTypeId: form.equipmentTypeId ?? "",
    photos: form.photos.map((p) => ({ url: p.url, fullUrl: p.fullUrl })),
    sets: apiSets.length ? { sets: apiSets } : undefined,
    materials: apiMaterials.length ? apiMaterials : undefined,
    services: flatServices.length ? flatServices : undefined,
  };

  // Strings
  if (form.description?.trim()) payload.description = form.description.trim();
  if (form.manufacturerId) payload.manufacturerId = form.manufacturerId;
  if (form.model?.trim()) payload.model = form.model.trim();
  if (form.year?.trim()) payload.year = form.year.trim();
  if (form.powerUnitId) payload.powerUnitId = form.powerUnitId;
  if (form.mainComponentId) payload.mainComponentId = form.mainComponentId;
  if (form.lubricationSystemId)
    payload.lubricationSystemId = form.lubricationSystemId;
  if (form.varnishPotentialRequired?.trim())
    payload.varnishPotentialRequired = form.varnishPotentialRequired.trim();
  if (form.varnishPotentialLevel?.trim())
    payload.varnishPotentialLevel = form.varnishPotentialLevel.trim();
  if (form.pqiRequired?.trim()) payload.pqiRequired = form.pqiRequired.trim();
  if (form.particleCountRequired?.trim())
    payload.particleCountRequired = form.particleCountRequired.trim();
  if (form.iso4406Required?.trim())
    payload.iso4406Required = form.iso4406Required.trim();
  if (form.contaminationLevel?.trim())
    payload.contaminationLevel = form.contaminationLevel.trim();
  if (form.physicalPosition?.trim())
    payload.physicalPosition = form.physicalPosition.trim();
  if (form.criticality) payload.criticality = form.criticality;
  if (form.operationRegime?.trim())
    payload.operationRegime = form.operationRegime.trim();
  if (form.safetyConditionId)
    payload.safetyConditionId = form.safetyConditionId;
  if (form.position?.trim()) payload.position = form.position.trim();

  // Numbers (parseNum)
  const numFields: Array<[keyof ModelFormData, keyof ApiModelPayload]> = [
    ["power", "power"],
    ["operationTemperature", "operationTemperature"],
    ["RPM", "RPM"],
    ["innerDiameter", "innerDiameter"],
    ["externalDiameter", "externalDiameter"],
    ["bearingWidth", "bearingWidth"],
    ["initialRotation", "initialRotation"],
    ["finalRotation", "finalRotation"],
    ["DN", "DN"],
    ["ftirRequired", "ftirRequired"],
    ["oxidationRequired", "oxidationRequired"],
    ["demulsibilityRequired", "demulsibilityRequired"],
    ["rpvotRequired", "rpvotRequired"],
    ["tanRequired", "tanRequired"],
    ["tbnRequired", "tbnRequired"],
    ["clayContentRequired", "clayContentRequired"],
    ["concentrationPercentage", "concentrationPercentage"],
    ["phLevel", "phLevel"],
    ["alkalinity", "alkalinity"],
    ["trampOilPercentage", "trampOilPercentage"],
  ];
  for (const [fromKey, toKey] of numFields) {
    const v = parseNum(form[fromKey] as string | undefined);
    if (v !== undefined) {
      (payload as unknown as Record<string, unknown>)[toKey as string] = v;
    }
  }

  return payload;
}

/**
 * Variante para Equipment — adiciona `tag`, `sectorId` (obrigatórios) e
 * `costCenterId`/`companyId` (opcionais).
 */
export function mapFormToEquipmentPayload(
  form: ModelFormData,
  companyId?: string
): ApiEquipmentPayload {
  const base = mapFormToApiPayload(form);
  const equipment: ApiEquipmentPayload = {
    ...base,
    tag: (form.tag ?? "").trim(),
    sectorId: form.sectorId ?? "",
  };
  if (form.costCenterId) equipment.costCenterId = form.costCenterId;
  if (companyId) equipment.companyId = companyId;
  return equipment;
}

// ─────────────────────────────────────────────────────────────────────────────
// API response → Form
// ─────────────────────────────────────────────────────────────────────────────

interface ApiModelResponseItem {
  id: string;
  name?: string;
  description?: string;
  equipmentTypeId?: string;
  manufacturerId?: string;
  model?: string;
  year?: string;
  power?: number;
  powerUnitId?: string;
  mainComponentId?: string;
  lubricationSystemId?: string;
  operationTemperature?: number;
  RPM?: number;
  innerDiameter?: number;
  externalDiameter?: number;
  bearingWidth?: number;
  initialRotation?: number;
  finalRotation?: number;
  DN?: number;
  ftirRequired?: number;
  oxidationRequired?: number;
  demulsibilityRequired?: number;
  varnishPotentialRequired?: string;
  varnishPotentialLevel?: string;
  pqiRequired?: string;
  rpvotRequired?: number;
  particleCountRequired?: string;
  iso4406Required?: string;
  tanRequired?: number;
  tbnRequired?: number;
  clayContentRequired?: number;
  concentrationPercentage?: number;
  phLevel?: number;
  alkalinity?: number;
  trampOilPercentage?: number;
  contaminationLevel?: string;
  physicalPosition?: string;
  criticality?: "A" | "B" | "C";
  operationRegime?: string;
  safetyConditionId?: string;
  position?: string;
  /** Equipment-only */
  tag?: string;
  sectorId?: string;
  costCenterId?: string;
  photos?: Array<{ url: string; fullUrl?: string }>;
  materials?: Array<{
    id: string;
    materialId: string;
    volume?: number;
    unitId?: string;
    contaminationLevel?: string;
    filterOilId?: string;
    filterPressureId?: string;
    filterSuctionId?: string;
    filterReturnId?: string;
  }>;
  sets?: Array<{
    id: string;
    name: string;
    code: string;
    position: string;
    setTypeId?: string;
    subsets?: Array<{
      id: string;
      name: string;
      code: string;
      position: string;
      subsetTypeId?: string;
      cips?: Array<{
        id: string;
        name: string;
        code: string;
        position: string;
        cipTypeId?: string;
        cipModelServices?: Array<{
          id: string;
          serviceModelId: string;
          periodId?: string;
          priorityId?: string;
          teamId?: string;
          serviceConditionId?: string;
          serviceProcedureId?: string;
          serviceReasonId?: string;
          meterId?: string;
          jobSystemId?: string;
          executionTimeId?: string;
          toolkitId?: string;
        }>;
      }>;
    }>;
  }>;
}

function numToString(v: number | undefined | null): string {
  return v == null ? "" : String(v);
}

export function mapApiToFormData(api: ApiModelResponseItem): ModelFormData {
  return {
    name: api.name ?? "",
    description: api.description ?? "",
    equipmentTypeId: api.equipmentTypeId ?? null,
    manufacturerId: api.manufacturerId ?? null,
    model: api.model ?? "",
    year: api.year ?? "",
    power: numToString(api.power),
    powerUnitId: api.powerUnitId ?? null,
    mainComponentId: api.mainComponentId ?? null,
    lubricationSystemId: api.lubricationSystemId ?? null,
    operationTemperature: numToString(api.operationTemperature),
    RPM: numToString(api.RPM),
    ftirRequired: numToString(api.ftirRequired),
    oxidationRequired: numToString(api.oxidationRequired),
    demulsibilityRequired: numToString(api.demulsibilityRequired),
    innerDiameter: numToString(api.innerDiameter),
    externalDiameter: numToString(api.externalDiameter),
    bearingWidth: numToString(api.bearingWidth),
    initialRotation: numToString(api.initialRotation),
    finalRotation: numToString(api.finalRotation),
    DN: numToString(api.DN),
    varnishPotentialRequired: api.varnishPotentialRequired ?? "",
    varnishPotentialLevel: api.varnishPotentialLevel ?? "",
    pqiRequired: api.pqiRequired ?? "",
    rpvotRequired: numToString(api.rpvotRequired),
    particleCountRequired: api.particleCountRequired ?? "",
    iso4406Required: api.iso4406Required ?? "",
    tanRequired: numToString(api.tanRequired),
    tbnRequired: numToString(api.tbnRequired),
    clayContentRequired: numToString(api.clayContentRequired),
    concentrationPercentage: numToString(api.concentrationPercentage),
    phLevel: numToString(api.phLevel),
    alkalinity: numToString(api.alkalinity),
    trampOilPercentage: numToString(api.trampOilPercentage),
    contaminationLevel: api.contaminationLevel ?? "",
    physicalPosition: api.physicalPosition ?? "",
    criticality: api.criticality ?? null,
    operationRegime: api.operationRegime ?? "",
    safetyConditionId: api.safetyConditionId ?? null,
    position: api.position ?? "",
    tag: api.tag ?? "",
    sectorId: api.sectorId ?? null,
    costCenterId: api.costCenterId ?? null,
    photos:
      api.photos?.map((p) => ({
        url: p.url,
        fullUrl: p.fullUrl ?? p.url,
      })) ?? [],
    materials:
      api.materials?.map((m) => ({
        tempId: newTempId("mat"),
        materialId: m.materialId,
        volume: numToString(m.volume),
        unitId: m.unitId ?? null,
        contaminationLevel: m.contaminationLevel ?? "",
        filterOilId: m.filterOilId ?? null,
        filterPressureId: m.filterPressureId ?? null,
        filterSuctionId: m.filterSuctionId ?? null,
        filterReturnId: m.filterReturnId ?? null,
      })) ?? [],
    sets:
      api.sets?.map((s) => ({
        tempId: newTempId("set"),
        id: s.id,
        name: s.name,
        code: s.code,
        position: s.position,
        setTypeId: s.setTypeId ?? null,
        subSets:
          s.subsets?.map((ss) => ({
            tempId: newTempId("sub"),
            id: ss.id,
            name: ss.name,
            code: ss.code,
            position: ss.position,
            subsetTypeId: ss.subsetTypeId ?? null,
            cips:
              ss.cips?.map((c) => ({
                tempId: newTempId("cip"),
                id: c.id,
                name: c.name,
                code: c.code,
                position: c.position,
                cipTypeId: c.cipTypeId ?? null,
                services:
                  c.cipModelServices?.map((sv) => ({
                    tempId: newTempId("svc"),
                    id: sv.id,
                    serviceModelId: sv.serviceModelId,
                    periodId: sv.periodId ?? null,
                    priorityId: sv.priorityId ?? null,
                    teamId: sv.teamId ?? null,
                    serviceConditionId: sv.serviceConditionId ?? null,
                    serviceProcedureId: sv.serviceProcedureId ?? null,
                    serviceReasonId: sv.serviceReasonId ?? null,
                    meterId: sv.meterId ?? null,
                    jobSystemId: sv.jobSystemId ?? null,
                    executionTimeId: sv.executionTimeId ?? null,
                    toolkitId: sv.toolkitId ?? null,
                  })) ?? [],
              })) ?? [],
          })) ?? [],
      })) ?? [],
  };
}
