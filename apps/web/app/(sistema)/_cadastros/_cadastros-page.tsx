import type { ReactNode } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as z from "zod";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/shared/page-header";
import { SimpleQueryFilters } from "@/components/shared/simple-query-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serverCadastros } from "@/features/cadastros/api/server";
import { CadastroFormPage } from "@/features/cadastros/components/cadastro-form-page";
import { ComissaoRouteModal } from "@/features/comissoes/components/comissao-route-modal";
import { EspecieRouteModal } from "@/features/especies/components/especie-route-modal";
import { NaturezaRouteModal } from "@/features/naturezas/components/natureza-route-modal";
import { ProcessoCompraRouteModal } from "@/features/processos-compra/components/processo-compra-route-modal";
import { DetalheCadastroSomenteLeitura } from "@/features/cadastros/components/cadastros-telas";
import { FormularioComissao } from "@/features/comissoes/components/comissao-form";
import { FormularioProcesso } from "@/features/processos-compra/components/processo-compra-form";
import { FormularioEspecie } from "@/features/especies/components/especie-form";
import { FormularioNatureza } from "@/features/naturezas/components/natureza-form";
import {
  ErroCadastro,
  mensagemErro,
  pagina,
  Paginacao,
} from "@/features/cadastros/components/cadastro-ui";
import { isApiError } from "@/lib/api/core/api-error";
import { exigirIdentidadeAtual } from "@/lib/auth/server-session";
import { administrativeRoutes } from "@/lib/navigation/administrative-routes";

export type SearchCadastros = Promise<
  Record<string, string | string[] | undefined>
>;
export type SecaoCatalogo =
  "processos" | "naturezas" | "especies" | "comissoes";

const QuerySchema = z.object({
  busca: z.string().trim().max(200).optional(),
  pagina: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional(),
  salvo: z.literal("1").optional(),
});

const configs = {
  processos: {
    title: "Processos de compra",
    description: "Consulte processos de compra e seus documentos fiscais.",
    listTitle: "Processos cadastrados",
    createLabel: "Cadastrar processo",
    editLabel: "Editar processo de compra",
    routes: administrativeRoutes.processosCompra,
  },
  naturezas: {
    title: "Naturezas",
    description: "Consulte as classificações administrativas dos bens.",
    listTitle: "Naturezas cadastradas",
    createLabel: "Cadastrar natureza",
    editLabel: "Editar natureza",
    routes: administrativeRoutes.naturezas,
  },
  especies: {
    title: "Espécies",
    description: "Consulte espécies e suas naturezas vinculadas.",
    listTitle: "Espécies cadastradas",
    createLabel: "Cadastrar espécie",
    editLabel: "Editar espécie",
    routes: administrativeRoutes.especies,
  },
  comissoes: {
    title: "Comissões",
    description: "Consulte comissões, vigências e integrantes.",
    listTitle: "Comissões cadastradas",
    createLabel: "Cadastrar comissão",
    editLabel: "Editar comissão",
    routes: administrativeRoutes.comissoes,
  },
} as const;

async function requestCookie() {
  return (await headers()).get("cookie") ?? "";
}

function InvalidQuery({ section }: { section: SecaoCatalogo }) {
  return (
    <main className={pagina}>
      <PageHeader
        title="Consulta inválida"
        description={`Revise os filtros de ${configs[section].title.toLocaleLowerCase("pt-BR")}.`}
      />
      <p role="alert">Revise os filtros informados.</p>
    </main>
  );
}

function LoadError({
  section,
  error,
}: {
  section: SecaoCatalogo;
  error: unknown;
}) {
  const config = configs[section];
  return (
    <main className={pagina}>
      <PageHeader title={config.title} description={config.description} />
      <ErroCadastro mensagem={mensagemErro(error)} />
      <Button asChild variant="outline">
        <Link href={config.routes.list}>Tentar novamente</Link>
      </Button>
    </main>
  );
}

const formatDate = (value: string) => value.split("-").reverse().join("/");

export async function CadastrosPage({
  secao,
  searchParams,
}: {
  secao: SecaoCatalogo;
  searchParams: SearchCadastros;
}) {
  const [identity, parsed] = await Promise.all([
    exigirIdentidadeAtual(),
    searchParams.then((query) => QuerySchema.safeParse(query)),
  ]);
  if (!parsed.success) return <InvalidQuery section={secao} />;
  const query = {
    busca: parsed.data.busca || undefined,
    pagina: parsed.data.pagina,
    limite: "20",
  };
  const cookie = await requestCookie();
  const result = await (async () => {
    try {
      const response =
        secao === "processos"
          ? await serverCadastros.processos.listar(query, { cookie })
          : secao === "naturezas"
            ? await serverCadastros.naturezas.listar(query, { cookie })
            : secao === "especies"
              ? await serverCadastros.especies.listar(query, { cookie })
              : await serverCadastros.comissoes.listar(query, { cookie });
      return { type: "success" as const, response };
    } catch (error) {
      return { type: "error" as const, error };
    }
  })();
  if (result.type === "error")
    return <LoadError section={secao} error={result.error} />;

  const response = result.response;
  const renderPage = () => {
    const rows = response.dados.map((item) => {
      if (secao === "processos") {
        const process = item as Awaited<
          ReturnType<typeof serverCadastros.processos.listar>
        >["dados"][number];
        return {
          id: process.id,
          title: process.numeroProcesso
            ? `${process.numeroProcesso}${process.anoProcesso ? `/${process.anoProcesso}` : ""}`
            : "Processo sem número",
          detail: `${process.quantidadeNotas} ${process.quantidadeNotas === 1 ? "nota fiscal" : "notas fiscais"}`,
        };
      }
      if (secao === "especies") {
        const species = item as Awaited<
          ReturnType<typeof serverCadastros.especies.listar>
        >["dados"][number];
        return {
          id: species.id,
          title: species.nome,
          detail: species.natureza.nome,
        };
      }
      if (secao === "comissoes") {
        const commission = item as Awaited<
          ReturnType<typeof serverCadastros.comissoes.listar>
        >["dados"][number];
        return {
          id: commission.id,
          title: commission.nome,
          detail: `${formatDate(commission.dataVigenciaInicio)} a ${formatDate(commission.dataVigenciaFim)}`,
        };
      }
      const nature = item as Awaited<
        ReturnType<typeof serverCadastros.naturezas.listar>
      >["dados"][number];
      return {
        id: nature.id,
        title: nature.nome,
        detail: "Natureza patrimonial",
      };
    });
    const config = configs[secao];
    const canMutate =
      secao === "processos" || identity.perfil === "ADMINISTRADOR";
    const pageHref = (pageNumber: number) =>
      `${config.routes.list}?${new URLSearchParams({ ...(parsed.data.busca ? { busca: parsed.data.busca } : {}), pagina: String(pageNumber) })}`;
    return (
      <main className={pagina}>
        <PageHeader
          title={config.title}
          description={config.description}
          actions={
            canMutate ? (
              <Button asChild size="lg">
                <Link href={config.routes.create}>{config.createLabel}</Link>
              </Button>
            ) : undefined
          }
        />
        {parsed.data.salvo ? (
          <p role="status">Cadastro salvo com sucesso.</p>
        ) : null}
        <Card>
          <CardContent>
            <SimpleQueryFilters
              action={config.routes.list}
              title={`Pesquisar ${config.title.toLocaleLowerCase("pt-BR")}`}
              filters={[
                {
                  type: "text",
                  name: "busca",
                  label: "Buscar",
                  defaultValue: parsed.data.busca,
                  placeholder: "Buscar por nome ou número…",
                  maxLength:
                    secao === "processos"
                      ? 200
                      : secao === "comissoes"
                        ? 150
                        : 100,
                },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{config.listTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {rows.length === 0 ? (
              <p>Nenhum registro encontrado.</p>
            ) : (
              <div
                className="overflow-x-auto"
                role="region"
                aria-label={config.listTitle}
                tabIndex={0}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Informação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.title}
                        </TableCell>
                        <TableCell>{row.detail}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`${config.routes.list}/${row.id}`}>
                                Consultar
                              </Link>
                            </Button>
                            {canMutate ? (
                              <Button asChild size="sm">
                                <Link href={config.routes.edit(row.id)}>
                                  Editar
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Paginacao meta={response.meta} href={pageHref} />
          </CardContent>
        </Card>
      </main>
    );
  };
  return renderPage();
}

async function loadRecord(section: SecaoCatalogo, id: string) {
  if (!z.uuid().safeParse(id).success) notFound();
  const cookie = await requestCookie();
  try {
    return section === "processos"
      ? (await serverCadastros.processos.consultar(id, { cookie })).dados
      : section === "naturezas"
        ? (await serverCadastros.naturezas.consultar(id, { cookie })).dados
        : section === "especies"
          ? (await serverCadastros.especies.consultar(id, { cookie })).dados
          : (await serverCadastros.comissoes.consultar(id, { cookie })).dados;
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}

function DetailShell({
  section,
  id,
  canMutate,
  children,
}: {
  section: SecaoCatalogo;
  id: string;
  canMutate: boolean;
  children: ReactNode;
}) {
  const config = configs[section];
  return (
    <main className={pagina}>
      <PageHeader
        title={`Detalhes · ${config.title}`}
        description={config.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={config.routes.list}>Voltar à consulta</Link>
            </Button>
            {canMutate ? (
              <Button asChild>
                <Link href={config.routes.edit(id)}>Editar</Link>
              </Button>
            ) : null}
          </div>
        }
      />
      {children}
    </main>
  );
}

export async function CatalogDetailPage({
  section,
  id,
}: {
  section: SecaoCatalogo;
  id: string;
}) {
  const [identity, record] = await Promise.all([
    exigirIdentidadeAtual(),
    loadRecord(section, id),
  ]);
  const canMutate =
    section === "processos" || identity.perfil === "ADMINISTRADOR";
  if (section === "processos") {
    const process = record as Awaited<
      ReturnType<typeof serverCadastros.processos.consultar>
    >["dados"];
    return (
      <DetailShell section={section} id={process.id} canMutate={canMutate}>
        <DetalheCadastroSomenteLeitura
          titulo={
            process.numeroProcesso
              ? `Processo ${process.numeroProcesso}${process.anoProcesso ? `/${process.anoProcesso}` : ""}`
              : "Processo sem número"
          }
          campos={[
            {
              rotulo: "Empenho",
              valor: process.numeroEmpenho
                ? `${process.numeroEmpenho}${process.anoEmpenho ? `/${process.anoEmpenho}` : ""}`
                : "Não informado",
            },
            {
              rotulo: "Valor total",
              valor: process.valorTotal ?? "Não informado",
            },
            {
              rotulo: "Observações",
              valor: process.observacao ?? "Não informadas",
            },
            {
              rotulo: "Notas fiscais",
              valor: process.notas.length
                ? process.notas
                    .map(
                      (note) =>
                        `${note.numeroNotaFiscal}/${note.anoNotaFiscal}`,
                    )
                    .join(", ")
                : "Nenhuma nota fiscal vinculada",
            },
          ]}
        />
      </DetailShell>
    );
  }
  if (section === "naturezas") {
    const nature = record as Awaited<
      ReturnType<typeof serverCadastros.naturezas.consultar>
    >["dados"];
    return (
      <DetailShell section={section} id={nature.id} canMutate={canMutate}>
        <DetalheCadastroSomenteLeitura
          titulo={nature.nome}
          campos={[
            { rotulo: "Nome", valor: nature.nome },
            { rotulo: "Descrição", valor: nature.descricao ?? "Não informada" },
          ]}
        />
      </DetailShell>
    );
  }
  if (section === "especies") {
    const species = record as Awaited<
      ReturnType<typeof serverCadastros.especies.consultar>
    >["dados"];
    return (
      <DetailShell section={section} id={species.id} canMutate={canMutate}>
        <DetalheCadastroSomenteLeitura
          titulo={species.nome}
          campos={[
            { rotulo: "Nome", valor: species.nome },
            { rotulo: "Natureza", valor: species.natureza.nome },
            {
              rotulo: "Descrição",
              valor: species.descricao ?? "Não informada",
            },
          ]}
        />
      </DetailShell>
    );
  }
  const commission = record as Awaited<
    ReturnType<typeof serverCadastros.comissoes.consultar>
  >["dados"];
  return (
    <DetailShell section={section} id={commission.id} canMutate={canMutate}>
      <DetalheCadastroSomenteLeitura
        titulo={commission.nome}
        campos={[
          {
            rotulo: "Ato de designação",
            valor: commission.numeroAto ?? "Não informado",
          },
          {
            rotulo: "Vigência",
            valor: `${formatDate(commission.dataVigenciaInicio)} a ${formatDate(commission.dataVigenciaFim)}`,
          },
          {
            rotulo: "Descrição",
            valor: commission.descricao ?? "Não informada",
          },
          {
            rotulo: "Integrantes",
            valor: commission.membros.length
              ? commission.membros
                  .map(
                    (member) =>
                      `${member.responsavel.nome} (${member.papel === "PRESIDENTE" ? "Presidente" : "Membro"})`,
                  )
                  .join(", ")
              : "Nenhum integrante cadastrado",
          },
        ]}
      />
    </DetailShell>
  );
}

type RecordResult = Awaited<ReturnType<typeof loadRecord>>;
function Form({
  section,
  record,
  modal = false,
}: {
  section: SecaoCatalogo;
  record?: RecordResult;
  modal?: boolean;
}) {
  if (section === "processos")
    return modal ? (
      <ProcessoCompraRouteModal
        registro={
          record as
            | Awaited<
                ReturnType<typeof serverCadastros.processos.consultar>
              >["dados"]
            | undefined
        }
      />
    ) : (
      <FormularioProcesso
        registro={
          record as
            | Awaited<
                ReturnType<typeof serverCadastros.processos.consultar>
              >["dados"]
            | undefined
        }
        contexto={record ? "pagina-edicao" : "pagina-criacao"}
      />
    );
  if (section === "naturezas")
    return modal ? (
      <NaturezaRouteModal
        registro={
          record as
            | Awaited<
                ReturnType<typeof serverCadastros.naturezas.consultar>
              >["dados"]
            | undefined
        }
      />
    ) : (
      <FormularioNatureza
        registro={
          record as
            | Awaited<
                ReturnType<typeof serverCadastros.naturezas.consultar>
              >["dados"]
            | undefined
        }
        contexto={record ? "pagina-edicao" : "pagina-criacao"}
      />
    );
  if (section === "especies")
    return modal ? (
      <EspecieRouteModal
        registro={
          record as
            | Awaited<
                ReturnType<typeof serverCadastros.especies.consultar>
              >["dados"]
            | undefined
        }
      />
    ) : (
      <FormularioEspecie
        registro={
          record as
            | Awaited<
                ReturnType<typeof serverCadastros.especies.consultar>
              >["dados"]
            | undefined
        }
        contexto={record ? "pagina-edicao" : "pagina-criacao"}
      />
    );
  return modal ? (
    <ComissaoRouteModal
      registro={
        record as
          | Awaited<
              ReturnType<typeof serverCadastros.comissoes.consultar>
            >["dados"]
          | undefined
      }
    />
  ) : (
    <FormularioComissao
      registro={
        record as
          | Awaited<
              ReturnType<typeof serverCadastros.comissoes.consultar>
            >["dados"]
          | undefined
      }
      contexto={record ? "pagina-edicao" : "pagina-criacao"}
    />
  );
}

export async function CatalogCreatePage({
  section,
  modal = false,
}: {
  section: SecaoCatalogo;
  modal?: boolean;
}) {
  const identity = await exigirIdentidadeAtual();
  const admin = identity.perfil === "ADMINISTRADOR";
  if (section !== "processos" && !admin)
    return (
      <AccessDenied description="Somente o Administrador pode cadastrar este registro." />
    );
  if (modal) return <Form section={section} modal />;
  const config = configs[section];
  return (
    <CadastroFormPage
      title={config.createLabel}
      description={config.description}
      listHref={config.routes.list}
    >
      <Form section={section} />
    </CadastroFormPage>
  );
}

export async function CatalogEditPage({
  section,
  id,
  modal = false,
}: {
  section: SecaoCatalogo;
  id: string;
  modal?: boolean;
}) {
  const identity = await exigirIdentidadeAtual();
  const admin = identity.perfil === "ADMINISTRADOR";
  if (section !== "processos" && !admin)
    return (
      <AccessDenied description="Somente o Administrador pode editar este registro." />
    );
  const record = await loadRecord(section, id);
  if (modal) return <Form section={section} record={record} modal />;
  const config = configs[section];
  return (
    <CadastroFormPage
      title={config.editLabel}
      description={config.description}
      listHref={config.routes.list}
    >
      <Form section={section} record={record} />
    </CadastroFormPage>
  );
}
