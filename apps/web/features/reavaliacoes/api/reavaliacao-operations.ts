import {
  CABECALHO_CSRF,
  VALOR_CABECALHO_CSRF,
  CriarReavaliacaoBodySchema,
  CriarReavaliacaoResponseSchema,
  ConsultarPatrimonioResponseSchema,
  ConsultarReavaliacaoResponseSchema,
  ListarOpcoesComissaoReavaliacaoQuerySchema,
  ListarOpcoesComissaoReavaliacaoResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  ListarReavaliacoesQuerySchema,
  ListarReavaliacoesResponseSchema,
  PatrimonioParamsSchema,
  PreviaReavaliacaoBodySchema,
  PreviaReavaliacaoResponseSchema,
  ReavaliacaoParamsSchema,
  type CriarReavaliacaoBodyInput,
  type ListarOpcoesComissaoReavaliacaoQueryInput,
  type ListarPatrimoniosQueryInput,
  type ListarReavaliacoesQueryInput,
  type PreviaReavaliacaoBodyInput,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

type Opcoes = { cookie?: string; signal?: AbortSignal };

export function criarOperacoesReavaliacoes(client: ApiClient) {
  const leitura = (opcoes?: Opcoes) => ({
    cache: "no-store" as const,
    signal: opcoes?.signal,
    headers: opcoes?.cookie ? { Cookie: opcoes.cookie } : undefined,
  });
  return {
    listar(query: ListarReavaliacoesQueryInput, opcoes?: Opcoes) {
      return client.request({
        path: "/reavaliacoes",
        query: ListarReavaliacoesQuerySchema.parse(query),
        responseSchema: ListarReavaliacoesResponseSchema,
        ...leitura(opcoes),
      });
    },
    consultar(id: string, opcoes?: Opcoes) {
      const { reavaliacaoId } = ReavaliacaoParamsSchema.parse({
        reavaliacaoId: id,
      });
      return client.request({
        path: `/reavaliacoes/${reavaliacaoId}`,
        responseSchema: ConsultarReavaliacaoResponseSchema,
        ...leitura(opcoes),
      });
    },
    comissoes(
      query: ListarOpcoesComissaoReavaliacaoQueryInput,
      opcoes?: Opcoes,
    ) {
      return client.request({
        path: "/reavaliacoes/opcoes/comissoes",
        query: ListarOpcoesComissaoReavaliacaoQuerySchema.parse(query),
        responseSchema: ListarOpcoesComissaoReavaliacaoResponseSchema,
        ...leitura(opcoes),
      });
    },
    patrimonios(query: ListarPatrimoniosQueryInput, opcoes?: Opcoes) {
      return client.request({
        path: "/patrimonios",
        query: ListarPatrimoniosQuerySchema.parse(query),
        responseSchema: ListarPatrimoniosResponseSchema,
        ...leitura(opcoes),
      });
    },
    patrimonio(id: string, opcoes?: Opcoes) {
      const { patrimonioId } = PatrimonioParamsSchema.parse({
        patrimonioId: id,
      });
      return client.request({
        path: `/patrimonios/${patrimonioId}`,
        responseSchema: ConsultarPatrimonioResponseSchema,
        ...leitura(opcoes),
      });
    },
    previa(body: PreviaReavaliacaoBodyInput) {
      return client.request({
        path: "/reavaliacoes/previa",
        method: "POST",
        body: PreviaReavaliacaoBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: PreviaReavaliacaoResponseSchema,
      });
    },
    criar(body: CriarReavaliacaoBodyInput) {
      return client.request({
        path: "/reavaliacoes",
        method: "POST",
        body: CriarReavaliacaoBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: CriarReavaliacaoResponseSchema,
      });
    },
  };
}
