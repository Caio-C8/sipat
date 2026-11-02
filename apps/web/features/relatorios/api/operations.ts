import {
  queryRelatorio,
  queryPdfRelatorio,
  respostasTabulares,
  FichaResponseSchema,
  EventosFichaResponseSchema,
  CatalogoRelatoriosResponseSchema,
  FichaRelatorioParamsSchema,
  OpcoesRelatorioQuerySchema,
  OpcoesRelatorioResponseSchema,
  type TipoTabular,
  type TipoRelatorio,
  type CatalogoOpcaoRelatorio,
} from "@repo/contracts";
import type { ApiClient, ApiQuery } from "@/lib/api/core/types";
type Opcoes = { cookie?: string; signal?: AbortSignal };
export function criarOperacoesRelatorios(client: ApiClient) {
  const leitura = (o?: Opcoes) => ({
    cache: "no-store" as const,
    signal: o?.signal,
    headers: o?.cookie ? { Cookie: o.cookie } : undefined,
  });
  const listar = {
    patrimonios: (q: ApiQuery, o?: Opcoes) =>
      client.request({
        path: "/relatorios/patrimonios",
        query: queryRelatorio("patrimonios").parse(q),
        responseSchema: respostasTabulares.patrimonios,
        ...leitura(o),
      }),
    movimentacoes: (q: ApiQuery, o?: Opcoes) =>
      client.request({
        path: "/relatorios/movimentacoes",
        query: queryRelatorio("movimentacoes").parse(q),
        responseSchema: respostasTabulares.movimentacoes,
        ...leitura(o),
      }),
    manutencoes: (q: ApiQuery, o?: Opcoes) =>
      client.request({
        path: "/relatorios/manutencoes",
        query: queryRelatorio("manutencoes").parse(q),
        responseSchema: respostasTabulares.manutencoes,
        ...leitura(o),
      }),
    depreciacoes: (q: ApiQuery, o?: Opcoes) =>
      client.request({
        path: "/relatorios/depreciacoes",
        query: queryRelatorio("depreciacoes").parse(q),
        responseSchema: respostasTabulares.depreciacoes,
        ...leitura(o),
      }),
    reavaliacoes: (q: ApiQuery, o?: Opcoes) =>
      client.request({
        path: "/relatorios/reavaliacoes",
        query: queryRelatorio("reavaliacoes").parse(q),
        responseSchema: respostasTabulares.reavaliacoes,
        ...leitura(o),
      }),
    inventarios: (q: ApiQuery, o?: Opcoes) =>
      client.request({
        path: "/relatorios/inventarios",
        query: queryRelatorio("inventarios").parse(q),
        responseSchema: respostasTabulares.inventarios,
        ...leitura(o),
      }),
    emprestimos: (q: ApiQuery, o?: Opcoes) =>
      client.request({
        path: "/relatorios/emprestimos",
        query: queryRelatorio("emprestimos").parse(q),
        responseSchema: respostasTabulares.emprestimos,
        ...leitura(o),
      }),
    baixas: (q: ApiQuery, o?: Opcoes) =>
      client.request({
        path: "/relatorios/baixas",
        query: queryRelatorio("baixas").parse(q),
        responseSchema: respostasTabulares.baixas,
        ...leitura(o),
      }),
  };
  const pdf = {
    patrimonios: (q: ApiQuery, o?: Opcoes) =>
      client.request<Blob>({
        path: "/relatorios/patrimonios/pdf",
        query: queryPdfRelatorio("patrimonios").parse(q),
        responseType: "pdf",
        timeoutMs: 25000,
        ...leitura(o),
      }),
    movimentacoes: (q: ApiQuery, o?: Opcoes) =>
      client.request<Blob>({
        path: "/relatorios/movimentacoes/pdf",
        query: queryPdfRelatorio("movimentacoes").parse(q),
        responseType: "pdf",
        timeoutMs: 25000,
        ...leitura(o),
      }),
    manutencoes: (q: ApiQuery, o?: Opcoes) =>
      client.request<Blob>({
        path: "/relatorios/manutencoes/pdf",
        query: queryPdfRelatorio("manutencoes").parse(q),
        responseType: "pdf",
        timeoutMs: 25000,
        ...leitura(o),
      }),
    depreciacoes: (q: ApiQuery, o?: Opcoes) =>
      client.request<Blob>({
        path: "/relatorios/depreciacoes/pdf",
        query: queryPdfRelatorio("depreciacoes").parse(q),
        responseType: "pdf",
        timeoutMs: 25000,
        ...leitura(o),
      }),
    reavaliacoes: (q: ApiQuery, o?: Opcoes) =>
      client.request<Blob>({
        path: "/relatorios/reavaliacoes/pdf",
        query: queryPdfRelatorio("reavaliacoes").parse(q),
        responseType: "pdf",
        timeoutMs: 25000,
        ...leitura(o),
      }),
    inventarios: (q: ApiQuery, o?: Opcoes) =>
      client.request<Blob>({
        path: "/relatorios/inventarios/pdf",
        query: queryPdfRelatorio("inventarios").parse(q),
        responseType: "pdf",
        timeoutMs: 25000,
        ...leitura(o),
      }),
    emprestimos: (q: ApiQuery, o?: Opcoes) =>
      client.request<Blob>({
        path: "/relatorios/emprestimos/pdf",
        query: queryPdfRelatorio("emprestimos").parse(q),
        responseType: "pdf",
        timeoutMs: 25000,
        ...leitura(o),
      }),
    baixas: (q: ApiQuery, o?: Opcoes) =>
      client.request<Blob>({
        path: "/relatorios/baixas/pdf",
        query: queryPdfRelatorio("baixas").parse(q),
        responseType: "pdf",
        timeoutMs: 25000,
        ...leitura(o),
      }),
  };
  return {
    listar,
    pdf,
    catalogo: (o?: Opcoes) =>
      client.request({
        path: "/relatorios",
        responseSchema: CatalogoRelatoriosResponseSchema,
        ...leitura(o),
      }),
    ficha: (id: string, o?: Opcoes) => {
      FichaRelatorioParamsSchema.parse({ patrimonioId: id });
      return client.request({
        path: "/relatorios/ficha-bem/" + id,
        responseSchema: FichaResponseSchema,
        ...leitura(o),
      });
    },
    eventos: (id: string, q: ApiQuery, o?: Opcoes) => {
      FichaRelatorioParamsSchema.parse({ patrimonioId: id });
      return client.request({
        path: "/relatorios/ficha-bem/" + id + "/eventos",
        query: queryRelatorio("ficha-bem").parse(q),
        responseSchema: EventosFichaResponseSchema,
        ...leitura(o),
      });
    },
    pdfFicha: (id: string, q: ApiQuery, o?: Opcoes) => {
      FichaRelatorioParamsSchema.parse({ patrimonioId: id });
      return client.request<Blob>({
        path: "/relatorios/ficha-bem/" + id + "/pdf",
        query: queryPdfRelatorio("ficha-bem").parse(q),
        responseType: "pdf",
        timeoutMs: 25000,
        ...leitura(o),
      });
    },
    opcoes: (
      catalogo: CatalogoOpcaoRelatorio,
      tipo: TipoRelatorio,
      busca: string,
      pagina: number,
      signal?: AbortSignal,
    ) =>
      client.request({
        path: "/relatorios/opcoes/" + catalogo,
        query: OpcoesRelatorioQuerySchema.parse({
          tipo,
          ...(busca ? { busca } : {}),
          pagina: String(pagina),
        }),
        responseSchema: OpcoesRelatorioResponseSchema,
        cache: "no-store",
        signal,
      }),
    consultar: (tipo: TipoTabular, q: ApiQuery, o?: Opcoes) =>
      listar[tipo](q, o),
  };
}
