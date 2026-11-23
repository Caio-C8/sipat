import { AccessDenied } from "@/components/shared/access-denied";
import { UsuarioRouteModal } from "@/features/usuarios/components/usuario-route-modal";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export default async function Page() {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "ADMINISTRADOR") {
    return (
      <AccessDenied description="Somente o Administrador pode cadastrar usuários." />
    );
  }
  return <UsuarioRouteModal />;
}
