import {
  ConcluirSetorInventarioResponseSchema,
  ConsultarInventarioResponseSchema,
  CorrigirItemInventarioBodySchema,
  CorrigirItemInventarioResponseSchema,
  IniciarSetorInventarioResponseSchema,
  InventarioParamsSchema,
  ItemInventarioParamsSchema,
  ListarItensInventarioQuerySchema,
  ListarItensInventarioResponseSchema,
  ListarInventariosQuerySchema,
  ListarInventariosResponseSchema,
  ListarSetoresInventarioQuerySchema,
  ListarSetoresInventarioResponseSchema,
  SetorInventarioParamsSchema,
  VerificarItemInventarioBodySchema,
  VerificarItemInventarioResponseSchema,
  type CorrigirItemInventarioBodyData,
  type InventarioDetalhe,
  type ItemInventarioResponse,
  type ListarItensInventarioQueryInput,
  type ListarItensInventarioResponse,
  type ListarInventariosQueryInput,
  type ListarInventariosResponse,
  type ListarSetoresInventarioQueryInput,
  type ListarSetoresInventarioResponse,
  type SetorInventarioResumo,
  type VerificarItemInventarioResultado,
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

  async function listarItens(
    inventarioId: string,
    input: ListarItensInventarioQueryInput,
    options: RequestOptions,
  ): Promise<ListarItensInventarioResponse> {
    const params = InventarioParamsSchema.parse({ inventarioId });
    const query = ListarItensInventarioQuerySchema.parse(input);
    return apiRequest({
      baseUrl,
      path: `/inventarios/${encodeURIComponent(params.inventarioId)}/itens?${queryString(
        {
          pagina: query.pagina,
          limite: query.limite,
          busca: query.busca,
          setorInventarioId: query.setorInventarioId,
          contextoSetor: query.contextoSetor,
          statusVerificacao: query.statusVerificacao,
          situacao: query.situacao,
          statusCorrecao: query.statusCorrecao,
        },
      )}`,
      method: "GET",
      token: options.accessToken,
      responseSchema: ListarItensInventarioResponseSchema,
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

    listarItens,

    async consultarItem(
      inventarioId: string,
      itemInventarioId: string,
      options: RequestOptions,
    ): Promise<ItemInventarioResponse | null> {
      const params = ItemInventarioParamsSchema.parse({
        inventarioId,
        itemInventarioId,
      });
      let pagina = 1;
      let ultimaPagina = 1;
      do {
        const response = await listarItens(
          params.inventarioId,
          { pagina: String(pagina), limite: "50" },
          options,
        );
        const item = response.dados.find(
          (candidate) => candidate.id === params.itemInventarioId,
        );
        if (item) return item;
        ultimaPagina = response.meta.ultimaPagina;
        pagina += 1;
      } while (pagina <= ultimaPagina);
      return null;
    },

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

    async verificarItem(
      inventarioId: string,
      setorInventarioId: string,
      numeroPatrimonial: string,
      options: RequestOptions,
    ): Promise<VerificarItemInventarioResultado> {
      const params = SetorInventarioParamsSchema.parse({
        inventarioId,
        setorInventarioId,
      });
      const body = VerificarItemInventarioBodySchema.parse({
        numeroPatrimonial,
      });
      const response = await apiRequest({
        baseUrl,
        path: `/inventarios/${encodeURIComponent(params.inventarioId)}/setores/${encodeURIComponent(params.setorInventarioId)}/verificacoes`,
        method: "POST",
        body,
        token: options.accessToken,
        responseSchema: VerificarItemInventarioResponseSchema,
        signal: options.signal,
      });
      return response.dados;
    },

    async corrigirItem(
      inventarioId: string,
      itemInventarioId: string,
      input: CorrigirItemInventarioBodyData,
      options: RequestOptions,
    ): Promise<ItemInventarioResponse> {
      const params = ItemInventarioParamsSchema.parse({
        inventarioId,
        itemInventarioId,
      });
      const body = CorrigirItemInventarioBodySchema.parse(input);
      const response = await apiRequest({
        baseUrl,
        path: `/inventarios/${encodeURIComponent(params.inventarioId)}/itens/${encodeURIComponent(params.itemInventarioId)}/correcoes`,
        method: "POST",
        body,
        token: options.accessToken,
        responseSchema: CorrigirItemInventarioResponseSchema,
        signal: options.signal,
      });
      return response.dados;
    },

    async concluirSetor(
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
        path: `/inventarios/${encodeURIComponent(params.inventarioId)}/setores/${encodeURIComponent(params.setorInventarioId)}/concluir`,
        method: "POST",
        body: {},
        token: options.accessToken,
        responseSchema: ConcluirSetorInventarioResponseSchema,
        signal: options.signal,
      });
      return response.dados;
    },
  };
}

export type InventariosOperations = ReturnType<
  typeof createInventariosOperations
>;
