"use client";

/**
 * PhotoUpload — upload e gerenciamento de múltiplas fotos.
 *
 * - Click no botão abre file picker (múltiplo)
 * - Cada arquivo é enviado individualmente via `uploadFile` (POST /file)
 * - Thumbnails clicáveis pra remover
 * - Aceita até `maxPhotos` (default 10)
 *
 * Estado é controlado: pai gerencia `value: PhotoItem[]` e recebe `onChange`.
 */

import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/upload";
import { Loader2, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

export interface PhotoItem {
  url: string;
  fullUrl: string;
}

interface PhotoUploadProps {
  value: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export function PhotoUpload({
  value,
  onChange,
  maxPhotos = 10,
  disabled,
}: PhotoUploadProps) {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const remaining = maxPhotos - value.length;

  const handlePick = () => {
    if (disabled || remaining <= 0) return;
    inputRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    const uploaded: PhotoItem[] = [];
    for (const file of toUpload) {
      try {
        const res = await uploadFile(file, token);
        uploaded.push(res);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro ao enviar arquivo.";
        toast.error(`Falha em "${file.name}": ${msg}`);
      }
    }
    setUploading(false);
    if (uploaded.length > 0) {
      onChange([...value, ...uploaded]);
      toast.success(
        uploaded.length === 1
          ? "Foto enviada."
          : `${uploaded.length} fotos enviadas.`
      );
    }
    // Reset input pra permitir selecionar mesmo arquivo de novo
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((photo, i) => (
          <div
            key={photo.url + i}
            className="group relative h-24 w-24 overflow-hidden rounded-md border border-slate-200 bg-slate-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.fullUrl}
              alt={`Foto ${i + 1}`}
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                aria-label="Remover foto"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={handlePick}
            disabled={disabled || uploading}
            className="hover:border-primary/40 hover:bg-primary/5 flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-slate-300 text-slate-500 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="text-[10px] font-medium">Adicionar</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <p className="mt-2 text-xs text-slate-500">
        {value.length} de {maxPhotos} fotos
        {value.length >= maxPhotos && " (limite atingido)"}
      </p>
    </div>
  );
}
