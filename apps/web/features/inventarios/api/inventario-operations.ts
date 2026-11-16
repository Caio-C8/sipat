import {
  CABECALHO_CSRF,
  VALOR_CABECALHO_CSRF,
  CriarInventarioBodySchema,
  CriarInventarioResponseSchema,
  CorrigirItemInventarioBodySchema,
  CorrigirItemInventarioResponseSchema,
  EditarInventarioBodySchema,
  EditarInventarioResponseSchema,
  FinalizarInventarioBodySchema,
  FinalizarInventarioResponseSchema,
  InventarioParamsSchema,
  ItemInventarioParamsSchema,
  ListarInventariosQuerySchema,
  ListarInventariosResponseSchema,
  ListarItensInventarioQuerySchema,
  ListarItensInventarioResponseSchema,
  ConsultarInventarioResponseSchema,
  type CriarInventarioBodyInput,
  type CorrigirItemInventarioBodyData,
  type EditarInventarioBodyInput,
  type FinalizarInventarioBodyData,
  type ListarInventariosQueryInput,
  type ListarItensInventarioQueryInput,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

type Opcoes = { cookie?: string; signal?: AbortSignal };

export function criarOperacoesInventarios(client: ApiClient) {
  const leitura = (opcoes?: Opcoes) => ({
    cache: "no-store" as const,
    signal: opcoes?.signal,
    headers: opcoes?.cookie ? { Cookie: opcoes.cookie } : undefined,
  });
  return {
    listar(query: ListarInventariosQueryInput, opcoes?: Opcoes) {
      return client.request({
        path: "/inventarios",
        query: ListarInventariosQuerySchema.parse(query),
        responseSchema: ListarInventariosResponseSchema,
        ...leitura(opcoes),
      });
    },
    consultar(id: string, opcoes?: Opcoes) {
      const { inventarioId } = InventarioParamsSchema.parse({
        inventarioId: id,
      });
      return client.request({
        path: `/inventarios/${inventarioId}`,
        responseSchema: ConsultarInventarioResponseSchema,
        ...leitura(opcoes),
      });
    },
    itens(id: string, query: ListarItensInventarioQueryInput, opcoes?: Opcoes) {
      const { inventarioId } = InventarioParamsSchema.parse({
        inventarioId: id,
      });
      return client.request({
        path: `/inventarios/${inventarioId}/itens`,
        query: ListarItensInventarioQuerySchema.parse(query),
        responseSchema: ListarItensInventarioResponseSchema,
        ...leitura(opcoes),
      });
    },
    criar(body: CriarInventarioBodyInput) {
      return client.request({
        path: "/inventarios",
        method: "POST",
        body: CriarInventarioBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: CriarInventarioResponseSchema,
      });
    },
    editar(id: string, body: EditarInventarioBodyInput) {
      const { inventarioId } = InventarioParamsSchema.parse({
        inventarioId: id,
      });
      return client.request({
        path: `/inventarios/${inventarioId}`,
        method: "PATCH",
        body: EditarInventarioBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: EditarInventarioResponseSchema,
      });
    },
    finalizar(id: string, body: FinalizarInventarioBodyData) {
      const { inventarioId } = InventarioParamsSchema.parse({
        inventarioId: id,
      });
      return client.request({
        path: `/inventarios/${inventarioId}/finalizar`,
        method: "POST",
        body: FinalizarInventarioBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: FinalizarInventarioResponseSchema,
      });
    },
    corrigir(
      inventarioId: string,
      itemInventarioId: string,
      body: CorrigirItemInventarioBodyData,
    ) {
      const params = ItemInventarioParamsSchema.parse({
        inventarioId,
        itemInventarioId,
      });
      return client.request({
        path: `/inventarios/${params.inventarioId}/itens/${params.itemInventarioId}/correcoes`,
        method: "POST",
        body: CorrigirItemInventarioBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: CorrigirItemInventarioResponseSchema,
      });
    },
  };
}
