import {
  BaixarPatrimonioDadosSchema,
  BaixarPatrimonioResponseSchema,
  CABECALHO_CSRF,
  ConsultarPatrimonioResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  PatrimonioParamsSchema,
  ListarOpcoesComissoesBaixaQuerySchema,
  ListarOpcoesComissoesBaixaResponseSchema,
  SubstituirNumeroPatrimonialBodySchema,
  SubstituirNumeroPatrimonialResponseSchema,
  VALOR_CABECALHO_CSRF,
  type BaixarPatrimonioDadosInput,
  DashboardPatrimonialResponseSchema,
  type ListarPatrimoniosQueryInput,
  type ListarPatrimoniosResponse,
  type ResumoPatrimonialDashboard,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

export type { ResumoPatrimonialDashboard } from "@repo/contracts";

type OpcoesListagem = Readonly<{
  cookie?: string;
  signal?: AbortSignal;
}>;

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
      headers: cookie ? { Cookie: cookie } : undefined,
      cache: "no-store",
      signal,
      responseSchema: ListarPatrimoniosResponseSchema,
    });
  }

  async function obterResumoDashboard(
    cookie: string,
  ): Promise<ResumoPatrimonialDashboard> {
    const resposta = await apiClient.request({
      path: "/patrimonios/dashboard",
      method: "GET",
      headers: { Cookie: cookie },
      cache: "no-store",
      responseSchema: DashboardPatrimonialResponseSchema,
    });
    return resposta.dados;
  }

  async function consultar(
    patrimonioId: string,
    { cookie, signal }: OpcoesListagem,
  ) {
    const params = PatrimonioParamsSchema.parse({ patrimonioId });
    return apiClient.request({
      path: `/patrimonios/${params.patrimonioId}`,
      method: "GET",
      headers: cookie ? { Cookie: cookie } : undefined,
      cache: "no-store",
      signal,
      responseSchema: ConsultarPatrimonioResponseSchema,
    });
  }

  function listarOpcoesComissoesBaixa(
    patrimonioId: string,
    query: unknown,
    signal?: AbortSignal,
  ) {
    const params = PatrimonioParamsSchema.parse({ patrimonioId });
    return apiClient.request({
      path: `/patrimonios/${params.patrimonioId}/baixa/opcoes/comissoes`,
      method: "GET",
      query: ListarOpcoesComissoesBaixaQuerySchema.parse(query),
      cache: "no-store",
      signal,
      responseSchema: ListarOpcoesComissoesBaixaResponseSchema,
    });
  }

  function baixar(
    patrimonioId: string,
    dados: BaixarPatrimonioDadosInput,
    documento?: File,
  ) {
    const params = PatrimonioParamsSchema.parse({ patrimonioId });
    const form = new FormData();
    form.append(
      "dados",
      JSON.stringify(BaixarPatrimonioDadosSchema.parse(dados)),
    );
    if (documento) form.append("documento", documento);
    return apiClient.request({
      path: `/patrimonios/${params.patrimonioId}/baixa`,
      method: "POST",
      body: form,
      headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
      responseSchema: BaixarPatrimonioResponseSchema,
    });
  }

  function substituirNumero(
    patrimonioId: string,
    numeroPatrimonioAtual: string,
  ) {
    const params = PatrimonioParamsSchema.parse({ patrimonioId });
    return apiClient.request({
      path: `/patrimonios/${params.patrimonioId}/substituicoes-numero`,
      method: "POST",
      body: SubstituirNumeroPatrimonialBodySchema.parse({
        numeroPatrimonioAtual,
      }),
      headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
      responseSchema: SubstituirNumeroPatrimonialResponseSchema,
    });
  }

  return {
    listar,
    consultar,
    listarOpcoesComissoesBaixa,
    baixar,
    substituirNumero,
    obterResumoDashboard,
  };
}
