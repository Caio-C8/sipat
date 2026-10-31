import {
  CABECALHO_CSRF,
  VALOR_CABECALHO_CSRF,
  CriarEmprestimoBodySchema,
  CriarEmprestimoResponseSchema,
  RegistrarDevolucaoEmprestimoBodySchema,
  RegistrarDevolucaoEmprestimoResponseSchema,
  EmprestimoParamsSchema,
  ConsultarEmprestimoResponseSchema,
  ListarEmprestimosQuerySchema,
  ListarEmprestimosResponseSchema,
  ListarOpcoesPatrimoniosEmprestimoQuerySchema,
  ListarOpcoesPatrimoniosEmprestimoResponseSchema,
  ListarOpcoesComissoesEmprestimoQuerySchema,
  ListarOpcoesComissoesEmprestimoResponseSchema,
  type CriarEmprestimoBodyInput,
  type RegistrarDevolucaoEmprestimoBodyInput,
  type ListarEmprestimosQueryInput,
  type ListarOpcoesPatrimoniosEmprestimoQueryInput,
  type ListarOpcoesComissoesEmprestimoQueryInput,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

type Opcoes = { cookie?: string; signal?: AbortSignal };

export function criarOperacoesEmprestimos(client: ApiClient) {
  const leitura = (opcoes?: Opcoes) => ({
    cache: "no-store" as const,
    signal: opcoes?.signal,
    headers: opcoes?.cookie ? { Cookie: opcoes.cookie } : undefined,
  });
  return {
    listar(query: ListarEmprestimosQueryInput, opcoes?: Opcoes) {
      return client.request({
        path: "/emprestimos",
        query: ListarEmprestimosQuerySchema.parse(query),
        responseSchema: ListarEmprestimosResponseSchema,
        ...leitura(opcoes),
      });
    },
    consultar(id: string, opcoes?: Opcoes) {
      const { emprestimoId } = EmprestimoParamsSchema.parse({
        emprestimoId: id,
      });
      return client.request({
        path: `/emprestimos/${emprestimoId}`,
        responseSchema: ConsultarEmprestimoResponseSchema,
        ...leitura(opcoes),
      });
    },
    patrimonios(
      query: ListarOpcoesPatrimoniosEmprestimoQueryInput,
      opcoes?: Opcoes,
    ) {
      return client.request({
        path: "/emprestimos/opcoes/patrimonios",
        query: ListarOpcoesPatrimoniosEmprestimoQuerySchema.parse(query),
        responseSchema: ListarOpcoesPatrimoniosEmprestimoResponseSchema,
        ...leitura(opcoes),
      });
    },
    comissoes(
      query: ListarOpcoesComissoesEmprestimoQueryInput,
      opcoes?: Opcoes,
    ) {
      return client.request({
        path: "/emprestimos/opcoes/comissoes",
        query: ListarOpcoesComissoesEmprestimoQuerySchema.parse(query),
        responseSchema: ListarOpcoesComissoesEmprestimoResponseSchema,
        ...leitura(opcoes),
      });
    },
    criar(body: CriarEmprestimoBodyInput) {
      return client.request({
        path: "/emprestimos",
        method: "POST",
        body: CriarEmprestimoBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: CriarEmprestimoResponseSchema,
      });
    },
    devolver(id: string, body: RegistrarDevolucaoEmprestimoBodyInput) {
      const { emprestimoId } = EmprestimoParamsSchema.parse({
        emprestimoId: id,
      });
      return client.request({
        path: `/emprestimos/${emprestimoId}/devolucoes`,
        method: "POST",
        body: RegistrarDevolucaoEmprestimoBodySchema.parse(body),
        headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
        responseSchema: RegistrarDevolucaoEmprestimoResponseSchema,
      });
    },
  };
}
