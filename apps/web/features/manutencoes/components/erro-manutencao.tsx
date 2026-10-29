import Link from "next/link";
import { isApiError } from "@/lib/api/core/api-error";

export function mensagemErroManutencao(erro: unknown): string {
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

export function ErroManutencao({ erro }: { erro: unknown }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900"
    >
      <p>{mensagemErroManutencao(erro)}</p>
      {isApiError(erro) && erro.status === 401 ? (
        <Link href="/login" className="underline">
          Entrar novamente
        </Link>
      ) : null}
    </div>
  );
}
