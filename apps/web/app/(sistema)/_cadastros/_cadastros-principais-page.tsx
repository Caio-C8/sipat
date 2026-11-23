import type { ReactNode } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FornecedorParamsSchema,
  ResponsavelParamsSchema,
} from "@repo/contracts";
import * as z from "zod";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { serverCadastros } from "@/features/cadastros/api/server";
import { CadastroFormPage } from "@/features/cadastros/components/cadastro-form-page";
import { DetalheFornecedor } from "@/features/fornecedores/components/fornecedor-detail";
import { ListaFornecedores } from "@/features/fornecedores/components/fornecedor-list";
import { DetalheResponsavel } from "@/features/responsaveis/components/responsavel-detail";
import { ListaResponsaveis } from "@/features/responsaveis/components/responsavel-list";
import { FornecedorRouteModal } from "@/features/fornecedores/components/fornecedor-route-modal";
import { ResponsavelRouteModal } from "@/features/responsaveis/components/responsavel-route-modal";
import { FormularioFornecedor } from "@/features/fornecedores/components/fornecedor-form";
import { FormularioResponsavel } from "@/features/responsaveis/components/responsavel-form";
import {
  ErroCadastro,
  mensagemErro,
  pagina,
} from "@/features/cadastros/components/cadastro-ui";
import { isApiError } from "@/lib/api/core/api-error";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { administrativeRoutes } from "@/lib/navigation/administrative-routes";
import type { SearchCadastros } from "./_cadastros-page";

const ListQuerySchema = z.object({
  busca: z.string().trim().max(150).optional(),
  ativo: z.enum(["", "true", "false"]).optional(),
  situacao: z.enum(["todos", "ativos", "inativos"]).optional(),
  pagina: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional(),
  salvo: z.literal("1").optional(),
});

function InvalidQuery({ title }: { title: string }) {
  return (
    <main className={pagina}>
      <PageHeader
        title="Consulta inválida"
        description={`Revise os filtros de ${title.toLocaleLowerCase("pt-BR")}.`}
      />
      <p role="alert">Revise os filtros informados.</p>
    </main>
  );
}

function LoadError({
  title,
  description,
  error,
  href,
}: {
  title: string;
  description: string;
  error: unknown;
  href: string;
}) {
  return (
    <main className={pagina}>
      <PageHeader title={title} description={description} />
      <ErroCadastro mensagem={mensagemErro(error)} />
      <Button asChild variant="outline">
        <Link href={href}>Tentar novamente</Link>
      </Button>
    </main>
  );
}

async function cookie() {
  return (await headers()).get("cookie") ?? "";
}

export async function FornecedoresPage({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  const [identidade, parsed] = await Promise.all([
    exigirIdentidadeAtual(),
    searchParams.then((query) => ListQuerySchema.safeParse(query)),
  ]);
  if (!parsed.success) return <InvalidQuery title="Fornecedores" />;
  let response: Awaited<ReturnType<typeof serverCadastros.fornecedores.listar>>;
  try {
    response = await serverCadastros.fornecedores.listar(
      {
        busca: parsed.data.busca || undefined,
        ativo:
          parsed.data.situacao === "ativos"
            ? "true"
            : parsed.data.situacao === "inativos"
              ? "false"
              : undefined,
        pagina: parsed.data.pagina,
        limite: "20",
      },
      { cookie: await cookie() },
    );
  } catch (error) {
    return (
      <LoadError
        title="Fornecedores"
        description="Consulte fornecedores vinculados ao patrimônio."
        error={error}
        href={administrativeRoutes.fornecedores.list}
      />
    );
  }

  return (
    <ListaFornecedores
      registros={response.dados}
      meta={response.meta}
      busca={parsed.data.busca}
      situacao={parsed.data.situacao}
      admin={identidade.perfil === "ADMINISTRADOR"}
    />
  );
}

export async function ResponsaveisPage({
  searchParams,
}: {
  searchParams: SearchCadastros;
}) {
  const [identidade, parsed] = await Promise.all([
    exigirIdentidadeAtual(),
    searchParams.then((query) => ListQuerySchema.safeParse(query)),
  ]);
  if (!parsed.success) return <InvalidQuery title="Responsáveis" />;
  let response: Awaited<ReturnType<typeof serverCadastros.responsaveis.listar>>;
  try {
    response = await serverCadastros.responsaveis.listar(
      {
        busca: parsed.data.busca || undefined,
        ativo: parsed.data.ativo || undefined,
        pagina: parsed.data.pagina,
        limite: "20",
      },
      { cookie: await cookie() },
    );
  } catch (error) {
    return (
      <LoadError
        title="Responsáveis"
        description="Consulte os responsáveis pelos bens e comissões."
        error={error}
        href={administrativeRoutes.responsaveis.list}
      />
    );
  }

  return (
    <ListaResponsaveis
      registros={response.dados}
      meta={response.meta}
      busca={parsed.data.busca}
      ativo={parsed.data.ativo}
      admin={identidade.perfil === "ADMINISTRADOR"}
    />
  );
}

async function requireAdmin() {
  const identidade = await exigirIdentidadeAtual();
  return identidade.perfil === "ADMINISTRADOR";
}

async function loadFornecedor(params: Promise<{ fornecedorId: string }>) {
  const parsed = FornecedorParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  try {
    return (
      await serverCadastros.fornecedores.consultar(parsed.data.fornecedorId, {
        cookie: await cookie(),
      })
    ).dados;
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}

async function loadResponsavel(params: Promise<{ responsavelId: string }>) {
  const parsed = ResponsavelParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  try {
    return (
      await serverCadastros.responsaveis.consultar(parsed.data.responsavelId, {
        cookie: await cookie(),
      })
    ).dados;
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}

function DetailPage({
  title,
  description,
  listHref,
  editHref,
  admin,
  children,
}: {
  title: string;
  description: string;
  listHref: string;
  editHref: string;
  admin: boolean;
  children: ReactNode;
}) {
  return (
    <main className={pagina}>
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="lg">
              <Link href={listHref}>Voltar à consulta</Link>
            </Button>
            {admin ? (
              <Button asChild size="lg">
                <Link href={editHref}>Editar</Link>
              </Button>
            ) : null}
          </div>
        }
      />
      {children}
    </main>
  );
}

export async function FornecedorDetailPage({
  params,
}: {
  params: Promise<{ fornecedorId: string }>;
}) {
  const [identidade, registro] = await Promise.all([
    exigirIdentidadeAtual(),
    loadFornecedor(params),
  ]);
  const routes = administrativeRoutes.fornecedores;
  return (
    <DetailPage
      title={registro.razaoSocial}
      description="Detalhes cadastrais do fornecedor."
      listHref={routes.list}
      editHref={routes.edit(registro.id)}
      admin={identidade.perfil === "ADMINISTRADOR"}
    >
      <DetalheFornecedor registro={registro} />
    </DetailPage>
  );
}

export async function ResponsavelDetailPage({
  params,
}: {
  params: Promise<{ responsavelId: string }>;
}) {
  const [identidade, registro] = await Promise.all([
    exigirIdentidadeAtual(),
    loadResponsavel(params),
  ]);
  const routes = administrativeRoutes.responsaveis;
  return (
    <DetailPage
      title={registro.nome}
      description="Detalhes do funcionário responsável."
      listHref={routes.list}
      editHref={routes.edit(registro.id)}
      admin={identidade.perfil === "ADMINISTRADOR"}
    >
      <DetalheResponsavel registro={registro} />
    </DetailPage>
  );
}

export async function NovoFornecedorPage({
  modal = false,
}: {
  modal?: boolean;
}) {
  if (!(await requireAdmin()))
    return (
      <AccessDenied description="Somente o Administrador pode cadastrar fornecedores." />
    );
  if (modal) return <FornecedorRouteModal />;
  const routes = administrativeRoutes.fornecedores;
  return (
    <CadastroFormPage
      title="Cadastrar fornecedor"
      description="Informe os dados cadastrais do fornecedor."
      listHref={routes.list}
    >
      <FormularioFornecedor contexto="pagina-criacao" />
    </CadastroFormPage>
  );
}

export async function EditarFornecedorPage({
  params,
  modal = false,
}: {
  params: Promise<{ fornecedorId: string }>;
  modal?: boolean;
}) {
  if (!(await requireAdmin()))
    return (
      <AccessDenied description="Somente o Administrador pode editar fornecedores." />
    );
  const registro = await loadFornecedor(params);
  if (modal) return <FornecedorRouteModal registro={registro} />;
  return (
    <CadastroFormPage
      title="Editar fornecedor"
      description="Atualize os dados e a situação do fornecedor."
      listHref={administrativeRoutes.fornecedores.list}
    >
      <FormularioFornecedor registro={registro} contexto="pagina-edicao" />
    </CadastroFormPage>
  );
}

export async function NovoResponsavelPage({
  modal = false,
}: {
  modal?: boolean;
}) {
  if (!(await requireAdmin()))
    return (
      <AccessDenied description="Somente o Administrador pode cadastrar responsáveis." />
    );
  if (modal) return <ResponsavelRouteModal />;
  return (
    <CadastroFormPage
      title="Cadastrar responsável"
      description="Informe a matrícula e o nome do funcionário."
      listHref={administrativeRoutes.responsaveis.list}
    >
      <FormularioResponsavel contexto="pagina-criacao" />
    </CadastroFormPage>
  );
}

export async function EditarResponsavelPage({
  params,
  modal = false,
}: {
  params: Promise<{ responsavelId: string }>;
  modal?: boolean;
}) {
  if (!(await requireAdmin()))
    return (
      <AccessDenied description="Somente o Administrador pode editar responsáveis." />
    );
  const registro = await loadResponsavel(params);
  if (modal) return <ResponsavelRouteModal registro={registro} />;
  return (
    <CadastroFormPage
      title="Editar responsável"
      description="Atualize os dados e a situação do responsável."
      listHref={administrativeRoutes.responsaveis.list}
    >
      <FormularioResponsavel registro={registro} contexto="pagina-edicao" />
    </CadastroFormPage>
  );
}
