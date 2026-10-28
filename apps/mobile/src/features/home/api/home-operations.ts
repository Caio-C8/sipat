import {
  ListarInventariosQuerySchema,
  ListarInventariosResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  ListarSetoresQuerySchema,
  ListarSetoresResponseSchema,
  type InventarioResumo,
  type ListarInventariosResponse,
} from "@repo/contracts";
import { apiRequest } from "../../../lib/api/api-client";

type RequestOptions = Readonly<{
  accessToken: string;
  signal?: AbortSignal;
}>;

export type InventariosHome = Readonly<{
  total: number;
  pendentes: number;
  emAndamento: number;
  finalizados: number;
  maisRecente: InventarioResumo | null;
  emAndamentoMaisRecente: InventarioResumo | null;
  finalizadoMaisRecente: InventarioResumo | null;
}>;

function queryString(query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, value);
  }
  return params.toString();
}

export function createHomeOperations(baseUrl: string) {
  async function listarInventarios(
    status: "PENDENTE" | "EM_ANDAMENTO" | "FINALIZADO" | undefined,
    { accessToken, signal }: RequestOptions,
    pagina = 1,
    limite = 1,
  ): Promise<ListarInventariosResponse> {
    const query = ListarInventariosQuerySchema.parse({
      pagina: String(pagina),
      limite: String(limite),
      status,
    });
    return apiRequest({
      baseUrl,
      path: `/inventarios?${queryString({
        pagina: String(query.pagina),
        limite: String(query.limite),
        status: query.status,
      })}`,
      method: "GET",
      token: accessToken,
      responseSchema: ListarInventariosResponseSchema,
      signal,
    });
  }

  async function listarInventariosFinalizados(options: RequestOptions) {
    const primeiraPagina = await listarInventarios(
      "FINALIZADO",
      options,
      1,
      50,
    );
    const inventarios = [...primeiraPagina.dados];
    for (let pagina = 2; pagina <= primeiraPagina.meta.ultimaPagina; pagina++) {
      const response = await listarInventarios(
        "FINALIZADO",
        options,
        pagina,
        50,
      );
      inventarios.push(...response.dados);
    }
    const maisRecente = inventarios.reduce<InventarioResumo | null>(
      (current, inventory) => {
        if (!current) return inventory;
        return (inventory.dataFim ?? "") > (current.dataFim ?? "")
          ? inventory
          : current;
      },
      null,
    );
    return { total: primeiraPagina.meta.total, maisRecente };
  }

  return {
    async contarSetores(options: RequestOptions) {
      const query = ListarSetoresQuerySchema.parse({
        pagina: "1",
        limite: "1",
      });
      const response = await apiRequest({
        baseUrl,
        path: `/setores?${queryString({
          pagina: String(query.pagina),
          limite: String(query.limite),
        })}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ListarSetoresResponseSchema,
        signal: options.signal,
      });
      return response.meta.total;
    },

    async contarPatrimonios(options: RequestOptions) {
      const query = ListarPatrimoniosQuerySchema.parse({
        pagina: "1",
        limite: "1",
      });
      const response = await apiRequest({
        baseUrl,
        path: `/patrimonios?${queryString({
          pagina: String(query.pagina),
          limite: String(query.limite),
        })}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ListarPatrimoniosResponseSchema,
        signal: options.signal,
      });
      return response.meta.total;
    },

    async obterInventarios(options: RequestOptions): Promise<InventariosHome> {
      const [todos, pendentes, emAndamento, finalizados] = await Promise.all([
        listarInventarios(undefined, options),
        listarInventarios("PENDENTE", options),
        listarInventarios("EM_ANDAMENTO", options),
        listarInventariosFinalizados(options),
      ]);

      return {
        total: todos.meta.total,
        pendentes: pendentes.meta.total,
        emAndamento: emAndamento.meta.total,
        finalizados: finalizados.total,
        maisRecente: todos.dados[0] ?? null,
        emAndamentoMaisRecente: emAndamento.dados[0] ?? null,
        finalizadoMaisRecente: finalizados.maisRecente,
      };
    },
  };
}

export type HomeOperations = ReturnType<typeof createHomeOperations>;
