import { isApiError } from "@/lib/api/core/api-error";
import { decidirAposFalha } from "@/lib/api/core/idempotencia";
export const campoMovimentacao =
  "min-h-10 min-w-0 w-full rounded-md border border-[#cfd9e7] bg-white px-3 py-2 text-sm text-[#19355d] shadow-[0_1px_1px_rgba(22,48,82,0.02)] transition placeholder:text-[#93a3b8] hover:border-[#aebed2] focus-visible:border-[#2860eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2860eb] disabled:bg-[#eef2f7]";
export const painelMovimentacao =
  "min-w-0 rounded-lg border border-[#dce4ef] bg-white p-4 shadow-[0_1px_2px_rgba(22,48,82,0.03)] sm:p-5";
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "short",
});
export function formatarDataMovimentacao(valor: string) {
  return dataHora.format(new Date(valor));
}
export function mensagemMovimentacao(erro: unknown) {
  return isApiError(erro)
    ? erro.message
    : "Não foi possível concluir a operação. Tente novamente.";
}
export function resultadoDesconhecido(
  erro: unknown,
  recuperando = false,
): boolean {
  if (
    recuperando &&
    isApiError(erro) &&
    (erro.status === 401 || erro.status === 403)
  ) {
    return true;
  }
  return decidirAposFalha(erro).manterChave;
}
