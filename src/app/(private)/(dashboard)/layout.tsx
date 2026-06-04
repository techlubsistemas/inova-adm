import { ModuleRouteGuard } from "@/components/auth/ModuleRouteGuard";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TechLub ADM | Dashboard",
  description: "Visão Geral",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <main className="relative flex-1 overflow-y-auto p-6 lg:p-8">
          <TopBar />
          <div className="mx-auto w-full max-w-7xl pt-16">
            <ModuleRouteGuard>{children}</ModuleRouteGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
