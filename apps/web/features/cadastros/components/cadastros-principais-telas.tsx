import type {
  FornecedorDetalhe,
  FornecedorResumo,
  ResponsavelDetalhe,
  ResponsavelResumo,
  SetorDetalhe,
  SetorResumo,
} from "@repo/contracts";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SimpleQueryFilters } from "@/components/shared/simple-query-filters";
import { Badge } from "@/components/ui/badge";
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
import { administrativeRoutes } from "@/lib/navigation/administrative-routes";
import { pagina, Paginacao } from "./cadastro-ui";
import { DetalheCadastroSomenteLeitura } from "./cadastros-telas";

type Meta = { total: number; pagina: number; ultimaPagina: number };

function Situacao({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "secondary" : "outline"}>
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}

function Acoes({
  detailHref,
  editHref,
}: {
  detailHref: string;
  editHref?: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={detailHref}>Consultar</Link>
      </Button>
      {editHref ? (
        <Button asChild size="sm">
          <Link href={editHref}>
            <Pencil data-icon="inline-start" />
            Editar
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function ListaShell({
  title,
  description,
  listTitle,
  createHref,
  createLabel,
  admin,
  filters,
  children,
  meta,
  pageHref,
}: {
  title: string;
  description: string;
  listTitle: string;
  createHref: string;
  createLabel: string;
  admin: boolean;
  filters: ReactNode;
  children: ReactNode;
  meta: Meta;
  pageHref: (page: number) => string;
}) {
  return (
    <main className={pagina}>
      <PageHeader
        title={title}
        description={description}
        actions={
          admin ? (
            <Button asChild size="lg">
              <Link href={createHref}>
                <Plus data-icon="inline-start" />
                {createLabel}
              </Link>
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent>{filters}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{listTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {children}
          <Paginacao meta={meta} href={pageHref} />
        </CardContent>
      </Card>
    </main>
  );
}

const filtros = (
  action: string,
  busca?: string,
  ativo?: "" | "true" | "false",
) => (
  <SimpleQueryFilters
    action={action}
    filters={[
      {
        type: "text",
        name: "busca",
        label: "Buscar",
        defaultValue: busca,
        placeholder: "Buscar por nome ou identificação…",
        maxLength: 150,
      },
      {
        type: "select",
        name: "ativo",
        label: "Situação",
        defaultValue: ativo ?? "",
        options: [
          { value: "", label: "Todos" },
          { value: "true", label: "Ativos" },
          { value: "false", label: "Inativos" },
        ],
      },
    ]}
  />
);

function pageHref(base: string, page: number, busca?: string, ativo?: string) {
  return `${base}?${new URLSearchParams({
    pagina: String(page),
    ...(busca ? { busca } : {}),
    ...(ativo ? { ativo } : {}),
  })}`;
}

function supplierPageHref(
  base: string,
  page: number,
  busca?: string,
  situacao?: string,
) {
  return `${base}?${new URLSearchParams({
    pagina: String(page),
    ...(busca ? { busca } : {}),
    ...(situacao ? { situacao } : {}),
  })}`;
}

export function ListaFornecedores({
  registros,
  meta,
  busca,
  situacao,
  admin,
}: {
  registros: FornecedorResumo[];
  meta: Meta;
  busca?: string;
  situacao?: "todos" | "ativos" | "inativos";
  admin: boolean;
}) {
  const routes = administrativeRoutes.fornecedores;
  return (
    <ListaShell
      title="Fornecedores"
      description="Consulte fornecedores ativos e inativos vinculados ao patrimônio."
      listTitle="Fornecedores cadastrados"
      createHref={routes.create}
      createLabel="Cadastrar fornecedor"
      admin={admin}
      filters={
        <SimpleQueryFilters
          action={routes.list}
          filters={[
            {
              type: "text",
              name: "busca",
              label: "Buscar",
              defaultValue: busca,
              placeholder: "Buscar por razão social, nome fantasia ou CNPJ…",
              maxLength: 150,
            },
            {
              type: "select",
              name: "situacao",
              label: "Situação",
              defaultValue: situacao ?? "todos",
              options: [
                { value: "todos", label: "Todos" },
                { value: "ativos", label: "Ativos" },
                { value: "inativos", label: "Inativos" },
              ],
            },
          ]}
        />
      }
      meta={meta}
      pageHref={(page) => supplierPageHref(routes.list, page, busca, situacao)}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Razão social</TableHead>
            <TableHead>Nome fantasia</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((registro) => (
            <TableRow key={registro.id}>
              <TableCell className="font-medium whitespace-normal">
                {registro.razaoSocial}
              </TableCell>
              <TableCell>{registro.nomeFantasia ?? "Não informado"}</TableCell>
              <TableCell>
                {formatarCnpj(registro.cnpj) ?? "Não informado"}
              </TableCell>
              <TableCell>
                <Situacao ativo={registro.ativo} />
              </TableCell>
              <TableCell>
                <Acoes
                  detailHref={`${routes.list}/${registro.id}`}
                  editHref={admin ? routes.edit(registro.id) : undefined}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {registros.length === 0 ? <p>Nenhum fornecedor encontrado.</p> : null}
    </ListaShell>
  );
}

export function ListaResponsaveis({
  registros,
  meta,
  busca,
  ativo,
  admin,
}: {
  registros: ResponsavelResumo[];
  meta: Meta;
  busca?: string;
  ativo?: "" | "true" | "false";
  admin: boolean;
}) {
  const routes = administrativeRoutes.responsaveis;
  return (
    <ListaShell
      title="Responsáveis"
      description="Consulte os funcionários responsáveis pelos bens e comissões."
      listTitle="Responsáveis cadastrados"
      createHref={routes.create}
      createLabel="Cadastrar responsável"
      admin={admin}
      filters={filtros(routes.list, busca, ativo)}
      meta={meta}
      pageHref={(page) => pageHref(routes.list, page, busca, ativo)}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Matrícula</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((registro) => (
            <TableRow key={registro.id}>
              <TableCell className="font-medium">{registro.nome}</TableCell>
              <TableCell>{registro.matricula}</TableCell>
              <TableCell>
                <Situacao ativo={registro.ativo} />
              </TableCell>
              <TableCell>
                <Acoes
                  detailHref={`${routes.list}/${registro.id}`}
                  editHref={admin ? routes.edit(registro.id) : undefined}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {registros.length === 0 ? <p>Nenhum responsável encontrado.</p> : null}
    </ListaShell>
  );
}

export function ListaSetoresPrincipal({
  registros,
  meta,
  busca,
  ativo,
  admin,
}: {
  registros: SetorResumo[];
  meta: Meta;
  busca?: string;
  ativo?: "" | "true" | "false";
  admin: boolean;
}) {
  const routes = administrativeRoutes.setores;
  return (
    <ListaShell
      title="Setores"
      description="Consulte setores, responsáveis, localização e situação."
      listTitle="Setores cadastrados"
      createHref={routes.create}
      createLabel="Cadastrar setor"
      admin={admin}
      filters={filtros(routes.list, busca, ativo)}
      meta={meta}
      pageHref={(page) => pageHref(routes.list, page, busca, ativo)}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Setor</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((registro) => (
            <TableRow key={registro.id}>
              <TableCell className="font-medium">{registro.nome}</TableCell>
              <TableCell>{registro.responsavel.nome}</TableCell>
              <TableCell>
                {[
                  registro.sala,
                  registro.ramal ? `Ramal ${registro.ramal}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Não informada"}
              </TableCell>
              <TableCell>
                <Situacao ativo={registro.ativo} />
              </TableCell>
              <TableCell>
                <Acoes
                  detailHref={`${routes.list}/${registro.id}`}
                  editHref={admin ? routes.edit(registro.id) : undefined}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {registros.length === 0 ? <p>Nenhum setor encontrado.</p> : null}
    </ListaShell>
  );
}

export const formatarCnpj = (cnpj: string | null) =>
  cnpj
    ? `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
    : null;

const formatarData = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(value))
    : "Sem alteração registrada";

export function DetalheFornecedor({
  registro,
}: {
  registro: FornecedorDetalhe;
}) {
  return (
    <DetalheCadastroSomenteLeitura
      titulo="Dados do fornecedor"
      campos={[
        { rotulo: "Razão social", valor: registro.razaoSocial },
        {
          rotulo: "Nome fantasia",
          valor: registro.nomeFantasia ?? "Não informado",
        },
        {
          rotulo: "Representante",
          valor: registro.nomeRepresentante ?? "Não informado",
        },
        {
          rotulo: "CNPJ",
          valor: formatarCnpj(registro.cnpj) ?? "Não informado",
        },
        { rotulo: "E-mail", valor: registro.email ?? "Não informado" },
        { rotulo: "Telefone", valor: registro.telefone ?? "Não informado" },
        { rotulo: "Endereço", valor: registro.endereco ?? "Não informado" },
        { rotulo: "Situação", valor: registro.ativo ? "Ativo" : "Inativo" },
        { rotulo: "Criado em", valor: formatarData(registro.createdAt) },
        {
          rotulo: "Última atualização",
          valor: formatarData(registro.updatedAt),
        },
      ]}
    />
  );
}

export function DetalheResponsavel({
  registro,
}: {
  registro: ResponsavelDetalhe;
}) {
  return (
    <DetalheCadastroSomenteLeitura
      titulo="Dados do responsável"
      campos={[
        { rotulo: "Nome", valor: registro.nome },
        { rotulo: "Matrícula", valor: registro.matricula },
        { rotulo: "Situação", valor: registro.ativo ? "Ativo" : "Inativo" },
        { rotulo: "Criado em", valor: formatarData(registro.createdAt) },
        {
          rotulo: "Última atualização",
          valor: formatarData(registro.updatedAt),
        },
      ]}
    />
  );
}

export function DetalheSetorPrincipal({
  registro,
}: {
  registro: SetorDetalhe;
}) {
  return (
    <DetalheCadastroSomenteLeitura
      titulo="Dados do setor"
      campos={[
        { rotulo: "Nome", valor: registro.nome },
        {
          rotulo: "Responsável",
          valor: `${registro.responsavel.nome} · ${registro.responsavel.matricula}`,
        },
        { rotulo: "Sala", valor: registro.sala ?? "Não informada" },
        { rotulo: "Ramal", valor: registro.ramal ?? "Não informado" },
        { rotulo: "Situação", valor: registro.ativo ? "Ativo" : "Inativo" },
        { rotulo: "Criado em", valor: formatarData(registro.createdAt) },
        {
          rotulo: "Última atualização",
          valor: formatarData(registro.updatedAt),
        },
      ]}
    />
  );
}
