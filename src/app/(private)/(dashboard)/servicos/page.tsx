"use client";

import { ServicesPageShell } from "@/components/services/ServicesPageShell";

export default function ServicosPage() {
  return (
    <ServicesPageShell
      lookupKey="service"
      endpointBase="/service"
      deleteParam="services"
      listKey="services"
      pageTitle="Serviços"
      pageDescription="Catálogo de serviços executados pela empresa."
      entityLabel="Serviço"
      companyScoped={true}
    />
  );
}
