"use client";

import { OrgEntityPage } from "@/components/cadastros/OrgEntityPage";

export default function SetoresPage() {
  return (
    <OrgEntityPage
      entity="sector"
      editIdField="sectorId"
      parent={{ entity: "area", payloadKey: "areaId", label: "Área" }}
      pageDescription="Defina os setores dentro de cada área. Cada setor agrupa equipamentos."
    />
  );
}
