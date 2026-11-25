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
  return formatarInstanteBaixa(valor);
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
    if (erro.codigo === "PATRIMONIO_EM_INVENTARIO_ABERTO")
      return "Este patrimônio participa de um inventário ainda não finalizado. Finalize o inventário antes de registrar a baixa.";
    if (erro.codigo === "BAIXA_JA_EXISTENTE")
      return "Este patrimônio já possui uma baixa registrada. Atualize a ficha para consultar a situação atual.";
    if (erro.codigo === "PATRIMONIO_NAO_ATIVO")
      return "Somente patrimônios ativos podem ser baixados. Atualize a ficha e confira a situação atual.";
    if (erro.status === 409)
      return `${erro.message} Atualize a ficha do patrimônio antes de tentar novamente.`;
    return erro.message;
  }
  return "Não foi possível confirmar o resultado. Releia o patrimônio antes de tentar novamente.";
}
