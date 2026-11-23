import type { ResponsavelDetalhe } from "@repo/contracts";
import { DetalheCadastroSomenteLeitura } from "@/features/cadastros/components/cadastros-telas";

const formatarData = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(value))
    : "Sem alteração registrada";

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
