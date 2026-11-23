import type { Metadata } from "next";
import { headers } from "next/headers";
import { queryRelatorio } from "@repo/contracts";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverRelatorios } from "@/features/relatorios/api/server";
import { BaixasLista } from "@/features/baixas/components/baixas-lista";
import { prepararFiltrosBaixas } from "@/features/baixas/filtros";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Baixa",
  description: "Consulta de baixas patrimoniais do SIPAT.",
};

export default async function BaixasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await exigirIdentidadeAtual();
  const cookie = (await headers()).get("cookie") ?? "";
  const recebidos = await searchParams;
  const valores = prepararFiltrosBaixas(recebidos);
  const query = queryRelatorio("baixas").safeParse(valores);
  if (!query.success)
    return (
      <main className="grid gap-5 p-7 text-[#19355d]">
        <PageHeader
          title="Baixa"
          description="Consulte as baixas patrimoniais registradas."
        />
        <p role="alert" className="mt-4 text-red-800">
          Filtros inválidos. Revise datas, seleções e paginação.
        </p>
      </main>
    );
  let resposta;
  let falha: unknown;
  try {
    resposta = await serverRelatorios.listar.baixas(valores, {
      cookie,
    });
  } catch (erro) {
    falha = erro;
  }
  if (!resposta) {
    return (
      <main className="grid gap-5 p-7 text-[#19355d]">
        <PageHeader
          title="Baixa"
          description="Consulte as baixas patrimoniais registradas."
        />
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
