import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EmprestimoParamsSchema } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";
import { serverEmprestimoOperations } from "@/features/emprestimos/api/server-emprestimo-operations";
import { DetalheEmprestimo } from "@/features/emprestimos/components/detalhe-emprestimo";
import { mensagemEmprestimo } from "@/features/emprestimos/apresentacao";

export const metadata: Metadata = { title: "Detalhes do empréstimo" };
export default async function EmprestimoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ emprestimoId: string }>;
  searchParams: Promise<{ origem?: string }>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const parsed = EmprestimoParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  let resposta: Awaited<
    ReturnType<typeof serverEmprestimoOperations.consultar>
  > | null = null;
  let falha: unknown = null;
  try {
    resposta = await serverEmprestimoOperations.consultar(
      parsed.data.emprestimoId,
      { cookie: (await headers()).get("cookie") ?? "" },
    );
  } catch (erro) {
    if (isApiError(erro) && erro.status === 404) notFound();
    falha = erro;
  }
  const origem = (await searchParams).origem;
  const consultaRetorno = new URLSearchParams();
  if (origem && origem.length <= 1000) {
    const permitidos = new Set([
      "aba",
      "busca",
      "dataInicio",
      "dataFim",
      "somenteAtrasados",
      "pagina",
    ]);
    new URLSearchParams(origem).forEach((valor, chave) => {
      if (permitidos.has(chave)) consultaRetorno.set(chave, valor);
    });
  }
  const retorno = consultaRetorno.size
    ? `/emprestimos?${consultaRetorno}`
    : "/emprestimos";
  if (resposta)
    return (
      <DetalheEmprestimo
        inicial={resposta.dados}
        podeDevolver={identidade.perfil === "DIRETOR_PATRIMONIO"}
        usuario={identidade.nome}
        retorno={retorno}
      />
    );
  return (
    <main className="p-4 sm:p-7">
      <h1 className="mb-4 text-2xl font-bold">Detalhes do empréstimo</h1>
      <p role="alert" className="rounded-md bg-red-50 p-4 text-red-900">
        {mensagemEmprestimo(falha)}
      </p>
    </main>
  );
}
