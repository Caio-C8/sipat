import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Pencil } from "lucide-react";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { pagina } from "@/features/cadastros/components/cadastro-ui";
import { serverUsuarioOperations } from "@/features/usuarios/api/server-usuario-operations";
import { DetalheUsuario } from "@/features/usuarios/components/usuario-detail";
import { isApiError } from "@/lib/api/core/api-error";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { administrativeRoutes } from "@/lib/navigation/administrative-routes";

export const metadata: Metadata = { title: "Consultar usuário" };

export default async function UsuarioDetalhePage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "ADMINISTRADOR") {
    return (
      <AccessDenied description="Somente o Administrador pode consultar usuários." />
    );
  }

  const { usuarioId } = await params;
  const routes = administrativeRoutes.usuarios;
  const resultado = await (async () => {
    try {
      const resposta = await serverUsuarioOperations.consultar(usuarioId, {
        cookie: (await headers()).get("cookie") ?? "",
      });
      return { tipo: "sucesso" as const, resposta };
    } catch (falha) {
      return {
        tipo: "erro" as const,
        mensagem: isApiError(falha)
          ? falha.message
          : "Tente carregar a página novamente. Se o problema continuar, volte mais tarde.",
      };
    }
  })();

  if (resultado.tipo === "erro") {
    return (
      <main className={pagina}>
        <PageHeader
          title="Consulta de usuário"
          description="Não foi possível carregar os dados deste usuário."
          actions={
            <Button asChild variant="outline" size="lg">
              <Link href={routes.list}>Voltar à consulta</Link>
            </Button>
          }
        />
        <Alert variant="destructive">
          <AlertTitle>Não foi possível consultar este usuário</AlertTitle>
          <AlertDescription>{resultado.mensagem}</AlertDescription>
        </Alert>
      </main>
    );
  }

  const usuario = resultado.resposta.dados;
  return (
    <main className={pagina}>
      <PageHeader
        title={usuario.nome}
        description="Consulte os dados e o perfil de acesso deste usuário."
        actions={
          <>
            <Button asChild variant="outline" size="lg">
              <Link href={routes.list}>Voltar à consulta</Link>
            </Button>
            <Button asChild size="lg">
              <Link href={routes.edit(usuario.id)}>
                <Pencil data-icon="inline-start" />
                Editar usuário
              </Link>
            </Button>
          </>
        }
      />
      <DetalheUsuario registro={usuario} />
    </main>
  );
}
