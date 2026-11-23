import type { Metadata } from "next";
import { headers } from "next/headers";
import { ListarUsuariosQuerySchema } from "@repo/contracts";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { pagina as paginaLayout } from "@/features/cadastros/components/cadastro-ui";
import { serverUsuarioOperations } from "@/features/usuarios/api/server-usuario-operations";
import { ListaUsuarios } from "@/features/usuarios/components/usuario-list";
import { isApiError } from "@/lib/api/core/api-error";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";

export const metadata: Metadata = {
  title: "Usuários",
  description: "Consulta e gestão dos acessos ao SIPAT.",
};

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identidade = await exigirIdentidadeAtual();
  if (identidade.perfil !== "ADMINISTRADOR") {
    return (
      <AccessDenied description="Somente o Administrador pode gerenciar usuários." />
    );
  }

  const recebidos = await searchParams;
  const valores = Object.fromEntries(
    Object.entries(recebidos).filter(
      ([, valor]) => typeof valor === "string" && valor !== "",
    ),
  ) as Record<string, string>;
  const query = ListarUsuariosQuerySchema.safeParse(valores);

  if (!query.success) {
    return (
      <main className={paginaLayout}>
        <PageHeader
          title="Usuários"
          description="Defina quem pode acessar o sistema e quais operações estão disponíveis."
        />
        <Alert variant="destructive">
          <AlertTitle>Revise os filtros informados</AlertTitle>
          <AlertDescription>
            Use valores válidos para pesquisar os usuários e tente novamente.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const resultado = await (async () => {
    try {
      const resposta = await serverUsuarioOperations.listar(valores, {
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
      <main className={paginaLayout}>
        <PageHeader
          title="Usuários"
          description="Defina quem pode acessar o sistema e quais operações estão disponíveis."
        />
        <Alert variant="destructive">
          <AlertTitle>Não foi possível consultar os usuários</AlertTitle>
          <AlertDescription>{resultado.mensagem}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <ListaUsuarios
      registros={resultado.resposta.dados}
      meta={resultado.resposta.meta}
      busca={query.data.busca}
      perfil={query.data.perfil}
      ativo={
        query.data.ativo === undefined
          ? undefined
          : query.data.ativo
            ? "true"
            : "false"
      }
    />
  );
}
