import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PatrimonioParamsSchema, queryRelatorio } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { serverRelatorios } from "@/features/relatorios/api/server";
import { PatrimonioDetalheView } from "@/features/patrimonios/components/patrimonio-detalhe";

export const metadata: Metadata = { title: "Detalhes do patrimônio" };

export default async function PatrimonioDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ patrimonioId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const parametro = PatrimonioParamsSchema.safeParse(await params);
  if (!parametro.success) notFound();
  const recebidos = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(recebidos).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const aba = valores.aba === "historico" ? "historico" : "dados";
  valores.aba = aba;
  const cookie = (await headers()).get("cookie") ?? "";
  const { aba: _aba, dataInicial, dataFinal, ...restante } = valores;
  void _aba;
  const filtros = {
    ...restante,
    ...(dataInicial ? { inicio: dataInicial } : {}),
    ...(dataFinal ? { fim: dataFinal } : {}),
  };
  const query =
    aba === "historico" ? queryRelatorio("ficha-bem").safeParse(filtros) : null;
  if (query && !query.success)
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold">Histórico do patrimônio</h1>
        <p role="alert" className="mt-4 text-red-800">
          Filtros do histórico inválidos.
        </p>
      </main>
    );
  let detalhe;
  let eventos = null;
  let falhaDetalhe: unknown;
  let falhaEventos: unknown;
  try {
    detalhe = await serverPatrimonioOperations.consultar(
      parametro.data.patrimonioId,
      { cookie },
    );
  } catch (erro) {
    falhaDetalhe = erro;
  }
  if (detalhe && query?.success) {
    try {
      eventos = await serverRelatorios.eventos(
        parametro.data.patrimonioId,
        filtros,
        { cookie },
      );
    } catch (erro) {
      falhaEventos = erro;
    }
  }
  if (isApiError(falhaDetalhe) && falhaDetalhe.status === 404) notFound();
  if (!detalhe)
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold">Detalhes do patrimônio</h1>
        <p role="alert" className="mt-4 text-red-800">
          {isApiError(falhaDetalhe)
            ? falhaDetalhe.message
            : "Não foi possível consultar o patrimônio."}
        </p>
      </main>
    );
  const hoje = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return (
    <PatrimonioDetalheView
      patrimonio={detalhe.dados}
      eventos={eventos}
      erroEventos={
        falhaEventos
          ? isApiError(falhaEventos)
            ? falhaEventos.message
            : "Não foi possível consultar o histórico deste patrimônio."
          : null
      }
      valores={valores}
      diretor={identidade.perfil === "DIRETOR_PATRIMONIO"}
      usuarioId={identidade.id}
      hoje={hoje}
    />
  );
}
