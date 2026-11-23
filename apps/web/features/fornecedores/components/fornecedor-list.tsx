import type { FornecedorResumo } from "@repo/contracts";
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

export const formatarCnpj = (cnpj: string | null) =>
  cnpj
    ? `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
    : null;

export function ListaFornecedores({
  registros,
  meta,
  busca,
  situacao,
  admin,
}: {
  registros: FornecedorResumo[];
  meta: CadastroListMeta;
  busca?: string;
  situacao?: "todos" | "ativos" | "inativos";
  admin: boolean;
}) {
  const routes = administrativeRoutes.fornecedores;
  return (
    <CadastroListShell
      title="Fornecedores"
      description="Consulte fornecedores ativos e inativos vinculados ao patrimônio."
      listTitle="Fornecedores cadastrados"
      createHref={routes.create}
      createLabel="Cadastrar fornecedor"
      admin={admin}
      filters={
        <SimpleQueryFilters
          action={routes.list}
          title="Pesquisar fornecedores"
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
      pageHref={(page) =>
        cadastroPageHref(routes.list, page, busca, "situacao", situacao)
      }
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
      {registros.length === 0 ? <p>Nenhum fornecedor encontrado.</p> : null}
    </CadastroListShell>
  );
}
