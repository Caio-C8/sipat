import {
  AtualizarOrcamentoManutencaoBodySchema,
  AtualizarOrcamentoManutencaoResponseSchema,
  CABECALHO_CSRF,
  ConsultarManutencaoResponseSchema,
  CriarManutencaoBodySchema,
  CriarManutencaoResponseSchema,
  DadosDocumentoManutencaoSchema,
  EnviarDocumentoManutencaoResponseSchema,
  ItemManutencaoParamsSchema,
  ListarComissoesManutencaoQuerySchema,
  ListarComissoesManutencaoResponseSchema,
  ListarFornecedoresManutencaoQuerySchema,
  ListarFornecedoresManutencaoResponseSchema,
  ListarManutencoesQuerySchema,
  ListarManutencoesResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  ManutencaoParamsSchema,
  RegistrarRetornoManutencaoBodySchema,
  RegistrarRetornoManutencaoResponseSchema,
  VALOR_CABECALHO_CSRF,
  type CriarManutencaoBodyInput,
  type DadosDocumentoManutencao,
  type ListarManutencoesQueryInput,
  type ListarPatrimoniosQueryInput,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

type Leitura = { cookie?: string; signal?: AbortSignal };
const leitura = (opcoes?: Leitura) => ({
  cache: "no-store" as const,
  signal: opcoes?.signal,
  headers: opcoes?.cookie ? { Cookie: opcoes.cookie } : undefined,
});
const mutacao = { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF };

export function criarOperacoesManutencoes(client: ApiClient) {
  return {
    listar(query: ListarManutencoesQueryInput, opcoes?: Leitura) {
      return client.request({
        path: "/manutencoes",
        query: ListarManutencoesQuerySchema.parse(query),
        responseSchema: ListarManutencoesResponseSchema,
        ...leitura(opcoes),
      });
    },
    consultar(id: string, opcoes?: Leitura) {
      const { manutencaoId } = ManutencaoParamsSchema.parse({
        manutencaoId: id,
      });
      return client.request({
        path: `/manutencoes/${manutencaoId}`,
        responseSchema: ConsultarManutencaoResponseSchema,
        ...leitura(opcoes),
      });
    },
    fornecedores(
      query: { busca?: string; pagina?: string; limite?: string },
      opcoes?: Leitura,
    ) {
      return client.request({
        path: "/manutencoes/opcoes/fornecedores",
        query: ListarFornecedoresManutencaoQuerySchema.parse(query),
        responseSchema: ListarFornecedoresManutencaoResponseSchema,
        ...leitura(opcoes),
      });
    },
    comissoes(
      query: {
        dataEnvio: string;
        busca?: string;
        pagina?: string;
        limite?: string;
      },
      opcoes?: Leitura,
    ) {
      return client.request({
        path: "/manutencoes/opcoes/comissoes",
        query: ListarComissoesManutencaoQuerySchema.parse(query),
        responseSchema: ListarComissoesManutencaoResponseSchema,
        ...leitura(opcoes),
      });
    },
    patrimonios(query: ListarPatrimoniosQueryInput, opcoes?: Leitura) {
      return client.request({
        path: "/patrimonios",
        query: ListarPatrimoniosQuerySchema.parse(query),
        responseSchema: ListarPatrimoniosResponseSchema,
        ...leitura(opcoes),
      });
    },
    criar(body: CriarManutencaoBodyInput) {
      return client.request({
        path: "/manutencoes",
        method: "POST",
        body: CriarManutencaoBodySchema.parse(body),
        headers: mutacao,
        responseSchema: CriarManutencaoResponseSchema,
      });
    },
    atualizarOrcamento(pedidoId: string, itemId: string, body: unknown) {
      const ids = ItemManutencaoParamsSchema.parse({
        manutencaoId: pedidoId,
        itemId,
      });
      return client.request({
        path: `/manutencoes/${ids.manutencaoId}/itens/${ids.itemId}/orcamento`,
        method: "PATCH",
        body: AtualizarOrcamentoManutencaoBodySchema.parse(body),
        headers: mutacao,
        responseSchema: AtualizarOrcamentoManutencaoResponseSchema,
      });
    },
    registrarRetorno(pedidoId: string, itemId: string, body: unknown) {
      const ids = ItemManutencaoParamsSchema.parse({
        manutencaoId: pedidoId,
        itemId,
      });
      return client.request({
        path: `/manutencoes/${ids.manutencaoId}/itens/${ids.itemId}/retorno`,
        method: "POST",
        body: RegistrarRetornoManutencaoBodySchema.parse(body),
        headers: mutacao,
        responseSchema: RegistrarRetornoManutencaoResponseSchema,
      });
    },
    enviarDocumento(
      pedidoId: string,
      dados: DadosDocumentoManutencao,
      arquivo: File,
    ) {
      const { manutencaoId } = ManutencaoParamsSchema.parse({
        manutencaoId: pedidoId,
      });
      const form = new FormData();
      form.append(
        "dados",
        JSON.stringify(DadosDocumentoManutencaoSchema.parse(dados)),
      );
      form.append("documento", arquivo);
      return client.request({
        path: `/manutencoes/${manutencaoId}/documentos`,
        method: "POST",
        body: form,
        headers: mutacao,
        responseSchema: EnviarDocumentoManutencaoResponseSchema,
      });
    },
  };
}
