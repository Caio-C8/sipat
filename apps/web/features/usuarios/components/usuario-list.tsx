import type { UsuarioResumo } from "@repo/contracts";
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
  SituacaoCadastroBadge,
  type CadastroListMeta,
} from "@/features/cadastros/components/cadastro-list-shell";
import { administrativeRoutes } from "@/lib/navigation/administrative-routes";
import { perfilLabel } from "../presentation";

export function ListaUsuarios({
  registros,
  meta,
  busca,
  perfil,
  ativo,
}: {
  registros: UsuarioResumo[];
  meta: CadastroListMeta;
  busca?: string;
  perfil?: "ADMINISTRADOR" | "DIRETOR_PATRIMONIO";
  ativo?: "true" | "false";
}) {
  const routes = administrativeRoutes.usuarios;
  const pageHref = (page: number) =>
    `${routes.list}?${new URLSearchParams({
      pagina: String(page),
      ...(busca ? { busca } : {}),
      ...(perfil ? { perfil } : {}),
      ...(ativo ? { ativo } : {}),
    })}`;

  return (
    <CadastroListShell
      title="Usuários"
      description="Defina quem pode acessar o sistema e quais operações estão disponíveis."
      listTitle="Usuários cadastrados"
      createHref={routes.create}
      createLabel="Cadastrar usuário"
      admin
      filters={
        <SimpleQueryFilters
          action={routes.list}
          title="Pesquisar usuários"
          filters={[
            {
              type: "text",
              name: "busca",
              label: "Nome ou e-mail",
              defaultValue: busca,
              placeholder: "Buscar por nome ou e-mail…",
              maxLength: 150,
            },
            {
              type: "select",
              name: "perfil",
              label: "Perfil",
              defaultValue: perfil ?? "",
              options: [
                { value: "", label: "Todos os perfis" },
                { value: "ADMINISTRADOR", label: "Administrador" },
                {
                  value: "DIRETOR_PATRIMONIO",
                  label: "Diretor de patrimônio",
                },
              ],
            },
            {
              type: "select",
              name: "ativo",
              label: "Situação",
              defaultValue: ativo ?? "",
              options: [
                { value: "", label: "Todas" },
                { value: "true", label: "Ativos" },
                { value: "false", label: "Inativos" },
              ],
            },
          ]}
        />
      }
      meta={meta}
      pageHref={pageHref}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário / e-mail</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell className="whitespace-normal">
                <strong className="block font-medium">{usuario.nome}</strong>
                <span className="text-muted-foreground">{usuario.email}</span>
              </TableCell>
              <TableCell>{perfilLabel(usuario.perfil)}</TableCell>
              <TableCell>
                <SituacaoCadastroBadge ativo={usuario.ativo} />
              </TableCell>
              <TableCell>
                <CadastroRowActions
                  detailHref={`${routes.list}/${usuario.id}`}
                  editHref={routes.edit(usuario.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {registros.length === 0 ? <p>Nenhum usuário encontrado.</p> : null}
    </CadastroListShell>
  );
}
