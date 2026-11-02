import type { Metadata } from "next";
import { headers } from "next/headers";
import { ListarPatrimoniosQuerySchema } from "@repo/contracts";
import { PatrimonioLista } from "@/features/patrimonios/components/patrimonio-lista";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { isApiError } from "@/lib/api/core/api-error";

export const metadata: Metadata = {
  title: "Consultar patrimônio",
  description: "Consulta integrada de patrimônios do SIPAT.",
};

export default async function PatrimoniosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  const recebidos = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(recebidos).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const query = ListarPatrimoniosQuerySchema.safeParse(valores);
  if (!query.success)
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold">Consultar patrimônio</h1>
        <p role="alert" className="mt-4 text-red-800">
          Filtros inválidos. Revise os valores informados.
        </p>
      </main>
    );
  let resposta;
  let falha: unknown;
  try {
    resposta = await serverPatrimonioOperations.listar(valores, {
      cookie: (await headers()).get("cookie") ?? "",
    });
  } catch (erro) {
    falha = erro;
  }
  if (!resposta) {
    const mensagem = isApiError(falha)
      ? falha.message
      : "Não foi possível consultar os patrimônios. Tente novamente.";
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold">Consultar patrimônio</h1>
        <p role="alert" className="mt-4 text-red-800">
          {mensagem}
        </p>
      </main>
    );
  }
  return (
    <PatrimonioLista
      resposta={resposta}
      valores={valores}
      podeCadastrar={identidade.perfil === "DIRETOR_PATRIMONIO"}
    />
  );
}
