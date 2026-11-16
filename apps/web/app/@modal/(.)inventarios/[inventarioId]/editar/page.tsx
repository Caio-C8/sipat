import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { InventarioParamsSchema } from "@repo/contracts";
import { AccessDenied } from "@/components/shared/access-denied";
import { serverInventarioOperations } from "@/features/inventarios/api/server-inventario-operations";
import { InventarioRouteModal } from "@/features/inventarios/components/inventario-route-modal";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export default async function EditarInventarioModalPage({
  params,
}: {
  params: Promise<{ inventarioId: string }>;
}) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "DIRETOR_PATRIMONIO") return <AccessDenied />;
  const validacao = InventarioParamsSchema.safeParse(await params);
  if (!validacao.success) notFound();
  const resposta = await serverInventarioOperations.consultar(
    validacao.data.inventarioId,
    {
      cookie: (await headers()).get("cookie") ?? "",
    },
  );
  if (resposta.dados.status !== "PENDENTE") notFound();
  return <InventarioRouteModal inventario={resposta.dados} />;
}
