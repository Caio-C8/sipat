import Link from "next/link";
import { isApiError } from "@/lib/api/core/api-error";
import { mensagemMovimentacao } from "../presentation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export function ErroMovimentacao({ erro }: { erro: unknown }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Não foi possível continuar</AlertTitle>
      <AlertDescription>
        <p>
          {isApiError(erro) && erro.status === 401
            ? "Sua sessão expirou. Entre novamente para continuar."
            : isApiError(erro) && erro.status === 403
              ? "Você não tem permissão para esta operação."
              : mensagemMovimentacao(erro)}
        </p>
        {isApiError(erro) && erro.status === 401 ? (
          <Button asChild variant="outline" className="mt-2">
            <Link href="/login">Entrar novamente</Link>
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
