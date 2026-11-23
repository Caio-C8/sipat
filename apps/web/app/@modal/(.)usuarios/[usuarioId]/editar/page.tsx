import { headers } from "next/headers";
import { AccessDenied } from "@/components/shared/access-denied";
import { serverUsuarioOperations } from "@/features/usuarios/api/server-usuario-operations";
import { UsuarioRouteModal } from "@/features/usuarios/components/usuario-route-modal";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export default async function Page({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "ADMINISTRADOR") {
    return (
      <AccessDenied description="Somente o Administrador pode editar usuários." />
    );
  }
  const { usuarioId } = await params;
  const resposta = await serverUsuarioOperations.consultar(usuarioId, {
    cookie: (await headers()).get("cookie") ?? "",
  });
  return <UsuarioRouteModal usuario={resposta.dados} />;
}
