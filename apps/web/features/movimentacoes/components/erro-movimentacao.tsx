import Link from "next/link";
import { isApiError } from "@/lib/api/core/api-error";
import { mensagemMovimentacao } from "../presentation";
export function ErroMovimentacao({ erro }: { erro: unknown }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <p>
        {isApiError(erro) && erro.status === 401
          ? "Sua sessão expirou. Entre novamente para continuar."
          : isApiError(erro) && erro.status === 403
            ? "Você não tem permissão para esta operação."
            : mensagemMovimentacao(erro)}
      </p>
      {isApiError(erro) && erro.status === 401 ? (
        <Link href="/login" className="mt-2 inline-block underline">
          Entrar novamente
        </Link>
      ) : null}
    </div>
  );
}
