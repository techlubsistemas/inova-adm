"use client";

import { OrgEntityPage } from "@/components/cadastros/OrgEntityPage";

export default function AreasPage() {
  return (
    <OrgEntityPage
      entity="area"
      editIdField="areaId"
      pageDescription="Defina as áreas físicas da empresa. Cada área agrupa um ou mais setores."
    />
  );
}
