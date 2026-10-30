import Link from "next/link";
import { isApiError } from "@/lib/api/core/api-error";
import { mensagemReavaliacao } from "../presentation";

export function ErroReavaliacao({ erro }: { erro: unknown }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <p>{mensagemReavaliacao(erro)}</p>
      {isApiError(erro) && erro.status === 401 ? (
        <Link href="/login" className="mt-2 inline-block underline">
          Entrar novamente
        </Link>
      ) : null}
    </div>
  );
}
