import {
  BaixarPatrimonioDadosSchema,
  BaixarPatrimonioResponseSchema,
  CABECALHO_CSRF,
  ConsultarPatrimonioResponseSchema,
  CriarPatrimonioBodySchema,
  CriarPatrimonioResponseSchema,
  ListarEspeciesQuerySchema,
  ListarEspeciesResponseSchema,
  ListarOpcoesComissoesBaixaQuerySchema,
  ListarOpcoesComissoesBaixaResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  ListarProcessosCompraQuerySchema,
  ListarProcessosCompraResponseSchema,
  ListarSetoresQuerySchema,
  ListarSetoresResponseSchema,
  PatrimonioParamsSchema,
  STATUS_PATRIMONIO,
  SubstituirNumeroPatrimonialBodySchema,
  SubstituirNumeroPatrimonialResponseSchema,
  VALOR_CABECALHO_CSRF,
  type BaixarPatrimonioDadosInput,
  DashboardPatrimonialResponseSchema,
  type ListarPatrimoniosQueryInput,
  type ListarProcessosCompraQueryInput,
  type ListarSetoresQueryInput,
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
    especies(query: ListarEspeciesQueryInput, signal?: AbortSignal) {
      return apiClient.request({
        path: "/especies",
        method: "GET",
        query: ListarEspeciesQuerySchema.parse(query),
        cache: "no-store",
        signal,
        responseSchema: ListarEspeciesResponseSchema,
      });
    },
    setores(query: ListarSetoresQueryInput, signal?: AbortSignal) {
      return apiClient.request({
        path: "/setores",
        method: "GET",
        query: ListarSetoresQuerySchema.parse(query),
        cache: "no-store",
        signal,
        responseSchema: ListarSetoresResponseSchema,
      });
    },
    processosCompra(
      query: ListarProcessosCompraQueryInput,
      signal?: AbortSignal,
    ) {
      return apiClient.request({
        path: "/processos-compra",
        method: "GET",
        query: ListarProcessosCompraQuerySchema.parse(query),
        cache: "no-store",
        signal,
        responseSchema: ListarProcessosCompraResponseSchema,
      });
    },
    criar(body: CriarPatrimonioBodyInput) {
      return apiClient.request({
        path: "/patrimonios",
        method: "POST",
        body: CriarPatrimonioBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: CriarPatrimonioResponseSchema,
      });
    },
    consultar,
    listarOpcoesComissoesBaixa,
    baixar,
    substituirNumero,
    obterResumoDashboard,
  };
}
