import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CircleUserRound, Scale } from "lucide-react";
import { PatrimonioParamsSchema } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { AnexoBaixa } from "@/features/baixas/components/anexo-baixa";
import {
  formatarDataBaixa,
  formatarInstanteBaixa,
  rotulosTipoBaixa,
} from "@/features/baixas/apresentacao";

export const metadata: Metadata = { title: "Detalhe da baixa" };

export default async function BaixaDetalhePage({
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
  const consulta = await searchParams;
  const retornoInformado =
    typeof consulta.retorno === "string" ? consulta.retorno : "/baixas";
  const retorno =
    retornoInformado.startsWith("/baixas") && !retornoInformado.startsWith("//")
      ? retornoInformado
      : "/baixas";
  let resposta;
  let falha: unknown;
  try {
    resposta = await serverPatrimonioOperations.consultarBaixa(
      parametro.data.patrimonioId,
      { cookie: (await headers()).get("cookie") ?? "" },
    );
  } catch (erro) {
    falha = erro;
  }
  if (!resposta) {
    if (isApiError(falha) && falha.status === 404) notFound();
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold">Detalhe da baixa</h1>
        <p role="alert" className="mt-4 text-red-800">
          {isApiError(falha)
            ? falha.message
            : "Não foi possível consultar a baixa."}
        </p>
      </main>
    );
  }
  const baixa = resposta.dados;
  return (
    <main className="mx-auto grid w-full max-w-[1900px] gap-5 p-4 text-[#19355d] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#2863ec]">
            Detalhe da baixa
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            Baixa — {baixa.patrimonio.numeroPatrimonio}
          </h1>
          <p className="mt-1 text-sm text-[#526580]">
            Registro individual, irreversível e somente leitura.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={retorno}>
            <ArrowLeft aria-hidden="true" /> Voltar à lista
          </Link>
        </Button>
      </header>
      {consulta.sucesso === "1" ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
        >
          Baixa registrada com sucesso. O detalhe abaixo foi lido da API.
        </p>
      ) : null}
      <section
        className="grid gap-4 md:grid-cols-3"
        aria-label="Resumo da baixa"
      >
        <div className="rounded-lg border border-[#dfe7f1] bg-white p-4">
          <CalendarDays aria-hidden="true" className="size-5 text-[#2863ec]" />
          <p className="mt-3 text-xs uppercase tracking-wide text-[#526580]">
            Data e tipo
          </p>
          <p className="mt-1 font-bold">{formatarDataBaixa(baixa.dataBaixa)}</p>
          <p className="text-sm">
            {rotulosTipoBaixa[baixa.tipo] ?? baixa.tipo}
          </p>
        </div>
        <div className="rounded-lg border border-[#dfe7f1] bg-white p-4">
          <Scale aria-hidden="true" className="size-5 text-[#2863ec]" />
          <p className="mt-3 text-xs uppercase tracking-wide text-[#526580]">
            Comissão
          </p>
          <p className="mt-1 font-bold">{baixa.comissao.nome}</p>
        </div>
        <div className="rounded-lg border border-[#dfe7f1] bg-white p-4">
          <CircleUserRound
            aria-hidden="true"
            className="size-5 text-[#2863ec]"
          />
          <p className="mt-3 text-xs uppercase tracking-wide text-[#526580]">
            Auditoria
          </p>
          <p className="mt-1 break-words font-bold">{baixa.createdBy.nome}</p>
          <p className="text-sm">{formatarInstanteBaixa(baixa.createdAt)}</p>
        </div>
      </section>
      <section
        className="rounded-lg border border-[#dfe7f1] bg-white p-4 sm:p-5"
        aria-labelledby="dados-patrimonio-baixa"
      >
        <h2 id="dados-patrimonio-baixa" className="font-bold">
          Patrimônio baixado
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#526580]">
              Número patrimonial
            </dt>
            <dd className="mt-1 font-semibold">
              {baixa.patrimonio.numeroPatrimonio}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#526580]">
              Descrição
            </dt>
            <dd className="mt-1 break-words font-semibold">
              {baixa.patrimonio.descricao}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-[#526580]">
              Motivo
            </dt>
            <dd className="mt-1 whitespace-pre-wrap break-words">
              {baixa.motivo}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-[#526580]">
              Observação
            </dt>
            <dd className="mt-1 whitespace-pre-wrap break-words">
              {baixa.observacao ?? "Não informada"}
            </dd>
          </div>
        </dl>
      </section>
      {identidade.perfil === "DIRETOR_PATRIMONIO" && baixa.anexoUrl ? (
        <section className="rounded-lg border border-[#dfe7f1] bg-white p-4 sm:p-5">
          <h2 className="mb-3 font-bold">Documento comprobatório</h2>
          <AnexoBaixa
            patrimonioId={baixa.patrimonio.id}
            numero={baixa.patrimonio.numeroPatrimonio}
          />
        </section>
      ) : null}
    </main>
  );
}
