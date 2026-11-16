import { isApiError } from "@/lib/api/core/api-error";
import { decidirAposFalha } from "@/lib/api/core/idempotencia";
export const campoMovimentacao =
  "min-h-10 min-w-0 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground transition placeholder:text-muted-foreground focus-visible:border-ring disabled:bg-muted";
export const painelMovimentacao =
  "min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5";
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
