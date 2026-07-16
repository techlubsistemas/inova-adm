/**
 * Helper para upload de arquivos via `POST /file` (multipart).
 * Retorna `{ url, fullUrl }` da API.
 */

import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export interface UploadedFile {
  url: string;
  fullUrl: string;
}

interface PresignedUpload extends UploadedFile {
  uploadUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
}

const LEGACY_UPLOAD_LIMIT = 200 * 1024 * 1024;

export async function uploadFile(
  file: File,
  token: string | null,
  onProgress?: (progress: number) => void
): Promise<UploadedFile> {
  if (!token) throw new Error("Faça login novamente antes de enviar o arquivo.");

  onProgress?.(0);
  try {
    const presigned = await axios.post<PresignedUpload>(
      `${baseURL}/file/presign`,
      {
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "any",
        },
      },
    );

    await axios.put(presigned.data.uploadUrl, file, {
      headers: presigned.data.headers,
      onUploadProgress: (event) => {
        const total = event.total ?? file.size;
        if (total > 0) {
          onProgress?.(Math.min(99, Math.round((event.loaded / total) * 100)));
        }
      },
    });
    onProgress?.(100);
    return { url: presigned.data.url, fullUrl: presigned.data.fullUrl };
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const canFallback = status === 404 || status === undefined;
    if (!canFallback || file.size > LEGACY_UPLOAD_LIMIT) {
      const apiMessage = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      throw new Error(
        apiMessage ??
          (file.size > LEGACY_UPLOAD_LIMIT
            ? "O upload direto falhou. Verifique o CORS do bucket R2 antes de enviar arquivos acima de 200 MB."
            : "Não foi possível preparar o upload do arquivo."),
      );
    }
  }

  // Compatibilidade com ambientes ainda sem CORS de PUT configurado no R2.
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post<UploadedFile>(`${baseURL}/file`, formData, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "any",
    },
    onUploadProgress: (event) => {
      const total = event.total ?? file.size;
      if (total > 0) onProgress?.(Math.round((event.loaded / total) * 100));
    },
  });
  onProgress?.(100);
  return res.data;
}
