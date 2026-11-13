import { isApiError } from "@/lib/api/core/api-error";

export const painelEmprestimo =
  "min-w-0 rounded-xl border border-[#e1e7ef] bg-white p-4 shadow-sm sm:p-6";
export const campoEmprestimo =
  "mt-1.5 w-full min-h-10 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-[#19355d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#225aa5]";
export const botaoPrimarioEmprestimo =
  "bg-[#213f66] text-white hover:bg-[#172f50]";

export function identificacaoEmprestimo(id: string): string {
  return `Empréstimo ${id.slice(0, 8)}`;
}

export function situacaoEmprestimo(item: {
  situacao: "EM_ANDAMENTO" | "CONCLUIDO";
  emAtraso: boolean;
}) {
  if (item.situacao === "CONCLUIDO")
    return { texto: "Concluído", classe: "bg-emerald-50 text-emerald-800" };
  if (item.emAtraso)
    return { texto: "Em atraso", classe: "bg-amber-50 text-amber-900" };
  return { texto: "Em andamento", classe: "bg-blue-50 text-blue-800" };
}

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
