import type { ErroCampo } from "@repo/contracts";

export type CategoriaApiError =
  | "http"
  | "rede"
  | "timeout"
  | "cancelada"
  | "validacao"
  | "resposta_invalida"
  | "configuracao";

type ApiErrorParams = {
  status: number | null;
  codigo: string;
  mensagem: string;
  categoria: CategoriaApiError;
  erros?: ErroCampo[];
  requisicaoId?: string;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly status: number | null;
  readonly codigo: string;
  readonly categoria: CategoriaApiError;
  readonly erros: ErroCampo[];
  readonly requisicaoId?: string;

  constructor({
    status,
    codigo,
    mensagem,
    categoria,
    erros = [],
    requisicaoId,
    cause,
  }: ApiErrorParams) {
    super(
      mensagem,
      cause === undefined
        ? undefined
        : {
            cause,
          },
    );

    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
    this.categoria = categoria;
    this.erros = erros;
    this.requisicaoId = requisicaoId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
