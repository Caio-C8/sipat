import {
  ConsultarProcessoCompraResponseSchema,
  CriarPatrimonioBodySchema,
  CriarPatrimonioResponseSchema,
  ListarEspeciesQuerySchema,
  ListarEspeciesResponseSchema,
  ListarProcessosCompraQuerySchema,
  ListarProcessosCompraResponseSchema,
  ListarSetoresQuerySchema,
  ListarSetoresResponseSchema,
  ProcessoCompraParamsSchema,
  type CriarPatrimonioBodyInput,
} from "@repo/contracts";
import { apiRequest } from "../../../lib/api/api-client";

type RequestOptions = Readonly<{ accessToken: string; signal?: AbortSignal }>;
type PageInput = Readonly<{ page?: number; search?: string }>;

function queryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function createCreatePatrimonioOperations(baseUrl: string) {
  return {
    async listSectors(input: PageInput, options: RequestOptions) {
      const query = ListarSetoresQuerySchema.parse({
        pagina: String(input.page ?? 1),
        limite: "20",
        busca: input.search || undefined,
        ativo: "true",
      });
      return apiRequest({
        baseUrl,
        path: `/setores?${queryString({ pagina: query.pagina, limite: query.limite, busca: query.busca, ativo: String(query.ativo) })}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ListarSetoresResponseSchema,
        signal: options.signal,
      });
    },
    async listSpecies(input: PageInput, options: RequestOptions) {
      const query = ListarEspeciesQuerySchema.parse({
        pagina: String(input.page ?? 1),
        limite: "20",
        busca: input.search || undefined,
      });
      return apiRequest({
        baseUrl,
        path: `/especies?${queryString({ pagina: query.pagina, limite: query.limite, busca: query.busca })}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ListarEspeciesResponseSchema,
        signal: options.signal,
      });
    },
    async listPurchaseProcesses(input: PageInput, options: RequestOptions) {
      const query = ListarProcessosCompraQuerySchema.parse({
        pagina: String(input.page ?? 1),
        limite: "20",
        busca: input.search || undefined,
      });
      return apiRequest({
        baseUrl,
        path: `/processos-compra?${queryString({ pagina: query.pagina, limite: query.limite, busca: query.busca })}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ListarProcessosCompraResponseSchema,
        signal: options.signal,
      });
    },
    async getPurchaseProcess(id: string, options: RequestOptions) {
      const params = ProcessoCompraParamsSchema.parse({ processoCompraId: id });
      const response = await apiRequest({
        baseUrl,
        path: `/processos-compra/${encodeURIComponent(params.processoCompraId)}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ConsultarProcessoCompraResponseSchema,
        signal: options.signal,
      });
      return response.dados;
    },
    async create(body: CriarPatrimonioBodyInput, options: RequestOptions) {
      const response = await apiRequest({
        baseUrl,
        path: "/patrimonios",
        method: "POST",
        token: options.accessToken,
        body: CriarPatrimonioBodySchema.parse(body),
        responseSchema: CriarPatrimonioResponseSchema,
        signal: options.signal,
      });
      return response.dados;
    },
  };
}

export type CreatePatrimonioOperations = ReturnType<
  typeof createCreatePatrimonioOperations
>;
