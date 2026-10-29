import {
  ConsultarInventarioResponseSchema,
  IniciarSetorInventarioResponseSchema,
  InventarioParamsSchema,
  ListarInventariosQuerySchema,
  ListarInventariosResponseSchema,
  ListarSetoresInventarioQuerySchema,
  ListarSetoresInventarioResponseSchema,
  SetorInventarioParamsSchema,
  type InventarioDetalhe,
  type ListarInventariosQueryInput,
  type ListarInventariosResponse,
  type ListarSetoresInventarioQueryInput,
  type ListarSetoresInventarioResponse,
  type SetorInventarioResumo,
} from "@repo/contracts";
import { apiRequest } from "../../../lib/api/api-client";

type RequestOptions = Readonly<{
  accessToken: string;
  signal?: AbortSignal;
}>;

function queryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

export function createInventariosOperations(baseUrl: string) {
  async function listarSetores(
    inventarioId: string,
    input: ListarSetoresInventarioQueryInput,
    options: RequestOptions,
  ): Promise<ListarSetoresInventarioResponse> {
    const params = InventarioParamsSchema.parse({ inventarioId });
    const query = ListarSetoresInventarioQuerySchema.parse(input);
    return apiRequest({
      baseUrl,
      path: `/inventarios/${encodeURIComponent(params.inventarioId)}/setores?${queryString(
        {
          pagina: query.pagina,
          limite: query.limite,
          busca: query.busca,
          status: query.status,
        },
      )}`,
      method: "GET",
      token: options.accessToken,
      responseSchema: ListarSetoresInventarioResponseSchema,
      signal: options.signal,
    });
  }

  return {
    async listar(
      input: ListarInventariosQueryInput,
      options: RequestOptions,
    ): Promise<ListarInventariosResponse> {
      const query = ListarInventariosQuerySchema.parse(input);
      return apiRequest({
        baseUrl,
        path: `/inventarios?${queryString({
          pagina: query.pagina,
          limite: query.limite,
          busca: query.busca,
          status: query.status,
        })}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ListarInventariosResponseSchema,
        signal: options.signal,
      });
    },

    async consultar(
      inventarioId: string,
      options: RequestOptions,
    ): Promise<InventarioDetalhe> {
      const params = InventarioParamsSchema.parse({ inventarioId });
      const response = await apiRequest({
        baseUrl,
        path: `/inventarios/${encodeURIComponent(params.inventarioId)}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ConsultarInventarioResponseSchema,
        signal: options.signal,
      });
      return response.dados;
    },

    listarSetores,

    async consultarSetor(
      inventarioId: string,
      setorInventarioId: string,
      options: RequestOptions,
    ): Promise<SetorInventarioResumo | null> {
      const params = SetorInventarioParamsSchema.parse({
        inventarioId,
        setorInventarioId,
      });
      let pagina = 1;
      let ultimaPagina = 1;
      do {
        const response = await listarSetores(
          params.inventarioId,
          { pagina: String(pagina), limite: "50" },
          options,
        );
        const setor = response.dados.find(
          (item) => item.id === params.setorInventarioId,
        );
        if (setor) return setor;
        ultimaPagina = response.meta.ultimaPagina;
        pagina += 1;
      } while (pagina <= ultimaPagina);
      return null;
    },

    async iniciarSetor(
      inventarioId: string,
      setorInventarioId: string,
      options: RequestOptions,
    ): Promise<SetorInventarioResumo> {
      const params = SetorInventarioParamsSchema.parse({
        inventarioId,
        setorInventarioId,
      });
      const response = await apiRequest({
        baseUrl,
        path: `/inventarios/${encodeURIComponent(params.inventarioId)}/setores/${encodeURIComponent(params.setorInventarioId)}/iniciar`,
        method: "POST",
        body: {},
        token: options.accessToken,
        responseSchema: IniciarSetorInventarioResponseSchema,
        signal: options.signal,
      });
      return response.dados;
    },
  };
}

export type InventariosOperations = ReturnType<
  typeof createInventariosOperations
>;
