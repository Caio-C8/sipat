import { isApiError } from "@/lib/api/core/api-error";

export const rotulosTipoBaixa: Record<string, string> = {
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
};

export function formatarDataBaixa(valor: string) {
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
}

export function formatarInstanteBaixa(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

export function mensagemErroBaixa(erro: unknown) {
  if (isApiError(erro)) {
    if (erro.status === 409)
      return `${erro.message} Releia o patrimônio antes de tentar novamente.`;
    return erro.message;
  }
  return "Não foi possível confirmar o resultado. Releia o patrimônio antes de tentar novamente.";
}
