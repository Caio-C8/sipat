import { isApiError } from "../../../lib/api/api-error";

export type FieldErrors = Readonly<Record<string, string>>;

export function mapZodErrors(
  error: Readonly<{
    issues: readonly Readonly<{
      path: readonly PropertyKey[];
      message: string;
    }>[];
  }>,
): FieldErrors {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export function mapApiFieldErrors(error: unknown): FieldErrors {
  if (!isApiError(error)) return {};
  const errors: Record<string, string> = {};
  for (const issue of error.fieldErrors) {
    if (errors[issue.campo] === undefined) errors[issue.campo] = issue.mensagem;
  }
  return errors;
}

export function authErrorMessage(error: unknown) {
  if (!isApiError(error))
    return "Não foi possível concluir a operação. Tente novamente.";
  if (error.status === 429) {
    const wait = error.retryAfterSeconds;
    return wait
      ? `Muitas tentativas. Aguarde ${wait} segundos e tente novamente.`
      : "Muitas tentativas. Aguarde e tente novamente.";
  }
  if (error.kind === "network")
    return "Sem conexão com o SIPAT. Verifique a rede e tente novamente.";
  if (error.kind === "timeout")
    return "O SIPAT demorou para responder. Tente novamente.";
  if (error.status === 401 || error.code === "CREDENCIAIS_INVALIDAS")
    return "E-mail ou senha inválidos.";
  if (error.status === 403) return "Sua sessão não permite esta operação.";
  return "Não foi possível concluir a operação. Tente novamente.";
}

export function passwordRecoveryErrorMessage(error: unknown) {
  if (!isApiError(error))
    return "Não foi possível enviar a solicitação. Tente novamente.";
  if (error.status === 429) {
    const wait = error.retryAfterSeconds;
    return wait
      ? `Muitas solicitações. Aguarde ${wait} segundos e tente novamente.`
      : "Muitas solicitações. Aguarde e tente novamente.";
  }
  if (error.kind === "network")
    return "Sem conexão com o SIPAT. Verifique a rede e tente novamente.";
  if (error.kind === "timeout")
    return "O SIPAT demorou para responder. Tente novamente.";
  if (error.kind === "invalid-response")
    return "Não foi possível concluir a solicitação. Tente novamente mais tarde.";
  if (error.status !== undefined && error.status >= 500)
    return "O serviço de recuperação está indisponível. Tente novamente mais tarde.";
  return "Não foi possível enviar a solicitação. Tente novamente.";
}
