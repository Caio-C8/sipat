import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ListarDepreciacoesPendentesQuerySchema,
  type ComissaoOpcaoReavaliacao,
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
    "Consulte e processe a depreciação patrimonial da competência atual.",
};

function competenciaAtualSaoPaulo() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const ano = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;
  return `${ano}-${mes}`;
}

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

  const competencia = competenciaAtualSaoPaulo();
  const recebidos = await searchParams;
  const pagina =
    typeof recebidos.pagina === "string" ? recebidos.pagina : undefined;
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

  const cookie = (await headers()).get("cookie") ?? "";
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
    redirect("/depreciacao");
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
    />
  );
}
