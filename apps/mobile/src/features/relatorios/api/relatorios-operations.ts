import {
  CatalogoRelatoriosResponseSchema,
  EventosFichaResponseSchema,
  FichaRelatorioParamsSchema,
  FichaResponseSchema,
  OpcaoRelatorioParamsSchema,
  OpcoesRelatorioQuerySchema,
  OpcoesRelatorioResponseSchema,
  RelatorioParamsSchema,
  queryRelatorio,
  respostasTabulares,
  type CatalogoOpcaoRelatorio,
  type CatalogoRelatoriosResponse,
  type EventosFichaResponse,
  type FichaResponse,
  type OpcoesRelatorioResponse,
  type RelatorioTabularResponse,
  type TipoRelatorio,
  type TipoTabular,
} from "@repo/contracts";
import { apiRequest } from "../../../lib/api/api-client";

type RequestOptions = Readonly<{
  accessToken: string;
  signal?: AbortSignal;
}>;

type Query = Readonly<Record<string, string | number | boolean | undefined>>;

export function createRelatoriosOperations(baseUrl: string) {
  const get = <T>(
    path: string,
    responseSchema: Parameters<typeof apiRequest<T>>[0]["responseSchema"],
    options: RequestOptions,
    query?: Query,
  ) =>
    apiRequest<T>({
      baseUrl,
      path,
      method: "GET",
      token: options.accessToken,
      responseSchema,
      signal: options.signal,
      query,
    });

  return {
    catalogo(options: RequestOptions): Promise<CatalogoRelatoriosResponse> {
      return get("/relatorios", CatalogoRelatoriosResponseSchema, options);
    },
    consultar(
      tipo: TipoTabular,
      query: Query,
      options: RequestOptions,
    ): Promise<RelatorioTabularResponse> {
      RelatorioParamsSchema.parse({ tipo });
      const parsed = queryRelatorio(tipo).parse(query);
      const responseSchema = respostasTabulares[tipo] as unknown as Readonly<{
        safeParse(
          value: unknown,
        ):
          | Readonly<{ success: true; data: RelatorioTabularResponse }>
          | Readonly<{ success: false }>;
      }>;
      return get(
        `/relatorios/${tipo}`,
        responseSchema,
        options,
        parsed,
      ) as Promise<RelatorioTabularResponse>;
    },
    ficha(
      patrimonioId: string,
      options: RequestOptions,
    ): Promise<FichaResponse> {
      FichaRelatorioParamsSchema.parse({ patrimonioId });
      return get(
        `/relatorios/ficha-bem/${patrimonioId}`,
        FichaResponseSchema,
        options,
      );
    },
    eventos(
      patrimonioId: string,
      query: Query,
      options: RequestOptions,
    ): Promise<EventosFichaResponse> {
      FichaRelatorioParamsSchema.parse({ patrimonioId });
      const parsed = queryRelatorio("ficha-bem").parse(query);
      return get(
        `/relatorios/ficha-bem/${patrimonioId}/eventos`,
        EventosFichaResponseSchema,
        options,
        parsed,
      );
    },
    opcoes(
      catalogo: CatalogoOpcaoRelatorio,
      tipo: TipoRelatorio,
      busca: string,
      pagina: number,
      options: RequestOptions,
    ): Promise<OpcoesRelatorioResponse> {
      OpcaoRelatorioParamsSchema.parse({ catalogo });
      const query = OpcoesRelatorioQuerySchema.parse({
        tipo,
        ...(busca.trim() ? { busca: busca.trim() } : {}),
        pagina: String(pagina),
      });
      return get(
        `/relatorios/opcoes/${catalogo}`,
        OpcoesRelatorioResponseSchema,
        options,
        query,
      );
    },
  };
}

export type RelatoriosOperations = ReturnType<
  typeof createRelatoriosOperations
>;
