// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  ComissaoOpcaoReavaliacao,
  CompetenciaDepreciacao,
  ListarDepreciacoesPendentesResponse,
} from "@repo/contracts";
import { ProcessamentoDepreciacoes } from "./processamento-depreciacoes";

const mocks = vi.hoisted(() => ({
  executarLote: vi.fn(),
  executarIndividual: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
    replace: mocks.replace,
  }),
}));
vi.mock("../api/hooks", () => ({
  useExecutarDepreciacoesEmMassa: () => ({
    pending: false,
    executar: mocks.executarLote,
  }),
  useExecutarDepreciacaoIndividual: () => ({
    pendingId: null,
    executar: mocks.executarIndividual,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const id = "7041c62b-5f83-432c-a178-889977d839b1";
const resposta = {
  status: 200,
  sucesso: true,
  mensagem: "Pendências consultadas.",
  dados: [
    {
      patrimonioId: id,
      numeroPatrimonio: "1",
      descricao: "Notebook para depreciação",
      status: "ATIVO",
      valorBrutoAtual: "1200.0000000",
      depreciacaoAcumuladaAtual: "100.0000000",
      valorLiquidoAtual: "1100.0000000",
      valorResidual: "120.0000000",
      vidaUtilRestanteMeses: 55,
      quotaPrevista: "20.0000000",
      atingiraValorResidual: false,
      primeiraCompetencia: "2026-10",
      ultimaCompetenciaProcessada: null,
      competenciaEsperada: "2026-10",
    },
  ],
  meta: { total: 1, pagina: 1, limite: 20, ultimaPagina: 1 },
  resumo: { totalElegiveis: 1, totalNoValorResidual: 0 },
} satisfies ListarDepreciacoesPendentesResponse;

const competencias = [
  {
    competencia: "2026-10",
    quantidadePendente: 1,
    quantidadeBloqueadaPorAnterior: 0,
  },
  {
    competencia: "2026-11",
    quantidadePendente: 1,
    quantidadeBloqueadaPorAnterior: 1,
  },
] satisfies CompetenciaDepreciacao[];

const comissoes = [
  {
    id,
    nome: "Comissão patrimonial vigente",
    dataVigenciaInicio: "2026-01-01",
    dataVigenciaFim: "2026-12-31",
  },
] satisfies ComissaoOpcaoReavaliacao[];

function renderizar() {
  render(
    <ProcessamentoDepreciacoes
      resposta={resposta}
      competencia="2026-10"
      comissoes={comissoes}
      erroComissoes=""
      competencias={competencias}
      competenciaMaisAntigaPendente="2026-10"
    />,
  );
}

describe("ProcessamentoDepreciacoes", () => {
  it("usa textos voltados ao usuário e não expõe detalhes internos", () => {
    renderizar();

    expect(
      screen.getByText(
        "Os valores são calculados automaticamente com base nos parâmetros cadastrados para cada patrimônio.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "A comissão é obrigatória e precisa estar vigente na data do processamento.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/\b(?:API|URL)\b/)).toBeNull();
  });

  it("consulta novamente o catálogo após concluir a competência em lote", async () => {
    mocks.executarLote.mockResolvedValue({
      dados: {
        quantidadeProcessada: 1,
        quantidadeAtingiuValorResidual: 0,
        quantidadesInelegiveis: {
          baixado: 0,
          semParametroVigente: 0,
          dataInicioNaoAtingida: 0,
          jaDepreciadoNaCompetencia: 0,
          valorResidualAtingido: 0,
          naoDepreciavel: 0,
          indisponivelParaUso: 0,
          competenciaAnteriorPendente: 0,
        },
      },
    });
    renderizar();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar depreciação em lote" }),
    );
    expect(
      screen.getByText(
        "Todos os bens elegíveis de Outubro de 2026 serão conferidos novamente e processados juntos.",
      ),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar processamento" }),
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/depreciacao"),
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
