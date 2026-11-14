import {
  CatalogoRelatoriosResponseSchema,
  EventosFichaResponseSchema,
  FichaRelatorioParamsSchema,
  FichaResponseSchema,
  OpcaoRelatorioParamsSchema,
  OpcoesRelatorioQuerySchema,
  OpcoesRelatorioResponseSchema,
  RelatorioParamsSchema,
  queryPdfRelatorio,
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
import { apiBinaryRequest } from "../../../lib/api/binary-api-client";

type RequestOptions = Readonly<{
  accessToken: string;
  signal?: AbortSignal;
}>;

type Query = Readonly<Record<string, string | number | boolean | undefined>>;

function pdfFilters(query: Query): Query {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([key]) => key !== "pagina" && key !== "limite",
    ),
  );
}

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
    pdf(
      tipo: TipoTabular,
      query: Query,
      options: RequestOptions,
    ): Promise<Uint8Array> {
      RelatorioParamsSchema.parse({ tipo });
      const parsed = queryPdfRelatorio(tipo).parse(pdfFilters(query));
      return apiBinaryRequest({
        baseUrl,
        path: `/relatorios/${tipo}/pdf`,
        token: options.accessToken,
        signal: options.signal,
        query: parsed,
      });
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
    fichaPdf(
      patrimonioId: string,
      query: Query,
      options: RequestOptions,
    ): Promise<Uint8Array> {
      FichaRelatorioParamsSchema.parse({ patrimonioId });
      const parsed = queryPdfRelatorio("ficha-bem").parse(pdfFilters(query));
      return apiBinaryRequest({
        baseUrl,
        path: `/relatorios/ficha-bem/${patrimonioId}/pdf`,
        token: options.accessToken,
        signal: options.signal,
        query: parsed,
      });
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
