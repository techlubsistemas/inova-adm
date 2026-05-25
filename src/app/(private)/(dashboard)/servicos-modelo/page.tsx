"use client";

import { ServicesPageShell } from "@/components/services/ServicesPageShell";

export default function ServicosModeloPage() {
  return (
    <ServicesPageShell
      lookupKey="service-model"
      endpointBase="/service-model"
      deleteParam="services"
      listKey="serviceModels"
      pageTitle="Modelos de Serviço"
      pageDescription="Templates globais de serviço utilizados em modelos de equipamento."
      entityLabel="Modelo de Serviço"
      companyScoped={false}
      showPeriodToggle
    />
  );
}
