"use client";

/**
 * XlsxImportButton — botão duplo (Baixar Template + Importar Planilha).
 *
 * - "Baixar Template" faz GET do endpoint de template (binário XLSX) e oferece
 *   download direto no browser.
 * - "Importar Planilha" abre file picker, parseia via `parseXlsx`, mapeia para
 *   o payload da API e faz POST `/multi`. Mostra resumo em toast.
 *
 * Funciona pra Equipment Model (entityKind="model") e Equipment
 * (entityKind="equipment", precisa `companyId`).
 */

import { useAuth } from "@/context/AuthContext";
import { useCompany } from "@/context/CompanyContext";
import {
  mapFormToApiPayload,
  mapFormToEquipmentPayload,
} from "@/lib/model-mapping";
import { parseXlsx } from "@/lib/xlsx-import";
import axios from "axios";
import { Download, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

interface XlsxImportButtonProps {
  /** "model" usa /equipment-model. "equipment" usa /equipment. */
  entityKind: "model" | "equipment";
  /** Callback após sucesso (refetch lista). */
  onImported?: () => void;
}

export function XlsxImportButton({
  entityKind,
  onImported,
}: XlsxImportButtonProps) {
  const { token } = useAuth();
  const { effectiveCompanyId, isSuperAdmin, selectedCompanyId } = useCompany();
  const inputRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);

  const endpointBase =
    entityKind === "model" ? "/equipment-model" : "/equipment";
  const fileName =
    entityKind === "model" ? "modelos_equipamento.xlsx" : "equipamentos.xlsx";

  const needsCompany =
    entityKind === "equipment" && isSuperAdmin && !selectedCompanyId;

  async function handleDownloadTemplate() {
    setDownloading(true);
    try {
      const res = await axios.get(`${baseURL}${endpointBase}/template`, {
        responseType: "blob",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "ngrok-skip-browser-warning": "any",
        },
      });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido.";
      toast.error(`Falha ao baixar template: ${msg}`);
    }
    setDownloading(false);
  }

  function handlePickFile() {
    if (importing || needsCompany) return;
    inputRef.current?.click();
  }

  async function handleFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (inputRef.current) inputRef.current.value = "";

    setImporting(true);
    let parsed;
    try {
      parsed = await parseXlsx(file);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Falha ao ler a planilha.";
      toast.error(msg);
      setImporting(false);
      return;
    }

    if (parsed.models.length === 0) {
      toast.error("Nenhum modelo válido encontrado na planilha.");
      setImporting(false);
      return;
    }

    parsed.warnings.forEach((w) => toast(w, { icon: "⚠️", duration: 5000 }));

    // Mapeia para payload da API
    if (entityKind === "model") {
      const payload = {
        equipmentModels: parsed.models.map((m) => mapFormToApiPayload(m)),
      };
      try {
        const res = await axios.post(
          `${baseURL}/equipment-model/multi`,
          payload,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "ngrok-skip-browser-warning": "any",
              "Content-Type": "application/json",
            },
          }
        );
        toast.success(
          `${parsed.models.length} modelo(s) importado(s).`
        );
        void res; // suppress unused
        onImported?.();
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ??
          (err instanceof Error ? err.message : "Erro desconhecido.");
        toast.error(`Falha na importação: ${msg}`);
      }
    } else {
      // Equipment — precisa companyId em cada item
      const payload = {
        companyId: effectiveCompanyId,
        equipments: parsed.models.map((m) => {
          const p = mapFormToEquipmentPayload(m, effectiveCompanyId ?? undefined);
          return p;
        }),
      };
      try {
        await axios.post(`${baseURL}/equipment/multi`, payload, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "ngrok-skip-browser-warning": "any",
            "Content-Type": "application/json",
          },
        });
        toast.success(`${parsed.models.length} equipamento(s) importado(s).`);
        onImported?.();
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ??
          (err instanceof Error ? err.message : "Erro desconhecido.");
        toast.error(`Falha na importação: ${msg}`);
      }
    }
    setImporting(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDownloadTemplate}
        disabled={downloading}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Baixar Template
      </button>
      <button
        type="button"
        onClick={handlePickFile}
        disabled={importing || needsCompany}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {importing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Importar Planilha
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => handleFile(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
