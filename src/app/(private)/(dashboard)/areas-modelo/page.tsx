"use client";

import { OrgEntityPage } from "@/components/cadastros/OrgEntityPage";

export default function AreasModeloPage() {
  return (
    <OrgEntityPage
      entity="area-model"
      editIdField="areaModelId"
      pageTitle="Modelos de Área"
      pageDescription="Templates globais reutilizáveis ao criar áreas em novas empresas."
    />
  );
}
