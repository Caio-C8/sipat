import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ListarPatrimoniosQuerySchema } from "@repo/contracts";
import { obterIdentidadeAtual } from "@/lib/auth/server-session";
import { serverPatrimonioOperations } from "@/features/patrimonios/api/server-patrimonio-operations";
import { NovaBaixa } from "@/features/baixas/components/nova-baixa";

export const metadata: Metadata = { title: "Nova baixa" };

export default async function NovaBaixaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await obterIdentidadeAtual();
  if (!identidade) return null;
  if (identidade.perfil !== "DIRETOR_PATRIMONIO") redirect("/baixas");
  const recebidos = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(recebidos).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const query = ListarPatrimoniosQuerySchema.safeParse({
    ...valores,
    status: "ATIVO",
    limite: valores.limite ?? "20",
  });
  if (!query.success)
    return (
      <main className="p-7">
        <h1 className="text-2xl font-bold">Registrar baixa</h1>
        <p role="alert" className="mt-4 text-red-800">
          A busca informada é inválida.
        </p>
      </main>
    );
  const resposta = await serverPatrimonioOperations.listar(
    { ...valores, status: "ATIVO", limite: valores.limite ?? "20" },
    { cookie: (await headers()).get("cookie") ?? "" },
  );
  return <NovaBaixa resposta={resposta} valores={valores} />;
}
