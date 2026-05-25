"use client";

import { OrgEntityPage } from "@/components/cadastros/OrgEntityPage";

export default function SetoresModeloPage() {
  return (
    <OrgEntityPage
      entity="sector-model"
      editIdField="sectorModelId"
      parent={{
        entity: "area-model",
        payloadKey: "areaId",
        label: "Modelo de Área",
      }}
      pageTitle="Modelos de Setor"
      pageDescription="Templates globais de setor associados a modelos de área."
    />
  );
}
