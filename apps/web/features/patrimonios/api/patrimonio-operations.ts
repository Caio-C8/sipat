import {
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  STATUS_PATRIMONIO,
  type ListarPatrimoniosQueryInput,
  type ListarPatrimoniosResponse,
  type StatusPatrimonio,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

export type ResumoPatrimonialDashboard = Readonly<{
  total: number;
  porStatus: Readonly<Record<StatusPatrimonio, number>>;
}>;

type OpcoesListagem = Readonly<{
  cookie: string;
  signal?: AbortSignal;
}>;

const CONSULTA_CONTAGEM = {
  pagina: "1",
  limite: "1",
} as const;

export function criarOperacoesPatrimonios(apiClient: ApiClient) {
  async function listar(
    query: ListarPatrimoniosQueryInput,
    { cookie, signal }: OpcoesListagem,
  ): Promise<ListarPatrimoniosResponse> {
    const queryValidada = ListarPatrimoniosQuerySchema.parse(query);

    return apiClient.request({
      path: "/patrimonios",
      method: "GET",
      query: queryValidada,
      headers: { Cookie: cookie },
      cache: "no-store",
      signal,
      responseSchema: ListarPatrimoniosResponseSchema,
    });
  }

  async function obterResumoDashboard(
    cookie: string,
  ): Promise<ResumoPatrimonialDashboard> {
    const [geral, ...respostasPorStatus] = await Promise.all([
      listar(CONSULTA_CONTAGEM, { cookie }),
      ...STATUS_PATRIMONIO.map((status) =>
        listar({ ...CONSULTA_CONTAGEM, status }, { cookie }),
      ),
    ]);

    const porStatus = Object.fromEntries(
      STATUS_PATRIMONIO.map((status, indice) => [
        status,
        respostasPorStatus[indice]!.meta.total,
      ]),
    ) as Record<StatusPatrimonio, number>;

    return {
      total: geral.meta.total,
      porStatus,
    };
  }

  return {
    listar,
    obterResumoDashboard,
  };
}
