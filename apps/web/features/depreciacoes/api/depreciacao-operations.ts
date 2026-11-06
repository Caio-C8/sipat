import {
  CABECALHO_CSRF,
  VALOR_CABECALHO_CSRF,
  ExecutarDepreciacaoPatrimonioBodySchema,
  ExecutarDepreciacaoPatrimonioResponseSchema,
  ExecutarDepreciacoesEmMassaBodySchema,
  ExecutarDepreciacoesEmMassaResponseSchema,
  ListarDepreciacoesPendentesQuerySchema,
  ListarDepreciacoesPendentesResponseSchema,
  PatrimonioParamsSchema,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

type OpcoesLeitura = { cookie?: string; signal?: AbortSignal };
const leitura = (opcoes?: OpcoesLeitura) => ({
  cache: "no-store" as const,
  signal: opcoes?.signal,
  headers: opcoes?.cookie ? { Cookie: opcoes.cookie } : undefined,
});
const csrf = { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF };

export function criarOperacoesDepreciacoes(client: ApiClient) {
  return {
    listarPendentes(
      query: { competencia: string; pagina?: string; limite?: string },
      opcoes?: OpcoesLeitura,
    ) {
      return client.request({
        path: "/depreciacoes/pendentes",
        query: ListarDepreciacoesPendentesQuerySchema.parse(query),
        responseSchema: ListarDepreciacoesPendentesResponseSchema,
        ...leitura(opcoes),
      });
    },
    executarEmMassa(body: {
      competencia: string;
      comissaoId: string;
      confirmarIgnorarValorResidual: boolean;
    }) {
      return client.request({
        path: "/depreciacoes",
        method: "POST",
        body: ExecutarDepreciacoesEmMassaBodySchema.parse(body),
        headers: csrf,
        responseSchema: ExecutarDepreciacoesEmMassaResponseSchema,
      });
    },
    executarIndividual(
      patrimonioId: string,
      body: {
        competencia: string;
        comissaoId: string;
        confirmarIgnorarValorResidual: boolean;
      },
    ) {
      const params = PatrimonioParamsSchema.parse({ patrimonioId });
      return client.request({
        path: `/patrimonios/${params.patrimonioId}/depreciacoes`,
        method: "POST",
        body: ExecutarDepreciacaoPatrimonioBodySchema.parse(body),
        headers: csrf,
        responseSchema: ExecutarDepreciacaoPatrimonioResponseSchema,
      });
    },
  };
}
