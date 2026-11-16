import { isApiError } from "@/lib/api/core/api-error";
import { formatBrl } from "@/lib/format/decimal";

export const campoReavaliacao =
  "min-h-10 min-w-0 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground transition placeholder:text-muted-foreground focus-visible:border-ring disabled:bg-muted";
export const painelReavaliacao =
  "min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5";

export function formatarDecimal(valor: string | null | undefined): string {
  if (valor == null) return "Não registrado";
  return formatBrl(valor);
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
