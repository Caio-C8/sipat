import type { Metadata } from "next";
import { headers } from "next/headers";
import { ListarPatrimoniosQuerySchema } from "@repo/contracts";
import { PatrimonioLista } from "@/features/patrimonios/components/patrimonio-lista";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverCadastros } from "@/features/cadastros/api/server";
import type { OpcaoFiltroPatrimonio } from "@/features/patrimonios/components/patrimonio-filtros";
import { PageHeader } from "@/components/shared/page-header";

function opcoesUnicas(
  itens: readonly { id: string; nome: string }[],
): OpcaoFiltroPatrimonio[] {
  return Array.from(
    new Map(
      itens.map((item) => [item.id, { value: item.id, label: item.nome }]),
    ).values(),
  );
}

export const metadata: Metadata = {
  title: "Consultar patrimônio",
  description: "Consulta integrada de patrimônios do SIPAT.",
};

export default async function PatrimoniosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await exigirIdentidadeAtual();
  const recebidos = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(recebidos).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const query = ListarPatrimoniosQuerySchema.safeParse(valores);
  if (!query.success)
    return (
      <main className="grid gap-5 p-7">
        <PageHeader
          title="Consultar patrimônio"
          description="Pesquise os bens e consulte sua situação atual."
        />
        <p role="alert" className="mt-4 text-red-800">
          Filtros inválidos. Revise os valores informados.
        </p>
      </main>
    );
  const cookie = (await headers()).get("cookie") ?? "";
  let resposta;
  let falha: unknown;
  try {
    resposta = await serverPatrimonioOperations.listar(valores, { cookie });
  } catch (erro) {
    falha = erro;
  }
  if (!resposta) {
    const mensagem = isApiError(falha)
      ? falha.message
      : "Não foi possível consultar os patrimônios. Tente novamente.";
    return (
      <main className="grid gap-5 p-7">
        <PageHeader
          title="Consultar patrimônio"
          description="Pesquise os bens e consulte sua situação atual."
        />
        <p role="alert" className="mt-4 text-red-800">
          {mensagem}
        </p>
      </main>
    );
  }
  const consultasOpcoes = await Promise.allSettled([
    serverCadastros.setores.listar({ pagina: "1", limite: "50" }, { cookie }),
    serverCadastros.especies.listar({ pagina: "1", limite: "50" }, { cookie }),
    serverCadastros.naturezas.listar({ pagina: "1", limite: "50" }, { cookie }),
    valores.setorId
      ? serverCadastros.setores.consultar(valores.setorId, { cookie })
      : Promise.resolve(null),
    valores.especieId
      ? serverCadastros.especies.consultar(valores.especieId, { cookie })
      : Promise.resolve(null),
    valores.naturezaId
      ? serverCadastros.naturezas.consultar(valores.naturezaId, { cookie })
      : Promise.resolve(null),
  ]);
  const dadosLista = <T,>(indice: number): T[] =>
    consultasOpcoes[indice]?.status === "fulfilled"
      ? ((consultasOpcoes[indice].value as unknown as { dados: T[] }).dados ??
        [])
      : [];
  const dadoSelecionado = <T,>(indice: number): T[] =>
    consultasOpcoes[indice]?.status === "fulfilled" &&
    consultasOpcoes[indice].value
      ? [(consultasOpcoes[indice].value as unknown as { dados: T }).dados]
      : [];
  return (
    <PatrimonioLista
      resposta={resposta}
      valores={valores}
      podeCadastrar={identidade.perfil === "DIRETOR_PATRIMONIO"}
      setores={opcoesUnicas([
        ...dadosLista<{ id: string; nome: string }>(0),
        ...dadoSelecionado<{ id: string; nome: string }>(3),
      ])}
      especies={opcoesUnicas([
        ...dadosLista<{ id: string; nome: string }>(1),
        ...dadoSelecionado<{ id: string; nome: string }>(4),
      ])}
      naturezas={opcoesUnicas([
        ...dadosLista<{ id: string; nome: string }>(2),
        ...dadoSelecionado<{ id: string; nome: string }>(5),
      ])}
    />
  );
}
