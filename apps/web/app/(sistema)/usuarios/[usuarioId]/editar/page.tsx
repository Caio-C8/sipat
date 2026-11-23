import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CadastroFormPage } from "@/features/cadastros/components/cadastro-form-page";
import { pagina } from "@/features/cadastros/components/cadastro-ui";
import { serverUsuarioOperations } from "@/features/usuarios/api/server-usuario-operations";
import {
  SituacaoUsuario,
  UsuarioForm,
} from "@/features/usuarios/components/usuario-form";
import { isApiError } from "@/lib/api/core/api-error";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = { title: "Editar usuário" };

export default async function EditarUsuarioPage({
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
          title="Editar usuário"
          description="Não foi possível carregar os dados deste usuário."
          actions={
            <Button asChild variant="outline" size="lg">
              <Link href="/usuarios">Voltar à consulta</Link>
            </Button>
          }
        />
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar este usuário</AlertTitle>
          <AlertDescription>{resultado.mensagem}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <CadastroFormPage
      title="Editar usuário"
      description="Atualize os dados, o perfil de acesso e a situação do usuário."
      listHref={`/usuarios/${usuarioId}`}
    >
      <UsuarioForm usuario={resultado.resposta.dados} />
      <SituacaoUsuario usuario={resultado.resposta.dados} />
    </CadastroFormPage>
  );
}
