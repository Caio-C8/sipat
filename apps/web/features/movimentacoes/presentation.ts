import { isApiError } from "@/lib/api/core/api-error";
export const campoMovimentacao =
  "min-h-10 min-w-0 w-full rounded-md border border-[#b8c7d9] bg-white px-3 py-2 text-sm text-[#19355d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2860eb] disabled:bg-[#eef2f7]";
export const painelMovimentacao =
  "min-w-0 rounded-lg border border-[#dce4ef] bg-white p-4 sm:p-5";
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
  if (!isApiError(erro)) return true;
  if (recuperando && (erro.status === 401 || erro.status === 403)) return true;
  return (
    erro.status === null ||
    erro.status >= 500 ||
    ["resposta_invalida", "rede", "timeout"].includes(erro.categoria) ||
    [
      "MOVIMENTACAO_EM_PROCESSAMENTO",
      "CONFLITO_CONCORRENTE_MOVIMENTACAO",
    ].includes(erro.codigo)
  );
}
