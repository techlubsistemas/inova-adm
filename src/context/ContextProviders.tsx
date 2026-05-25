"use client";

import { Toaster } from "react-hot-toast";
import { ApiContextProvider } from "./ApiContext";
import { AuthProvider } from "./AuthContext";
import { CompanyProvider } from "./CompanyContext";
import { LookupProvider } from "./LookupContext";

export function ContextProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthProvider>
        <ApiContextProvider>
          <CompanyProvider>
            <LookupProvider>{children}</LookupProvider>
          </CompanyProvider>
        </ApiContextProvider>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
          },
          success: {
            iconTheme: { primary: "#22c55e", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />
    </>
  );
}
