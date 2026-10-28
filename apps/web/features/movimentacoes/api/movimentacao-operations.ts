import {
  CABECALHO_CSRF,
  VALOR_CABECALHO_CSRF,
  CriarMovimentacaoBodySchema,
  CriarMovimentacaoResponseSchema,
  ListarMovimentacoesQuerySchema,
  ListarMovimentacoesResponseSchema,
  MovimentacaoParamsSchema,
  ConsultarMovimentacaoResponseSchema,
  ListarOpcoesMovimentacaoQuerySchema,
  ListarSetoresMovimentacaoResponseSchema,
  ListarComissoesMovimentacaoResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  PatrimonioParamsSchema,
  ConsultarPatrimonioResponseSchema,
  type CriarMovimentacaoBodyInput,
  type ListarMovimentacoesQueryInput,
  type ListarOpcoesMovimentacaoQueryInput,
  type ListarPatrimoniosQueryInput,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";
type Opcoes = { cookie?: string; signal?: AbortSignal };
export function criarOperacoesMovimentacoes(client: ApiClient) {
  const leitura = (opcoes?: Opcoes) => ({
    cache: "no-store" as const,
    signal: opcoes?.signal,
    headers: opcoes?.cookie ? { Cookie: opcoes.cookie } : undefined,
  });
  return {
    listar(query: ListarMovimentacoesQueryInput, opcoes?: Opcoes) {
      return client.request({
        path: "/movimentacoes",
        query: ListarMovimentacoesQuerySchema.parse(query),
        responseSchema: ListarMovimentacoesResponseSchema,
        ...leitura(opcoes),
      });
    },
    consultar(id: string, opcoes?: Opcoes) {
      const { movimentacaoId } = MovimentacaoParamsSchema.parse({
        movimentacaoId: id,
      });
      return client.request({
        path: `/movimentacoes/${movimentacaoId}`,
        responseSchema: ConsultarMovimentacaoResponseSchema,
        ...leitura(opcoes),
      });
    },
    setores(query: ListarOpcoesMovimentacaoQueryInput, opcoes?: Opcoes) {
      return client.request({
        path: "/movimentacoes/opcoes/setores",
        query: ListarOpcoesMovimentacaoQuerySchema.parse(query),
        responseSchema: ListarSetoresMovimentacaoResponseSchema,
        ...leitura(opcoes),
      });
    },
    comissoes(query: ListarOpcoesMovimentacaoQueryInput, opcoes?: Opcoes) {
      return client.request({
        path: "/movimentacoes/opcoes/comissoes",
        query: ListarOpcoesMovimentacaoQuerySchema.parse(query),
        responseSchema: ListarComissoesMovimentacaoResponseSchema,
        ...leitura(opcoes),
      });
    },
    criar(body: CriarMovimentacaoBodyInput) {
      return client.request({
        path: "/movimentacoes",
        method: "POST",
        body: CriarMovimentacaoBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: CriarMovimentacaoResponseSchema,
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
  };
}
