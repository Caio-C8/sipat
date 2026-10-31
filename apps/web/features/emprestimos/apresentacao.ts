import { isApiError } from "@/lib/api/core/api-error";

export const painelEmprestimo =
  "min-w-0 rounded-xl border border-[#dce5f0] bg-white p-4 shadow-sm sm:p-6";
export const campoEmprestimo =
  "w-full rounded-md border border-[#b8c8db] bg-white px-3 py-2 text-[#19355d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#225aa5]";

export function mensagemEmprestimo(erro: unknown): string {
  if (isApiError(erro)) {
    if (erro.status === 401) return "A sessão expirou. Entre novamente.";
    if (erro.status === 403) return "Seu perfil não permite esta operação.";
    return erro.message;
  }
  return "Não foi possível concluir a operação. Confira a conexão e tente novamente.";
}
export function hojeSaoPaulo(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const obter = (tipo: string) => partes.find((p) => p.type === tipo)!.value;
  return `${obter("year")}-${obter("month")}-${obter("day")}`;
}
export function dataExibicao(iso: string | null): string {
  if (!iso) return "Não informado";
  const dia = iso.slice(0, 10);
  return `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}`;
}
