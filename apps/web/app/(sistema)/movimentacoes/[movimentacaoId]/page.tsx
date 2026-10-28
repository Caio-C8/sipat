import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MovimentacaoParamsSchema } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverMovimentacaoOperations } from "@/features/movimentacoes/api/server-movimentacao-operations";
import { ErroMovimentacao } from "@/features/movimentacoes/components/erro-movimentacao";
import {
  formatarDataMovimentacao,
  painelMovimentacao,
} from "@/features/movimentacoes/presentation";
export const metadata: Metadata = { title: "Detalhes da movimentação" };
export default async function MovimentacaoDetalhePage({
  params,
}: {
  params: Promise<{ movimentacaoId: string }>;
}) {
  if (!(await obterIdentidadeAtual())) return null;
  const parsed = MovimentacaoParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  let resposta: Awaited<
    ReturnType<typeof serverMovimentacaoOperations.consultar>
  >;
  try {
    resposta = await serverMovimentacaoOperations.consultar(
      parsed.data.movimentacaoId,
      { cookie: (await headers()).get("cookie") ?? "" },
    );
  } catch (e) {
    if (isApiError(e) && e.status === 404) notFound();
    return (
      <main className="p-7">
        <h1 className="mb-4 text-2xl font-bold">Detalhes da movimentação</h1>
        <ErroMovimentacao erro={e} />
      </main>
    );
  }
  const item = resposta.dados;
  return (
    <main className="grid min-w-0 gap-5 p-4 text-[#19355d] sm:p-7">
      <header>
        <Link
          prefetch={false}
          href="/movimentacoes"
          className="text-sm underline"
        >
          Voltar às movimentações
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Detalhes da movimentação</h1>
        <p className="mt-2 text-sm">
          Patrimônio {item.patrimonio.numeroPatrimonio} ·{" "}
          {item.patrimonio.descricao}
        </p>
      </header>
      <section className={painelMovimentacao}>
        <h2 className="mb-5 font-bold">Transferência individual</h2>
        <dl className="grid gap-5 text-sm sm:grid-cols-2">
          {[
            ["Setor de origem", item.setorOrigem.nome],
            ["Setor de destino", item.setorDestino.nome],
            ["Comissão", item.comissao.nome],
            ["Registrado por", item.registradoPor.nome],
            [
              "Data e horário (São Paulo)",
              formatarDataMovimentacao(item.dataTransferencia),
            ],
            [
              "Origem do registro",
              item.origemRegistro === "COMUM"
                ? "Transferência comum"
                : "Correção de inventário",
            ],
          ].map(([titulo, valor]) => (
            <div key={titulo}>
              <dt className="text-[#526580]">{titulo}</dt>
              <dd className="mt-1 font-semibold wrap-anywhere">{valor}</dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="text-[#526580]">Motivo</dt>
            <dd className="mt-1 whitespace-pre-wrap wrap-anywhere">
              {item.observacao ??
                "Motivo não informado neste registro histórico."}
            </dd>
          </div>
          {item.correcaoInventario ? (
            <div className="sm:col-span-2">
              <dt className="text-[#526580]">Vínculo da correção</dt>
              <dd className="mt-1 grid gap-1 break-all">
                <span>Inventário: {item.correcaoInventario.inventarioId}</span>
                <span>Item: {item.correcaoInventario.itemInventarioId}</span>
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-6 border-t pt-4 text-xs text-[#526580]">
          Os nomes e descrições exibidos são dos cadastros atuais.
        </p>
      </section>
    </main>
  );
}
