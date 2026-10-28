import {
  ConsultarPatrimonioResponseSchema,
  ListarEspeciesQuerySchema,
  ListarEspeciesResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  ListarSetoresQuerySchema,
  ListarSetoresResponseSchema,
  PatrimonioParamsSchema,
  type EspecieResumo,
  type ListarPatrimoniosQueryInput,
  type ListarPatrimoniosResponse,
  type NaturezaResumo,
  type PatrimonioDetalhe,
  type SetorResumo,
} from "@repo/contracts";
import { apiRequest } from "../../../lib/api/api-client";

type RequestOptions = Readonly<{
  accessToken: string;
  signal?: AbortSignal;
}>;

export type PatrimonioCatalogs = Readonly<{
  setores: readonly SetorResumo[];
  especies: readonly EspecieResumo[];
  naturezas: readonly NaturezaResumo[];
}>;

function queryString(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

export function createPatrimoniosOperations(baseUrl: string) {
  async function listarSetores(options: RequestOptions) {
    const items: SetorResumo[] = [];
    let pagina = 1;
    let ultimaPagina = 1;

    do {
      const query = ListarSetoresQuerySchema.parse({
        pagina: String(pagina),
        limite: "50",
        ativo: "true",
      });
      const response = await apiRequest({
        baseUrl,
        path: `/setores?${queryString({
          pagina: query.pagina,
          limite: query.limite,
          ativo: String(query.ativo),
        })}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ListarSetoresResponseSchema,
        signal: options.signal,
      });
      items.push(...response.dados);
      ultimaPagina = response.meta.ultimaPagina;
      pagina += 1;
    } while (pagina <= ultimaPagina);

    return items;
  }

  async function listarEspecies(options: RequestOptions) {
    const items: EspecieResumo[] = [];
    let pagina = 1;
    let ultimaPagina = 1;

    do {
      const query = ListarEspeciesQuerySchema.parse({
        pagina: String(pagina),
        limite: "50",
      });
      const response = await apiRequest({
        baseUrl,
        path: `/especies?${queryString({
          pagina: query.pagina,
          limite: query.limite,
        })}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ListarEspeciesResponseSchema,
        signal: options.signal,
      });
      items.push(...response.dados);
      ultimaPagina = response.meta.ultimaPagina;
      pagina += 1;
    } while (pagina <= ultimaPagina);

    return items;
  }

  return {
    async listar(
      input: ListarPatrimoniosQueryInput,
      options: RequestOptions,
    ): Promise<ListarPatrimoniosResponse> {
      const query = ListarPatrimoniosQuerySchema.parse(input);
      return apiRequest({
        baseUrl,
        path: `/patrimonios?${queryString({
          pagina: query.pagina,
          limite: query.limite,
          busca: query.busca,
          status: query.status,
          setorId: query.setorId,
          especieId: query.especieId,
          naturezaId: query.naturezaId,
          tipoNumeroPatrimonial: query.tipoNumeroPatrimonial,
        })}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ListarPatrimoniosResponseSchema,
        signal: options.signal,
      });
    },

    async consultar(
      patrimonioId: string,
      options: RequestOptions,
    ): Promise<PatrimonioDetalhe> {
      const params = PatrimonioParamsSchema.parse({ patrimonioId });
      const response = await apiRequest({
        baseUrl,
        path: `/patrimonios/${encodeURIComponent(params.patrimonioId)}`,
        method: "GET",
        token: options.accessToken,
        responseSchema: ConsultarPatrimonioResponseSchema,
        signal: options.signal,
      });
      return response.dados;
    },

    async listarCatalogos(
      options: RequestOptions,
    ): Promise<PatrimonioCatalogs> {
      const [setores, especies] = await Promise.all([
        listarSetores(options),
        listarEspecies(options),
      ]);
      const naturezas = Array.from(
        new Map(
          especies.map((especie) => [especie.natureza.id, especie.natureza]),
        ).values(),
      ).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

      return {
        setores: setores.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        especies: especies.sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        ),
        naturezas,
      };
    },
  };
}

export type PatrimoniosOperations = ReturnType<
  typeof createPatrimoniosOperations
>;
