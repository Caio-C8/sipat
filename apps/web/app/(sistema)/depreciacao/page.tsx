import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  CompetenciaMensalSchema,
  ListarDepreciacoesPendentesQuerySchema,
  type ComissaoOpcaoReavaliacao,
  type CompetenciaDepreciacao,
  type ListarDepreciacoesPendentesResponse,
} from "@repo/contracts";
import { ProcessamentoDepreciacoes } from "@/features/depreciacoes/components/processamento-depreciacoes";
import { serverDepreciacaoOperations } from "@/features/depreciacoes/api/server-depreciacao-operations";
import { serverReavaliacaoOperations } from "@/features/reavaliacoes/api/server-reavaliacao-operations";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";

export const metadata: Metadata = {
  title: "Depreciação",
  description:
    "Consulte e processe competências de depreciação patrimonial pendentes.",
};

function erroLeitura(erro: unknown, fallback: string) {
  if (isApiError(erro)) {
    if (erro.status === 401)
      return "Sua sessão expirou. Entre novamente para continuar.";
    if (erro.status === 403)
      return "Seu perfil não tem permissão para consultar depreciações.";
    return erro.message;
  }
  return fallback;
}

export default async function DepreciacaoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade || identidade.perfil !== "DIRETOR_PATRIMONIO") {
    redirect("/dashboard");
  }

  const recebidos = await searchParams;
  const competenciaRecebida =
    typeof recebidos.competencia === "string"
      ? recebidos.competencia
      : undefined;
  const pagina =
    typeof recebidos.pagina === "string" ? recebidos.pagina : undefined;
  const cookie = (await headers()).get("cookie") ?? "";

  let competencias: CompetenciaDepreciacao[];
  let competenciaAtual: string;
  let competenciaMaisAntigaPendente: string | null;
  try {
    const resposta = await serverDepreciacaoOperations.listarCompetencias({
      cookie,
    });
    competencias = resposta.dados.competencias;
    competenciaAtual = resposta.dados.competenciaAtual;
    competenciaMaisAntigaPendente =
      resposta.dados.competenciaMaisAntigaPendente;
  } catch (erro) {
    return (
      <main className="p-6 text-[#17253d]">
        <h1 className="text-2xl font-bold">Depreciação</h1>
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {erroLeitura(
            erro,
            "Não foi possível consultar as competências devidas.",
          )}
        </p>
      </main>
    );
  }

  if (competencias.length === 0) {
    return (
      <main className="mx-auto grid w-full max-w-[1900px] gap-5 p-6 text-[#17253d]">
        <h1 className="text-2xl font-bold">Depreciação</h1>
        <section
          role="status"
          className="rounded-lg border border-[#dfe7f1] bg-white p-8 text-center"
        >
          <h2 className="font-bold text-[#203b61]">
            Nenhuma competência pendente
          </h2>
          <p className="mt-2 text-sm text-[#7188a5]">
            Não há obrigação de depreciação a processar até {competenciaAtual}.
          </p>
        </section>
      </main>
    );
  }

  const competenciaPadrao =
    competenciaMaisAntigaPendente ??
    competencias.find((item) => item.competencia === competenciaAtual)
      ?.competencia ??
    competencias[0]!.competencia;
  if (!competenciaRecebida) {
    redirect(`/depreciacao?competencia=${competenciaPadrao}`);
  }
  const competenciaValidada =
    CompetenciaMensalSchema.safeParse(competenciaRecebida);
  const competenciaDisponivel = competenciaValidada.success
    ? competencias.some((item) => item.competencia === competenciaValidada.data)
    : false;
  if (!competenciaValidada.success || !competenciaDisponivel) {
    return (
      <main className="p-6 text-[#17253d]">
        <h1 className="text-2xl font-bold">Depreciação</h1>
        <p
          role="alert"
          className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          A competência informada não está disponível ou outra competência deve
          ser processada antes.
        </p>
        <a
          className="mt-4 inline-block underline"
          href={`/depreciacao?competencia=${competenciaPadrao}`}
        >
          Consultar a competência pendente mais antiga
        </a>
      </main>
    );
  }
  const competencia = competenciaValidada.data;
  const query = ListarDepreciacoesPendentesQuerySchema.safeParse({
    competencia,
    ...(pagina ? { pagina } : {}),
    limite: "20",
  });
  if (!query.success) {
    return (
      <main className="p-6 text-[#17253d]">
        <h1 className="text-2xl font-bold">Depreciação</h1>
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          A página informada é inválida. Volte para a primeira página da
          consulta.
        </p>
      </main>
    );
  }

  const [resultadoPendentes, resultadoComissoes] = await Promise.allSettled([
    serverDepreciacaoOperations.listarPendentes(
      { competencia, pagina, limite: "20" },
      { cookie },
    ),
    serverReavaliacaoOperations.comissoes(
      { contexto: "REGISTRO", limite: "50" },
      { cookie },
    ),
  ]);

  if (resultadoPendentes.status === "rejected") {
    return (
      <main className="p-6 text-[#17253d]">
        <h1 className="text-2xl font-bold">Depreciação</h1>
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {erroLeitura(
            resultadoPendentes.reason,
            "Não foi possível consultar os bens pendentes.",
          )}
        </p>
      </main>
    );
  }

  const resposta: ListarDepreciacoesPendentesResponse =
    resultadoPendentes.value;
  if (resposta.meta.pagina > resposta.meta.ultimaPagina) {
    redirect(`/depreciacao?competencia=${competencia}`);
  }
  const comissoes: ComissaoOpcaoReavaliacao[] =
    resultadoComissoes.status === "fulfilled"
      ? resultadoComissoes.value.dados
      : [];
  const erroComissoes =
    resultadoComissoes.status === "rejected"
      ? erroLeitura(
          resultadoComissoes.reason,
          "Não foi possível carregar as comissões vigentes.",
        )
      : "";

  return (
    <ProcessamentoDepreciacoes
      resposta={resposta}
      competencia={competencia}
      comissoes={comissoes}
      erroComissoes={erroComissoes}
      competencias={competencias}
      competenciaMaisAntigaPendente={competenciaMaisAntigaPendente}
    />
  );
}
