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

export async function uploadFile(
  file: File,
  token: string | null
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post<UploadedFile>(`${baseURL}/file`, formData, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "any",
    },
  });
  return res.data;
}
