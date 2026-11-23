import type { ResponsavelResumo } from "@repo/contracts";
import { SimpleQueryFilters } from "@/components/shared/simple-query-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CadastroListShell,
  CadastroRowActions,
  cadastroPageHref,
  type CadastroListMeta,
  SituacaoCadastroBadge,
} from "@/features/cadastros/components/cadastro-list-shell";
import { administrativeRoutes } from "@/lib/navigation/administrative-routes";

export function ListaResponsaveis({
  registros,
  meta,
  busca,
  ativo,
  admin,
}: {
  registros: ResponsavelResumo[];
  meta: CadastroListMeta;
  busca?: string;
  ativo?: "" | "true" | "false";
  admin: boolean;
}) {
  const routes = administrativeRoutes.responsaveis;
  return (
    <CadastroListShell
      title="Responsáveis"
      description="Consulte os funcionários responsáveis pelos bens e comissões."
      listTitle="Responsáveis cadastrados"
      createHref={routes.create}
      createLabel="Cadastrar responsável"
      admin={admin}
      filters={
        <SimpleQueryFilters
          action={routes.list}
          title="Pesquisar responsáveis"
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
      }
      meta={meta}
      pageHref={(page) =>
        cadastroPageHref(routes.list, page, busca, "ativo", ativo)
      }
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
                <SituacaoCadastroBadge ativo={registro.ativo} />
              </TableCell>
              <TableCell>
                <CadastroRowActions
                  detailHref={`${routes.list}/${registro.id}`}
                  editHref={admin ? routes.edit(registro.id) : undefined}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {registros.length === 0 ? <p>Nenhum responsável encontrado.</p> : null}
    </CadastroListShell>
  );
}
