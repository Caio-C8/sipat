import { isApiError } from "@/lib/api/core/api-error";
import { formatBrl } from "@/lib/format/decimal";

export const campoManutencao =
  "min-h-10 min-w-0 w-full rounded-md border border-[#cfd9e7] bg-white px-3 py-2 text-sm text-[#19355d] shadow-[0_1px_1px_rgba(22,48,82,0.02)] transition placeholder:text-[#93a3b8] hover:border-[#aebed2] focus-visible:border-[#D4A017] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D4A017] aria-invalid:border-red-500 aria-invalid:focus-visible:outline-red-600 disabled:bg-[#eef2f7] disabled:text-[#7b8ba1]";

export const painelManutencao =
  "min-w-0 rounded-lg border border-[#dce4ef] bg-white p-4 shadow-[0_1px_2px_rgba(22,48,82,0.03)] sm:p-5";

export function formatarDataCivil(valor: string | null | undefined): string {
  if (!valor) return "Não informada";
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarMoeda(valor: string | null | undefined): string {
  if (valor == null) return "Não informado";
  return formatBrl(valor);
}

export function rotuloStatusManutencao(status: "EM_ANDAMENTO" | "CONCLUIDA") {
  return status === "CONCLUIDA" ? "Concluída" : "Em andamento";
}

export function classeStatusManutencao(
  status: "EM_ANDAMENTO" | "CONCLUIDA",
): string {
  return status === "CONCLUIDA"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

export function mensagemManutencao(erro: unknown): string {
  if (typeof erro === "string") return erro;
  if (isApiError(erro)) {
    if (erro.status === 401)
      return "Sua sessão expirou. Entre novamente para continuar.";
    if (erro.status === 403)
      return "Você não tem permissão para esta operação.";
    if (erro.categoria === "timeout" || erro.categoria === "rede")
      return "Não foi possível confirmar o resultado. Consulte o pedido antes de reenviar.";
    return erro.erros.length
      ? erro.erros.map((item) => `${item.campo}: ${item.mensagem}`).join(" ")
      : erro.message;
  }
  return "Não foi possível concluir a operação. Confira os dados e tente novamente.";
}
