import type * as z from "zod";
import {
  CABECALHO_CSRF,
  VALOR_CABECALHO_CSRF,
  ListarNaturezasQuerySchema,
  ListarNaturezasResponseSchema,
  NaturezaParamsSchema,
  ConsultarNaturezaResponseSchema,
  AlterarNaturezaSchema,
  AlterarNaturezaResponseSchema,
  CriarNaturezaSchema,
  CriarNaturezaResponseSchema,
  ListarEspeciesQuerySchema,
  ListarEspeciesResponseSchema,
  EspecieParamsSchema,
  ConsultarEspecieResponseSchema,
  AlterarEspecieSchema,
  AlterarEspecieResponseSchema,
  CriarEspecieSchema,
  CriarEspecieResponseSchema,
  ListarResponsaveisQuerySchema,
  ListarResponsaveisResponseSchema,
  ResponsavelParamsSchema,
  ConsultarResponsavelResponseSchema,
  AlterarResponsavelSchema,
  AlterarResponsavelResponseSchema,
  CriarResponsavelSchema,
  CriarResponsavelResponseSchema,
  AlterarSituacaoResponsavelSchema,
  AlterarSituacaoResponsavelResponseSchema,
  ListarSetoresQuerySchema,
  ListarSetoresResponseSchema,
  SetorParamsSchema,
  ConsultarSetorResponseSchema,
  AlterarSetorSchema,
  AlterarSetorResponseSchema,
  CriarSetorSchema,
  CriarSetorResponseSchema,
  AlterarSituacaoSetorSchema,
  AlterarSituacaoSetorResponseSchema,
  ListarComissoesQuerySchema,
  ListarComissoesResponseSchema,
  ComissaoParamsSchema,
  ConsultarComissaoResponseSchema,
  AlterarComissaoBodySchema,
  AlterarComissaoResponseSchema,
  CriarComissaoBodySchema,
  CriarComissaoResponseSchema,
  ListarProcessosCompraQuerySchema,
  ListarProcessosCompraResponseSchema,
  ProcessoCompraParamsSchema,
  ConsultarProcessoCompraResponseSchema,
  AlterarProcessoCompraBodySchema,
  AlterarProcessoCompraResponseSchema,
  ListarNotasFiscaisQuerySchema,
  ListarNotasFiscaisResponseSchema,
  NotaFiscalParamsSchema,
  ConsultarNotaFiscalResponseSchema,
  AlterarNotaFiscalBodySchema,
  AlterarNotaFiscalResponseSchema,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";
export type Leitura = { cookie?: string; signal?: AbortSignal };
const leitura = (options?: Leitura) => ({
  cache: "no-store" as const,
  signal: options?.signal,
  headers: options?.cookie ? { Cookie: options.cookie } : undefined,
});
export const csrf = { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF };
export function criarOperacoesCadastros(client: ApiClient) {
  return {
    naturezas: {
      listar(
        query: z.input<typeof ListarNaturezasQuerySchema>,
        options?: Leitura,
      ) {
        return client.request({
          path: "/naturezas",
          query: ListarNaturezasQuerySchema.parse(query),
          responseSchema: ListarNaturezasResponseSchema,
          ...leitura(options),
        });
      },
      consultar(id: string, options?: Leitura) {
        const params = NaturezaParamsSchema.parse({ naturezaId: id });
        return client.request({
          path: `/naturezas/${params.naturezaId}`,
          responseSchema: ConsultarNaturezaResponseSchema,
          ...leitura(options),
        });
      },
      criar(body: z.input<typeof CriarNaturezaSchema>) {
        return client.request({
          path: "/naturezas",
          method: "POST",
          body: CriarNaturezaSchema.parse(body),
          headers: csrf,
          responseSchema: CriarNaturezaResponseSchema,
        });
      },
      alterar(id: string, body: z.input<typeof AlterarNaturezaSchema>) {
        const params = NaturezaParamsSchema.parse({ naturezaId: id });
        return client.request({
          path: `/naturezas/${params.naturezaId}`,
          method: "PATCH",
          body: AlterarNaturezaSchema.parse(body),
          headers: csrf,
          responseSchema: AlterarNaturezaResponseSchema,
        });
      },
    },
    especies: {
      listar(
        query: z.input<typeof ListarEspeciesQuerySchema>,
        options?: Leitura,
      ) {
        return client.request({
          path: "/especies",
          query: ListarEspeciesQuerySchema.parse(query),
          responseSchema: ListarEspeciesResponseSchema,
          ...leitura(options),
        });
      },
      consultar(id: string, options?: Leitura) {
        const params = EspecieParamsSchema.parse({ especieId: id });
        return client.request({
          path: `/especies/${params.especieId}`,
          responseSchema: ConsultarEspecieResponseSchema,
          ...leitura(options),
        });
      },
      criar(body: z.input<typeof CriarEspecieSchema>) {
        return client.request({
          path: "/especies",
          method: "POST",
          body: CriarEspecieSchema.parse(body),
          headers: csrf,
          responseSchema: CriarEspecieResponseSchema,
        });
      },
      alterar(id: string, body: z.input<typeof AlterarEspecieSchema>) {
        const params = EspecieParamsSchema.parse({ especieId: id });
        return client.request({
          path: `/especies/${params.especieId}`,
          method: "PATCH",
          body: AlterarEspecieSchema.parse(body),
          headers: csrf,
          responseSchema: AlterarEspecieResponseSchema,
        });
      },
    },
    responsaveis: {
      listar(
        query: z.input<typeof ListarResponsaveisQuerySchema>,
        options?: Leitura,
      ) {
        return client.request({
          path: "/responsaveis",
          query: ListarResponsaveisQuerySchema.parse(query),
          responseSchema: ListarResponsaveisResponseSchema,
          ...leitura(options),
        });
      },
      consultar(id: string, options?: Leitura) {
        const params = ResponsavelParamsSchema.parse({ responsavelId: id });
        return client.request({
          path: `/responsaveis/${params.responsavelId}`,
          responseSchema: ConsultarResponsavelResponseSchema,
          ...leitura(options),
        });
      },
      criar(body: z.input<typeof CriarResponsavelSchema>) {
        return client.request({
          path: "/responsaveis",
          method: "POST",
          body: CriarResponsavelSchema.parse(body),
          headers: csrf,
          responseSchema: CriarResponsavelResponseSchema,
        });
      },
      alterar(id: string, body: z.input<typeof AlterarResponsavelSchema>) {
        const params = ResponsavelParamsSchema.parse({ responsavelId: id });
        return client.request({
          path: `/responsaveis/${params.responsavelId}`,
          method: "PATCH",
          body: AlterarResponsavelSchema.parse(body),
          headers: csrf,
          responseSchema: AlterarResponsavelResponseSchema,
        });
      },
      situacao(id: string, ativo: boolean) {
        const params = ResponsavelParamsSchema.parse({ responsavelId: id });
        return client.request({
          path: `/responsaveis/${params.responsavelId}/situacao`,
          method: "PATCH",
          body: AlterarSituacaoResponsavelSchema.parse({ ativo }),
          headers: csrf,
          responseSchema: AlterarSituacaoResponsavelResponseSchema,
        });
      },
    },
    setores: {
      listar(
        query: z.input<typeof ListarSetoresQuerySchema>,
        options?: Leitura,
      ) {
        return client.request({
          path: "/setores",
          query: ListarSetoresQuerySchema.parse(query),
          responseSchema: ListarSetoresResponseSchema,
          ...leitura(options),
        });
      },
      consultar(id: string, options?: Leitura) {
        const params = SetorParamsSchema.parse({ setorId: id });
        return client.request({
          path: `/setores/${params.setorId}`,
          responseSchema: ConsultarSetorResponseSchema,
          ...leitura(options),
        });
      },
      criar(body: z.input<typeof CriarSetorSchema>) {
        return client.request({
          path: "/setores",
          method: "POST",
          body: CriarSetorSchema.parse(body),
          headers: csrf,
          responseSchema: CriarSetorResponseSchema,
        });
      },
      alterar(id: string, body: z.input<typeof AlterarSetorSchema>) {
        const params = SetorParamsSchema.parse({ setorId: id });
        return client.request({
          path: `/setores/${params.setorId}`,
          method: "PATCH",
          body: AlterarSetorSchema.parse(body),
          headers: csrf,
          responseSchema: AlterarSetorResponseSchema,
        });
      },
      situacao(id: string, ativo: boolean) {
        const params = SetorParamsSchema.parse({ setorId: id });
        return client.request({
          path: `/setores/${params.setorId}/situacao`,
          method: "PATCH",
          body: AlterarSituacaoSetorSchema.parse({ ativo }),
          headers: csrf,
          responseSchema: AlterarSituacaoSetorResponseSchema,
        });
      },
    },
    comissoes: {
      listar(
        query: z.input<typeof ListarComissoesQuerySchema>,
        options?: Leitura,
      ) {
        return client.request({
          path: "/comissoes",
          query: ListarComissoesQuerySchema.parse(query),
          responseSchema: ListarComissoesResponseSchema,
          ...leitura(options),
        });
      },
      consultar(id: string, options?: Leitura) {
        const params = ComissaoParamsSchema.parse({ comissaoId: id });
        return client.request({
          path: `/comissoes/${params.comissaoId}`,
          responseSchema: ConsultarComissaoResponseSchema,
          ...leitura(options),
        });
      },
      criar(body: z.input<typeof CriarComissaoBodySchema>) {
        return client.request({
          path: "/comissoes",
          method: "POST",
          body: CriarComissaoBodySchema.parse(body),
          headers: csrf,
          responseSchema: CriarComissaoResponseSchema,
        });
      },
      alterar(id: string, body: z.input<typeof AlterarComissaoBodySchema>) {
        const params = ComissaoParamsSchema.parse({ comissaoId: id });
        return client.request({
          path: `/comissoes/${params.comissaoId}`,
          method: "PATCH",
          body: AlterarComissaoBodySchema.parse(body),
          headers: csrf,
          responseSchema: AlterarComissaoResponseSchema,
        });
      },
    },
    processos: {
      listar(
        query: z.input<typeof ListarProcessosCompraQuerySchema>,
        options?: Leitura,
      ) {
        return client.request({
          path: "/processos-compra",
          query: ListarProcessosCompraQuerySchema.parse(query),
          responseSchema: ListarProcessosCompraResponseSchema,
          ...leitura(options),
        });
      },
      consultar(id: string, options?: Leitura) {
        const params = ProcessoCompraParamsSchema.parse({
          processoCompraId: id,
        });
        return client.request({
          path: `/processos-compra/${params.processoCompraId}`,
          responseSchema: ConsultarProcessoCompraResponseSchema,
          ...leitura(options),
        });
      },

      alterar(
        id: string,
        body: z.input<typeof AlterarProcessoCompraBodySchema>,
      ) {
        const params = ProcessoCompraParamsSchema.parse({
          processoCompraId: id,
        });
        return client.request({
          path: `/processos-compra/${params.processoCompraId}`,
          method: "PATCH",
          body: AlterarProcessoCompraBodySchema.parse(body),
          headers: csrf,
          responseSchema: AlterarProcessoCompraResponseSchema,
        });
      },
    },
    notas: {
      listar(
        query: z.input<typeof ListarNotasFiscaisQuerySchema>,
        options?: Leitura,
      ) {
        return client.request({
          path: "/notas-fiscais",
          query: ListarNotasFiscaisQuerySchema.parse(query),
          responseSchema: ListarNotasFiscaisResponseSchema,
          ...leitura(options),
        });
      },
      consultar(id: string, options?: Leitura) {
        const params = NotaFiscalParamsSchema.parse({ notaFiscalId: id });
        return client.request({
          path: `/notas-fiscais/${params.notaFiscalId}`,
          responseSchema: ConsultarNotaFiscalResponseSchema,
          ...leitura(options),
        });
      },

      alterar(id: string, body: z.input<typeof AlterarNotaFiscalBodySchema>) {
        const params = NotaFiscalParamsSchema.parse({ notaFiscalId: id });
        return client.request({
          path: `/notas-fiscais/${params.notaFiscalId}`,
          method: "PATCH",
          body: AlterarNotaFiscalBodySchema.parse(body),
          headers: csrf,
          responseSchema: AlterarNotaFiscalResponseSchema,
        });
      },
    },
  };
}
