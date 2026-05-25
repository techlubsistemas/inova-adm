"use client";

/**
 * useApiMutation — hook utilitário para chamadas de mutação (POST/PUT/PATCH/DELETE).
 *
 * Encapsula o padrão repetido em todas as telas de cadastro:
 *   1. Setar loading
 *   2. Chamar API
 *   3. toast.success ou toast.error
 *   4. Callback onSuccess (geralmente um refetch da lista)
 *
 * Uso:
 *   const { submit, loading } = useApiMutation({
 *     url: "/workers",
 *     method: "POST",
 *     successMessage: "Colaborador criado.",
 *     onSuccess: () => { fetchWorkers(); closeDialog(); },
 *   });
 *
 *   const onSubmit = handleSubmit((data) => submit(data));
 */

import { useApiContext } from "@/context/ApiContext";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";

type Method = "POST" | "PUT" | "PATCH" | "DELETE";

interface UseApiMutationOptions {
  url: string | ((data: unknown) => string);
  method: Method;
  /** Exige token (default: true). */
  auth?: boolean;
  /** Mensagem de sucesso (omita para silenciar). */
  successMessage?: string;
  /** Mensagem de erro padrão se a API não retornar `body.message`. */
  defaultErrorMessage?: string;
  /** Callback após sucesso. Recebe o body da resposta. */
  onSuccess?: (body: unknown, requestData: unknown) => void | Promise<void>;
  /** Callback após erro. */
  onError?: (status: number, body: unknown) => void;
}

interface UseApiMutationResult {
  submit: (data?: unknown) => Promise<boolean>;
  loading: boolean;
}

export function useApiMutation(options: UseApiMutationOptions): UseApiMutationResult {
  const { PostAPI, PutAPI, PatchAPI, DeleteAPI } = useApiContext();
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (data?: unknown): Promise<boolean> => {
      const url =
        typeof options.url === "function" ? options.url(data) : options.url;
      const auth = options.auth ?? true;
      setLoading(true);

      let res: { status: number; body: unknown };
      switch (options.method) {
        case "POST":
          res = await PostAPI(url, data, auth);
          break;
        case "PUT":
          res = await PutAPI(url, data, auth);
          break;
        case "PATCH":
          res = await PatchAPI(url, data, auth);
          break;
        case "DELETE":
          res = await DeleteAPI(url, auth);
          break;
      }
      setLoading(false);

      const ok = res.status === 200 || res.status === 201;
      if (ok) {
        if (options.successMessage) toast.success(options.successMessage);
        await options.onSuccess?.(res.body, data);
        return true;
      } else {
        const msg =
          (typeof res.body === "object" &&
            res.body !== null &&
            "message" in res.body &&
            typeof (res.body as { message: unknown }).message === "string"
            ? (res.body as { message: string }).message
            : null) ??
          options.defaultErrorMessage ??
          "Ocorreu um erro. Tente novamente.";
        toast.error(msg);
        options.onError?.(res.status, res.body);
        return false;
      }
    },
    [
      PostAPI,
      PutAPI,
      PatchAPI,
      DeleteAPI,
      options,
    ]
  );

  return { submit, loading };
}
