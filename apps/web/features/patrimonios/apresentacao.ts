import type { EventoFicha } from "@repo/contracts";

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

function moeda(valor: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
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
        descricao: `Bem reavaliado para ${moeda(evento.atributos.valorReavaliado)}.`,
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "DEPRECIACAO":
      return {
        titulo,
        descricao: `Quota de ${moeda(evento.atributos.valorDepreciado)}; valor posterior ${moeda(evento.atributos.valorContabilNovo)}.`,
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
        descricao: `${evento.atributos.tipo}: ${evento.atributos.motivo}`,
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "ENVIO_MANUTENCAO":
      return {
        titulo,
        descricao: `${evento.atributos.tipo} · ${evento.atributos.situacao}`,
        detalhe: evento.atributos.servico ?? "Serviço não informado.",
      };
    case "REVISAO_ORCAMENTO":
      return {
        titulo,
        descricao: `${evento.atributos.descricao} · ${moeda(evento.atributos.valor)}`,
        detalhe: evento.atributos.fornecedor ?? "Fornecedor não informado.",
      };
    case "RETORNO_MANUTENCAO":
      return {
        titulo,
        descricao: `Retorno da manutenção · ${evento.atributos.situacao}`,
        detalhe: evento.atributos.servico ?? "Serviço não informado.",
      };
    case "CONFERENCIA_INVENTARIO":
      return {
        titulo,
        descricao: evento.atributos.situacao ?? "Conferência registrada.",
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
    case "CORRECAO_INVENTARIO":
      return {
        titulo,
        descricao: evento.atributos.tipoCorrecao ?? "Correção registrada.",
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
        descricao:
          evento.atributos.tipoCorrecaoPosterior ??
          "Correção da localização registrada.",
        detalhe: evento.atributos.observacao ?? "Sem observação informada.",
      };
  }
}
