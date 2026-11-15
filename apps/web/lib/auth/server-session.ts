import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { isApiError } from "@/lib/api/core/api-error";
import { serverApiClient } from "@/lib/api/server-api-client";
import { criarOperacoesAuth } from "./auth-operations";

const serverAuth = criarOperacoesAuth(serverApiClient);

export type EstadoSessaoAtual =
  | Readonly<{ status: "ausente" }>
  | Readonly<{
      status: "autenticada";
      identidade: IdentidadeAutenticada;
    }>
  | Readonly<{ status: "indisponivel" }>;

export const obterEstadoSessaoAtual = cache(
  async function obterEstadoSessaoAtual(): Promise<EstadoSessaoAtual> {
    const cookie = (await headers()).get("cookie");

    if (!cookie) {
      return { status: "ausente" };
    }

    try {
      return {
        status: "autenticada",
        identidade: await serverAuth.consultarIdentidade(cookie),
      };
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 401) {
        return { status: "ausente" };
      }

      if (
        isApiError(error) &&
        (["rede", "timeout", "cancelada"].includes(error.categoria) ||
          (error.status !== null && error.status >= 500))
      ) {
        return { status: "indisponivel" };
      }

      throw error;
    }
  },
);

export const obterIdentidadeAtual = cache(
  async function obterIdentidadeAtual(): Promise<IdentidadeAutenticada | null> {
    const estado = await obterEstadoSessaoAtual();

    if (estado.status === "indisponivel") {
      redirect("/");
    }

    return estado.status === "autenticada" ? estado.identidade : null;
  },
);

export async function exigirIdentidadeAtual(): Promise<IdentidadeAutenticada> {
  const estado = await obterEstadoSessaoAtual();

  if (estado.status === "indisponivel") {
    redirect("/");
  }

  if (estado.status === "ausente") {
    redirect("/login");
  }

  return estado.identidade;
}
