import type { UsuarioDetalhe } from "@repo/contracts";
import { DetalheCadastroSomenteLeitura } from "@/features/cadastros/components/cadastros-telas";
import { perfilLabel } from "../presentation";

const formatarData = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));

export function DetalheUsuario({ registro }: { registro: UsuarioDetalhe }) {
  return (
    <DetalheCadastroSomenteLeitura
      titulo="Dados do usuário"
      campos={[
        { rotulo: "Nome", valor: registro.nome },
        { rotulo: "E-mail", valor: registro.email },
        { rotulo: "Perfil", valor: perfilLabel(registro.perfil) },
        { rotulo: "Situação", valor: registro.ativo ? "Ativo" : "Inativo" },
        { rotulo: "Criado em", valor: formatarData(registro.createdAt) },
        {
          rotulo: "Última atualização",
          valor: registro.updatedAt
            ? formatarData(registro.updatedAt)
            : "Sem alteração registrada",
        },
      ]}
    />
  );
}
