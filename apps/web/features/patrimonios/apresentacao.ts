import type { EventoFicha } from "@repo/contracts";
import { formatBrl } from "@/lib/format/decimal";

export const rotulosEvento = {
  SUBSTITUICAO_NUMERO: "Substituição de número",
  TRANSFERENCIA: "Movimentação",
  REAVALIACAO: "Reavaliação",
  DEPRECIACAO: "Depreciação",
  EMPRESTIMO: "Empréstimo",
  DEVOLUCAO: "Devolução",
  BAIXA: "Baixa",
  ENVIO_MANUTENCAO: "Envio para manutenção",
  REVISAO_ORCAMENTO: "Revisão de orçamento",
  RETORNO_MANUTENCAO: "Retorno de manutenção",
  CONFERENCIA_INVENTARIO: "Conferência de inventário",
  CORRECAO_INVENTARIO: "Correção de inventário",
  LOCALIZACAO_POSTERIOR: "Localização posterior",
  CORRECAO_LOCALIZACAO: "Correção de localização",
} as const;

const rotulosValorEnum: Record<string, string> = {
  ALIENACAO: "Alienação",
  INUTILIZACAO: "Inutilização",
  SINISTRO: "Sinistro",
  FURTO: "Furto",
  EXTRAVIO: "Extravio",
  TRANSFERENCIA: "Transferência definitiva",
  RECLASSIFICACAO: "Reclassificação",
  ABANDONO: "Abandono",
  ERRO_REGISTRO: "Erro de registro",
  OUTRO: "Outro",
  PREVENTIVA: "Preventiva",
  CORRETIVA: "Corretiva",
  PENDENTE: "Pendente",
  RETORNADO: "Retornado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  FINALIZADO: "Finalizado",
  CONCLUIDO: "Concluído",
  CORRETO: "Correto",
  DIVERGENCIA: "Divergência",
  NAO_LOCALIZADO: "Não localizado",
  VERIFICADO: "Verificado",
  CORRIGIDO: "Corrigido",
  RETORNO_AO_SETOR_CADASTRADO: "Retorno ao setor cadastrado",
  TRANSFERENCIA_CADASTRAL: "Transferência cadastral",
  ATIVO: "Ativo",
  EMPRESTADO: "Emprestado",
  EM_MANUTENCAO: "Em manutenção",
};

export function formatarRotuloEnum(valor: string): string {
  const normalizado = valor.trim();
  if (!normalizado) return normalizado;

  const rotuloConhecido = rotulosValorEnum[normalizado.toUpperCase()];
  if (rotuloConhecido) return rotuloConhecido;

  const texto = normalizado.toLocaleLowerCase("pt-BR").replaceAll("_", " ");
  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}

export function formatarData(valor: string | null) {
  if (!valor) return "Data não informada";
  const data = /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? new Date(`${valor}T12:00:00-03:00`)
    : new Date(valor);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    ...(valor.includes("T") ? { timeStyle: "short" as const } : {}),
  }).format(data);
}

export function apresentarEvento(evento: EventoFicha): {
  titulo: string;
  descricao: string;
  detalhe: string;
} {
  const titulo = rotulosEvento[evento.tipo];
  switch (evento.tipo) {
    case "SUBSTITUICAO_NUMERO":
      return {
        titulo,
        descricao: `Número ${evento.atributos.numeroAnterior} substituído por ${evento.atributos.numeroNovo}.`,
        detalhe: evento.autor
          ? `Registrado por ${evento.autor}.`
          : "Autor não informado.",
      };
    case "TRANSFERENCIA":
      return {
        titulo,
        descricao: `${evento.atributos.setorOrigem} → ${evento.atributos.setorDestino}.`,
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "REAVALIACAO":
      return {
        titulo,
        descricao: `Bem reavaliado para ${formatBrl(evento.atributos.valorReavaliado)}.`,
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "DEPRECIACAO":
      return {
        titulo,
        descricao: `Quota de ${formatBrl(evento.atributos.valorDepreciado)}; valor posterior ${formatBrl(evento.atributos.valorContabilNovo)}.`,
        detalhe: `Competência ${evento.atributos.competencia}.`,
      };
    case "EMPRESTIMO":
      return {
        titulo,
        descricao: evento.atributos.destinatario
          ? `Emprestado para ${evento.atributos.destinatario}.`
          : "Empréstimo registrado.",
        detalhe: evento.atributos.finalidade ?? "Finalidade não informada.",
      };
    case "DEVOLUCAO":
      return {
        titulo,
        descricao: "Devolução do bem registrada.",
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "BAIXA":
      return {
        titulo,
        descricao: `${formatarRotuloEnum(evento.atributos.tipo)}: ${evento.atributos.motivo}`,
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "ENVIO_MANUTENCAO":
      return {
        titulo,
        descricao: `${formatarRotuloEnum(evento.atributos.tipo)} · ${formatarRotuloEnum(evento.atributos.situacao)}`,
        detalhe: evento.atributos.servico ?? "Serviço não informado.",
      };
    case "REVISAO_ORCAMENTO":
      return {
        titulo,
        descricao: `${evento.atributos.descricao} · ${formatBrl(evento.atributos.valor)}`,
        detalhe: evento.atributos.fornecedor ?? "Fornecedor não informado.",
      };
    case "RETORNO_MANUTENCAO":
      return {
        titulo,
        descricao: `Retorno da manutenção · ${formatarRotuloEnum(evento.atributos.situacao)}`,
        detalhe: evento.atributos.servico ?? "Serviço não informado.",
      };
    case "CONFERENCIA_INVENTARIO":
      return {
        titulo,
        descricao: evento.atributos.situacao
          ? formatarRotuloEnum(evento.atributos.situacao)
          : "Conferência registrada.",
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "CORRECAO_INVENTARIO":
      return {
        titulo,
        descricao: evento.atributos.tipoCorrecao
          ? formatarRotuloEnum(evento.atributos.tipoCorrecao)
          : "Correção registrada.",
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "LOCALIZACAO_POSTERIOR":
      return {
        titulo,
        descricao: evento.atributos.setorLocalizacao
          ? `Bem localizado em ${evento.atributos.setorLocalizacao}.`
          : "Localização posterior registrada.",
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "CORRECAO_LOCALIZACAO":
      return {
        titulo,
        descricao: evento.atributos.tipoCorrecaoPosterior
          ? formatarRotuloEnum(evento.atributos.tipoCorrecaoPosterior)
          : "Correção da localização registrada.",
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
  }
}
