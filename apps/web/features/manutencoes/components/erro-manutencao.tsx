import Link from "next/link";
import { isApiError } from "@/lib/api/core/api-error";
import { mensagemManutencao } from "../apresentacao";

export function mensagemErroManutencao(erro: unknown): string {
  return mensagemManutencao(erro);
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
