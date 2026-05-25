/**
 * Tipos do formulário de Equipment Model.
 *
 * Estrutura espelha o mobile (`@types/equipmentStructure.ts`), mas usa `string`
 * para campos numéricos no form (convertidos via `parseNum` no submit).
 *
 * Services ficam **aninhados dentro dos cips** no form para UX,
 * mas vão **achatados** no payload da API (com `cipModelId` apontando ao cip).
 */

export type Criticality = "A" | "B" | "C";

export interface ServiceFormItem {
  tempId: string;
  /** ID real (preenchido em edit; undefined em items recém-criados) */
  id?: string;
  serviceModelId: string;
  periodId?: string | null;
  priorityId?: string | null;
  teamId?: string | null;
  serviceConditionId?: string | null;
  serviceProcedureId?: string | null;
  serviceReasonId?: string | null;
  meterId?: string | null;
  jobSystemId?: string | null;
  executionTimeId?: string | null;
  toolkitId?: string | null;
  // NOTA: extraTeamId e estimatedExtraTeamTimeId foram removidos —
  // não são mais usados em nenhum form no mobile (apenas em plumbing/adapters).
  // Backend DTO ainda aceita estes campos mas o web não envia mais.
}

export interface CipFormItem {
  tempId: string;
  id?: string;
  name: string;
  code: string;
  position: string;
  cipTypeId?: string | null;
  services: ServiceFormItem[];
}

export interface SubsetFormItem {
  tempId: string;
  id?: string;
  name: string;
  code: string;
  position: string;
  subsetTypeId?: string | null;
  cips: CipFormItem[];
}

export interface SetFormItem {
  tempId: string;
  id?: string;
  name: string;
  code: string;
  position: string;
  setTypeId?: string | null;
  subSets: SubsetFormItem[];
}

export interface MaterialFormItem {
  tempId: string;
  materialId: string;
  volume?: string;
  unitId?: string | null;
  contaminationLevel?: string;
  filterOilId?: string | null;
  filterPressureId?: string | null;
  filterSuctionId?: string | null;
  filterReturnId?: string | null;
}

export interface ModelFormData {
  // Identification
  name: string;
  description?: string;
  equipmentTypeId: string | null;
  manufacturerId?: string | null;
  model?: string;
  year?: string;

  // Specifications
  power?: string;
  powerUnitId?: string | null;
  mainComponentId?: string | null;
  lubricationSystemId?: string | null;
  operationTemperature?: string;
  RPM?: string;
  ftirRequired?: string;
  oxidationRequired?: string;
  demulsibilityRequired?: string;

  // Dynamics
  innerDiameter?: string;
  externalDiameter?: string;
  bearingWidth?: string;
  initialRotation?: string;
  finalRotation?: string;
  DN?: string;

  // Fluids
  varnishPotentialRequired?: string;
  varnishPotentialLevel?: string;
  pqiRequired?: string;
  rpvotRequired?: string;
  particleCountRequired?: string;
  iso4406Required?: string;
  tanRequired?: string;
  tbnRequired?: string;
  clayContentRequired?: string;
  concentrationPercentage?: string;
  phLevel?: string;
  alkalinity?: string;
  trampOilPercentage?: string;
  contaminationLevel?: string;

  // Location
  physicalPosition?: string;
  criticality?: Criticality | null;
  operationRegime?: string;
  safetyConditionId?: string | null;
  position?: string;

  // Equipment-only (ignorado em Equipment Model)
  tag?: string;
  sectorId?: string | null;
  costCenterId?: string | null;

  // Products
  materials: MaterialFormItem[];

  // Structure (services aninhados nos cips para UX)
  sets: SetFormItem[];

  // Photos (URLs já uploadadas via /file)
  photos: { url: string; fullUrl: string }[];
}
