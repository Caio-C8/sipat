import type { SetorDetalhe } from "@repo/contracts";
import { DetalheCadastroSomenteLeitura } from "@/features/cadastros/components/cadastros-telas";

const formatarData = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(value))
    : "Sem alteração registrada";

export function DetalheSetorResumo({ registro }: { registro: SetorDetalhe }) {
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
