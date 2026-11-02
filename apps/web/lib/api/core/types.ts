export type MetodoHttp = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ValorQuery = string | number | boolean | undefined;

export type ApiQuery = Readonly<Record<string, ValorQuery>>;

type ResultadosSchema<TOutput> =
  | {
      success: true;
      data: TOutput;
    }
  | {
      success: false;
      error: unknown;
    };

export interface RuntimeSchema<TOutput> {
  safeParse(value: unknown): ResultadosSchema<TOutput>;
}

export type ApiRequestOptions<TResponse = void> = {
  path: string;
  method?: MetodoHttp;
  query?: ApiQuery;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
  cache?: RequestCache;
  responseSchema?: RuntimeSchema<TResponse>;
  responseType?: "json" | "pdf";
};

export interface ApiClient {
  request<TResponse = void>(
    options: ApiRequestOptions<TResponse>,
  ): Promise<TResponse>;
}

export type CreateApiClientOptions = {
  baseUrl: string;
  defaultHeaders?: HeadersInit;
  defaultTimeoutMs?: number;
  fetchImplementation?: typeof fetch;
};
