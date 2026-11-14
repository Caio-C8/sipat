import {
  LimitesRelatorios,
  TipoEventoRelatorioSchema,
  titulosRelatorios,
  type TipoTabular,
} from "@repo/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRelatoriosOperations } from "./relatorios-operations";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function catalogPayload() {
  return {
    status: 200,
    sucesso: true,
    mensagem: "Catálogo de relatórios.",
    dados: {
      tipos: Object.entries(titulosRelatorios).map(([tipo, titulo]) => ({
        tipo,
        titulo,
        disponivel: true,
        motivo: null,
        previa: true,
        pdf: true,
      })),
      limites: LimitesRelatorios,
    },
  };
}

const consulta = {
  id: "00000000-0000-4000-8000-000000000010",
  instante: "2026-11-14T12:00:00.000Z",
  filtros: {},
  criterioTemporal: "Todos os registros elegíveis.",
  ordenacao: "Número patrimonial crescente.",
  avisos: [],
  excluidosDataDesconhecida: 0,
};

const summaries: Record<TipoTabular, Record<string, unknown>> = {
  patrimonios: {
    quantidade: 0,
    semNumeroOficial: 0,
    semContabilidade: 0,
    incorporacao: null,
    brutoAtual: null,
    acumuladoAtual: null,
    liquidoAtual: null,
  },
  movimentacoes: { quantidade: 0, bensDistintos: 0 },
  manutencoes: {
    quantidade: 0,
    pedidosDistintos: 0,
    pendentes: 0,
    retornados: 0,
    semOrcamento: 0,
    semRealizado: 0,
    orcamentoConhecido: null,
    realizadoConhecido: null,
  },
  depreciacoes: {
    quantidade: 0,
    bensDistintos: 0,
    quotas: null,
    porCompetencia: [],
  },
  "pendencias-depreciacao": {
    quantidade: 0,
    bensDistintos: 0,
    competenciaMaisAntiga: null,
    quantidadeCompetencias: 0,
  },
  reavaliacoes: { quantidade: 0, bensDistintos: 0, semReferencia: 0 },
  inventarios: {
    quantidade: 0,
    pendentes: 0,
    verificados: 0,
    corretos: 0,
    divergentes: 0,
    naoLocalizados: 0,
    correcoesOriginaisPendentes: 0,
    correcoesOriginaisConcluidas: 0,
    correcoesPosterioresPendentes: 0,
    correcoesPosterioresConcluidas: 0,
  },
  emprestimos: {
    quantidade: 0,
    gruposDistintos: 0,
    pendentes: 0,
    devolvidos: 0,
    atrasados: 0,
    semPrevisao: 0,
  },
  baixas: { quantidade: 0, porTipo: [] },
};

const previewQueries: Record<TipoTabular, Record<string, string>> = {
  patrimonios: {},
  movimentacoes: { inicio: "2026-01-01", fim: "2026-01-31" },
  manutencoes: {
    inicio: "2026-01-01",
    fim: "2026-01-31",
    base: "ENVIO",
  },
  depreciacoes: {
    competenciaInicio: "2026-01",
    competenciaFim: "2026-01",
  },
  "pendencias-depreciacao": {},
  reavaliacoes: {
    inicio: "2026-01-01",
    fim: "2026-01-31",
    base: "REGISTRO",
  },
  inventarios: {
    inventarioId: "00000000-0000-4000-8000-000000000020",
  },
  emprestimos: {
    inicio: "2026-01-01",
    fim: "2026-01-31",
    base: "SAIDA",
  },
  baixas: {},
};

afterEach(() => vi.unstubAllGlobals());

describe("createRelatoriosOperations", () => {
  it("consulta o catálogo autenticado e encaminha cancelamento", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(catalogPayload()));
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    const operations = createRelatoriosOperations(
      "https://api.example.test/api",
    );

    await expect(
      operations.catalogo({ accessToken: "token", signal }),
    ).resolves.toMatchObject({
      dados: {
        tipos: expect.arrayContaining([
          expect.objectContaining({ tipo: "ficha-bem" }),
        ]),
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/relatorios",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("rejeita catálogo incompleto no boundary", async () => {
    const payload = catalogPayload();
    payload.dados.tipos = payload.dados.tipos.slice(0, 9);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(payload)));
    const operations = createRelatoriosOperations(
      "https://api.example.test/api",
    );

    await expect(
      operations.catalogo({ accessToken: "token" }),
    ).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("preserva 401 e 403 como erros HTTP públicos", async () => {
    for (const status of [401, 403]) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          jsonResponse(
            {
              status,
              sucesso: false,
              codigo: status === 401 ? "NAO_AUTENTICADO" : "ACESSO_NEGADO",
              mensagem: "Acesso negado.",
              erros: [],
              requisicaoId: `req-${status}`,
            },
            status,
          ),
        ),
      );
      const operations = createRelatoriosOperations(
        "https://api.example.test/api",
      );
      await expect(
        operations.catalogo({ accessToken: "token" }),
      ).rejects.toMatchObject({ kind: "http", status });
    }
  });

  it("consulta opções paginadas com busca, token e cancelamento", async () => {
    const payload = {
      status: 200,
      sucesso: true,
      mensagem: "Opções.",
      dados: [{ id: "00000000-0000-4000-8000-000000000001", rotulo: "Bem 1" }],
      meta: { pagina: 2, limite: 20, total: 21, ultimaPagina: 2 },
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    const operations = createRelatoriosOperations(
      "https://api.example.test/api",
    );

    await expect(
      operations.opcoes("patrimonios", "ficha-bem", "  Bem 1  ", 2, {
        accessToken: "token",
        signal,
      }),
    ).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/relatorios/opcoes/patrimonios?tipo=ficha-bem&busca=Bem+1&pagina=2&limite=20",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it.each(
    Object.entries(summaries) as [TipoTabular, Record<string, unknown>][],
  )(
    "valida a prévia vazia específica de %s com paginação real",
    async (tipo, resumo) => {
      const payload = {
        status: 200,
        sucesso: true,
        mensagem: "Prévia consultada.",
        tipo,
        dados: [],
        resumo,
        meta: { pagina: 1, limite: 20, total: 0, ultimaPagina: 1 },
        consulta,
      };
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payload));
      vi.stubGlobal("fetch", fetchMock);
      const operations = createRelatoriosOperations(
        "https://api.example.test/api",
      );

      await expect(
        operations.consultar(tipo, previewQueries[tipo], {
          accessToken: "token",
        }),
      ).resolves.toEqual(payload);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          `https://api.example.test/api/relatorios/${tipo}?`,
        ),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    },
  );

  it("valida ficha e as quatorze seções públicas antes de exibi-las", async () => {
    const cadastro = {
      id: "00000000-0000-4000-8000-000000000001",
      patrimonioId: "00000000-0000-4000-8000-000000000001",
      numeroPatrimonio: "0001",
      tipoNumeroPatrimonial: "OFICIAL",
      descricao: "Notebook",
      especie: "Equipamento",
      natureza: "Permanente",
      setorAtual: "TI",
      salaAtual: null,
      responsavelAtual: "Responsável",
      status: "ATIVO",
      dataTombamento: "2026-01-01",
      valorIncorporacao: "1000.0000000",
      valorBrutoAtual: "1000.0000000",
      depreciacaoAcumuladaAtual: "0.0000000",
      valorLiquidoAtual: "1000.0000000",
      marca: null,
      modelo: null,
      serie: null,
      processoId: null,
      processo: null,
      parametro: null,
    };
    const payload = {
      status: 200,
      sucesso: true,
      mensagem: "Ficha consultada.",
      dados: {
        cadastro,
        secoes: TipoEventoRelatorioSchema.options.map((tipo) => ({
          tipo,
          disponivel: true,
          quantidade: 0,
        })),
        consulta,
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(payload)));
    const operations = createRelatoriosOperations(
      "https://api.example.test/api",
    );

    await expect(
      operations.ficha(cadastro.patrimonioId, { accessToken: "token" }),
    ).resolves.toEqual(payload);
    expect(payload.dados.secoes).toHaveLength(14);
  });
});
