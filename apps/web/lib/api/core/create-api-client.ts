import { RespostaErroSchema } from "@repo/contracts";
import { ApiError } from "./api-error";
import type {
  ApiClient,
  ApiQuery,
  ApiRequestOptions,
  CreateApiClientOptions,
  RuntimeSchema,
} from "./types";

const TIMEOUT_PADRAO_MS = 30_000;

type ControleAbort = {
  signal: AbortSignal;
  timeoutSignal: AbortSignal;
};

function validarTimeoutMs(timeoutMs: number): void {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new ApiError({
      status: null,
      codigo: "TIMEOUT_API_INVALIDO",
      mensagem: "O timeout da API deve ser um inteiro positivo.",
      categoria: "configuracao",
    });
  }
}

function criarControleAbort(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): ControleAbort {
  validarTimeoutMs(timeoutMs);

  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  return {
    timeoutSignal,
    signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
  };
}

function erroFoiTimeout(
  error: unknown,
  signal: AbortSignal,
  timeoutSignal: AbortSignal,
): boolean {
  return (
    timeoutSignal.aborted &&
    (signal.reason === timeoutSignal.reason ||
      (error instanceof Error && error.name === "TimeoutError"))
  );
}

type LeituraCorpo =
  | {
      tipo: "vazio";
    }
  | {
      tipo: "json";
      valor: unknown;
    }
  | {
      tipo: "json_invalido";
    };

function normalizarBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function validarPath(path: string): void {
  const pathInvalido =
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("?") ||
    path.includes("#") ||
    path.split("/").includes("..");

  if (pathInvalido) {
    throw new ApiError({
      status: null,
      codigo: "PATH_API_INVALIDO",
      mensagem: "O caminho informado para a API é inválido.",
      categoria: "configuracao",
    });
  }
}

function adicionarQuery(url: string, query: ApiQuery | undefined): string {
  if (!query) {
    return url;
  }

  const searchParams = new URLSearchParams();

  const entries = Object.entries(query).sort(([chaveA], [chaveB]) =>
    chaveA.localeCompare(chaveB),
  );

  for (const [chave, valor] of entries) {
    if (valor === undefined) {
      continue;
    }

    searchParams.set(chave, String(valor));
  }

  const queryString = searchParams.toString();

  return queryString.length > 0 ? `${url}?${queryString}` : url;
}

function criarUrl(
  baseUrl: string,
  path: string,
  query: ApiQuery | undefined,
): string {
  validarPath(path);

  const url = `${normalizarBaseUrl(baseUrl)}${path}`;

  return adicionarQuery(url, query);
}

function criarHeaders(
  defaultHeaders: HeadersInit | undefined,
  requestHeaders: HeadersInit | undefined,
  possuiBody: boolean,
  multipart: boolean,
): Headers {
  const headers = new Headers(defaultHeaders);

  const headersDaRequisicao = new Headers(requestHeaders);

  headersDaRequisicao.forEach((valor, chave) => {
    headers.set(chave, valor);
  });

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (multipart) {
    headers.delete("Content-Type");
  } else if (possuiBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function lerCorpo(response: Response): Promise<LeituraCorpo> {
  const texto = await response.text();

  if (texto.trim().length === 0) {
    return {
      tipo: "vazio",
    };
  }

  try {
    return {
      tipo: "json",
      valor: JSON.parse(texto) as unknown,
    };
  } catch {
    return {
      tipo: "json_invalido",
    };
  }
}

function obterRequisicaoId(response: Response): string | undefined {
  return response.headers.get("X-Request-Id") ?? undefined;
}

function criarErroRespostaInvalida({
  response,
  codigo,
  mensagem,
  requisicaoId,
  cause,
}: {
  response: Response;
  codigo: string;
  mensagem: string;
  requisicaoId?: string;
  cause?: unknown;
}): ApiError {
  return new ApiError({
    status: response.status,
    codigo,
    mensagem,
    categoria: "resposta_invalida",
    requisicaoId: requisicaoId ?? obterRequisicaoId(response),
    cause,
  });
}

function possuiStatus(value: unknown): value is {
  status: number;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof value.status === "number"
  );
}

function validarResponse<TResponse>({
  response,
  schema,
  value,
}: {
  response: Response;
  schema: RuntimeSchema<TResponse>;
  value: unknown;
}): TResponse {
  const resultado = schema.safeParse(value);

  if (!resultado.success) {
    throw criarErroRespostaInvalida({
      response,
      codigo: "CONTRATO_RESPOSTA_INVALIDO",
      mensagem: "A API retornou uma resposta em formato inesperado.",
      cause: resultado.error,
    });
  }

  if (
    possuiStatus(resultado.data) &&
    resultado.data.status !== response.status
  ) {
    throw criarErroRespostaInvalida({
      response,
      codigo: "STATUS_RESPOSTA_INCONSISTENTE",
      mensagem:
        "A API retornou um status incompatível com o corpo da resposta.",
    });
  }

  return resultado.data;
}

function criarErroHttp(response: Response, leitura: LeituraCorpo): ApiError {
  const requisicaoIdHeader = obterRequisicaoId(response);

  if (leitura.tipo !== "json") {
    return criarErroRespostaInvalida({
      response,
      codigo: "RESPOSTA_ERRO_INVALIDA",
      mensagem: "A API retornou um erro em formato inesperado.",
      requisicaoId: requisicaoIdHeader,
    });
  }

  const resultado = RespostaErroSchema.safeParse(leitura.valor);

  if (!resultado.success) {
    return criarErroRespostaInvalida({
      response,
      codigo: "CONTRATO_ERRO_INVALIDO",
      mensagem: "A API retornou um erro em formato inesperado.",
      requisicaoId: requisicaoIdHeader,
      cause: resultado.error,
    });
  }

  if (resultado.data.status !== response.status) {
    return criarErroRespostaInvalida({
      response,
      codigo: "STATUS_ERRO_INCONSISTENTE",
      mensagem: "A API retornou um status incompatível com o corpo do erro.",
      requisicaoId: resultado.data.requisicaoId ?? requisicaoIdHeader,
    });
  }

  return new ApiError({
    status: response.status,
    codigo: resultado.data.codigo,
    mensagem: resultado.data.mensagem,
    categoria: "http",
    erros: resultado.data.erros,
    requisicaoId: resultado.data.requisicaoId,
  });
}

function erroFoiCancelamento(error: unknown, signal: AbortSignal): boolean {
  return (
    signal.aborted || (error instanceof Error && error.name === "AbortError")
  );
}

export function createApiClient({
  baseUrl,
  defaultHeaders,
  defaultTimeoutMs = TIMEOUT_PADRAO_MS,
  fetchImplementation = fetch,
}: CreateApiClientOptions): ApiClient {
  validarTimeoutMs(defaultTimeoutMs);

  return {
    async request<TResponse = void>({
      path,
      method = "GET",
      query,
      body,
      headers: requestHeaders,
      signal,
      timeoutMs = defaultTimeoutMs,
      cache,
      responseSchema,
    }: ApiRequestOptions<TResponse>): Promise<TResponse> {
      if (method === "GET" && body !== undefined) {
        throw new ApiError({
          status: null,
          codigo: "BODY_GET_NAO_PERMITIDO",
          mensagem: "Uma requisição GET não pode possuir body.",
          categoria: "configuracao",
        });
      }

      const url = criarUrl(baseUrl, path, query);
      const possuiBody = body !== undefined;
      const multipart = body instanceof FormData;

      const headers = criarHeaders(
        defaultHeaders,
        requestHeaders,
        possuiBody,
        multipart,
      );

      let bodySerializado: BodyInit | undefined;

      const controleAbort = criarControleAbort(signal, timeoutMs);

      if (possuiBody) {
        try {
          if (multipart) {
            bodySerializado = body;
          } else {
            const resultadoSerializacao = JSON.stringify(body);

            if (resultadoSerializacao === undefined) {
              throw new TypeError(
                "O body não possui uma representação JSON válida.",
              );
            }

            bodySerializado = resultadoSerializacao;
          }
        } catch (error: unknown) {
          throw new ApiError({
            status: null,
            codigo: "BODY_NAO_SERIALIZAVEL",
            mensagem: "Não foi possível preparar os dados da requisição.",
            categoria: "configuracao",
            cause: error,
          });
        }
      }

      let response: Response;
      let leitura: LeituraCorpo;

      try {
        response = await fetchImplementation(url, {
          method,
          headers,
          body: bodySerializado,
          signal: controleAbort.signal,
          cache,
        });

        leitura = await lerCorpo(response);
      } catch (error: unknown) {
        if (
          erroFoiTimeout(
            error,
            controleAbort.signal,
            controleAbort.timeoutSignal,
          )
        ) {
          throw new ApiError({
            status: null,
            codigo: "TEMPO_LIMITE_EXCEDIDO",
            mensagem:
              "O serviço demorou mais do que o esperado para responder.",
            categoria: "timeout",
            cause: error,
          });
        }

        if (erroFoiCancelamento(error, controleAbort.signal)) {
          throw new ApiError({
            status: null,
            codigo: "REQUISICAO_CANCELADA",
            mensagem: "A requisição foi cancelada.",
            categoria: "cancelada",
            cause: error,
          });
        }

        throw new ApiError({
          status: null,
          codigo: "API_INDISPONIVEL",
          mensagem: "Não foi possível conectar com o serviço.",
          categoria: "rede",
          cause: error,
        });
      }

      if (!response.ok) {
        throw criarErroHttp(response, leitura);
      }

      if (response.status === 204) {
        if (responseSchema !== undefined) {
          throw criarErroRespostaInvalida({
            response,
            codigo: "CORPO_RESPOSTA_AUSENTE",
            mensagem: "A API não retornou o corpo esperado.",
          });
        }

        return undefined as TResponse;
      }

      if (leitura.tipo !== "json") {
        throw criarErroRespostaInvalida({
          response,
          codigo: "RESPOSTA_JSON_INVALIDA",
          mensagem: "A API retornou uma resposta em formato inesperado.",
        });
      }

      if (responseSchema === undefined) {
        throw criarErroRespostaInvalida({
          response,
          codigo: "SCHEMA_RESPOSTA_AUSENTE",
          mensagem: "A resposta recebida não possui um contrato configurado.",
        });
      }

      return validarResponse({
        response,
        schema: responseSchema,
        value: leitura.valor,
      });
    },
  };
}
