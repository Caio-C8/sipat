import { isApiError } from "@/lib/api/core/api-error";

export const campoReavaliacao =
  "min-h-10 min-w-0 w-full rounded-md border border-[#b8c7d9] bg-white px-3 py-2 text-sm text-[#19355d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2860eb] disabled:bg-[#eef2f7]";
export const painelReavaliacao =
  "min-w-0 rounded-lg border border-[#dce4ef] bg-white p-4 sm:p-5";

export function formatarDecimal(valor: string | null | undefined): string {
  if (valor == null) return "Não registrado";
  const [inteiro, fracao = ""] = valor.split(".");
  const agrupado = inteiro!.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${agrupado},${fracao.padEnd(2, "0")}`;
}

export function formatarDataCivil(valor: string | null | undefined): string {
  if (!valor) return "Não registrada";
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function mensagemReavaliacao(erro: unknown): string {
  if (isApiError(erro)) {
    if (erro.status === 401) return "Sua sessão expirou. Entre novamente.";
    if (erro.status === 403)
      return "Você não tem permissão para esta operação.";
    return erro.message;
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}
