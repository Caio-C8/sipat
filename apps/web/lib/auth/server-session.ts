import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { isApiError } from "@/lib/api/core/api-error";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesAuth } from "./auth-operations";

const serverAuth = criarOperacoesAuth(serverApiClient);

export const obterIdentidadeAtual = cache(
  async function obterIdentidadeAtual(): Promise<IdentidadeAutenticada | null> {
    const cookie = (await headers()).get("cookie");

    if (!cookie) {
      return null;
    }

    try {
      return await serverAuth.consultarIdentidade(cookie);
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        return null;
      }

      throw error;
    }
  },
);
