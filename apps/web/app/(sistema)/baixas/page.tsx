import type { Metadata } from "next";
import { headers } from "next/headers";
import { queryRelatorio } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverRelatorios } from "@/features/relatorios/api/server";
import { BaixasLista } from "@/features/baixas/components/baixas-lista";
import { prepararFiltrosBaixas } from "@/features/baixas/filtros";

export const metadata: Metadata = {
  title: "Baixa",
  description: "Consulta de baixas patrimoniais do SIPAT.",
};

export default async function BaixasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const recebidos = await searchParams;
  const valores = prepararFiltrosBaixas(recebidos);
  const query = queryRelatorio("baixas").safeParse(valores);
  if (!query.success)
    return (
      <main className="p-7 text-[#19355d]">
        <h1 className="text-2xl font-bold">Baixa</h1>
        <p role="alert" className="mt-4 text-red-800">
          Filtros inválidos. Revise datas, seleções e paginação.
        </p>
      </main>
    );
  let resposta;
  let falha: unknown;
  try {
    resposta = await serverRelatorios.listar.baixas(valores, {
      cookie: (await headers()).get("cookie") ?? "",
    });
  } catch (erro) {
    falha = erro;
  }
  if (!resposta) {
    return (
      <main className="p-7 text-[#19355d]">
        <h1 className="text-2xl font-bold">Baixa</h1>
        <p role="alert" className="mt-4 text-red-800">
          {isApiError(falha)
            ? falha.message
            : "Não foi possível consultar as baixas. Tente novamente."}
        </p>
      </main>
    );
  }
  return (
    <BaixasLista
      resposta={resposta}
      valores={valores}
      diretor={identidade.perfil === "DIRETOR_PATRIMONIO"}
    />
  );
}
