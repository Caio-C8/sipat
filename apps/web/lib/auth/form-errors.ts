import type { ZodError } from "zod";
import { isApiError } from "@/lib/api/core/api-error";

export type ErrosFormulario = Readonly<Record<string, string>>;

export function mapearErrosZod(error: ZodError): ErrosFormulario {
  const erros: Record<string, string> = {};

  for (const issue of error.issues) {
    const campo = issue.path[0];

    if (typeof campo === "string" && erros[campo] === undefined) {
      erros[campo] = issue.message;
    }
  }

  return erros;
}

export function mapearErrosApi(error: unknown): ErrosFormulario {
  if (!isApiError(error)) {
    return {};
  }

  const erros: Record<string, string> = {};

  for (const erro of error.erros) {
    if (erros[erro.campo] === undefined) {
      erros[erro.campo] = erro.mensagem;
    }
  }

  return erros;
}

export function mensagemGeralAuth(error: unknown): string {
  if (!isApiError(error)) {
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  if (error.status === 429) {
    return "Muitas tentativas foram realizadas. Aguarde e tente novamente.";
  }

  if (error.categoria === "rede" || error.categoria === "timeout") {
    return "O SIPAT está temporariamente indisponível. Tente novamente em instantes.";
  }

  if (error.status === 401 || error.codigo === "CREDENCIAIS_INVALIDAS") {
    return "E-mail ou senha inválidos.";
  }

  return error.message;
}
