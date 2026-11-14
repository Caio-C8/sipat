import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RelatorioPreviaScreen } from "./relatorio-previa-screen";
import { useRelatorioPrevia } from "../use-relatorio-previa";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("../../auth/session/session-context", () => ({
  useSession: () => ({ manager: {} }),
}));

vi.mock("../use-relatorio-previa", () => ({
  relatorioPreviaErrorMessage: () => "Não foi possível consultar a prévia.",
  useRelatorioPrevia: vi.fn(),
}));

const response = {
  status: 200,
  sucesso: true,
  mensagem: "Prévia consultada.",
  tipo: "baixas",
  dados: [],
  resumo: { quantidade: 0, porTipo: [] },
  meta: { pagina: 1, limite: 20, total: 0, ultimaPagina: 1 },
  consulta: {
    id: "00000000-0000-4000-8000-000000000010",
    instante: "2026-11-14T12:00:00.000Z",
    filtros: { tipo: "FURTO" },
    criterioTemporal: "Data da baixa no período informado.",
    ordenacao: "Data da baixa decrescente.",
    avisos: ["Valores refletem o instante da consulta."],
    excluidosDataDesconhecida: 0,
  },
} as const;

describe("RelatorioPreviaScreen", () => {
  it("apresenta filtros, resumo, vazio válido, paginação e PDF desabilitado", () => {
    vi.mocked(useRelatorioPrevia).mockReturnValue({
      state: {
        status: "success",
        data: { kind: "tabular", response } as never,
      },
      isFetching: false,
      reload: vi.fn(),
    });

    const markup = renderToStaticMarkup(
      <RelatorioPreviaScreen
        draft={{ tipo: "FURTO" }}
        onAdjust={vi.fn()}
        onBack={vi.fn()}
        onPage={vi.fn()}
        request={{
          tipo: "baixas",
          query: { tipo: "FURTO", pagina: 1, limite: 20 },
        }}
        selectedLabels={{ tipo: "Furto" }}
        tipo="baixas"
      />,
    );

    expect(markup).toContain("Etapa 2 de 3: Prévia");
    expect(markup).toContain("FILTROS APLICADOS");
    expect(markup).toContain("Furto");
    expect(markup).toContain("Nenhum registro corresponde aos filtros");
    expect(markup).toContain("Página 1 de 1");
    expect(markup).toContain("Abrir documento");
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain("Valores refletem o instante da consulta");
    expect(markup).toContain("Observações importantes");
    expect(markup).not.toContain(response.consulta.id);
    expect(markup).not.toContain(response.consulta.criterioTemporal);
  });

  it("humaniza a ficha e organiza eventos sem expor referências internas", () => {
    const fichaResponse = {
      ...response,
      tipo: "ficha-bem",
      dados: [
        {
          id: "00000000-0000-4000-8000-000000000101",
          patrimonioId: "00000000-0000-4000-8000-000000000102",
          fonteId: "00000000-0000-4000-8000-000000000103",
          tipo: "CONFERENCIA_INVENTARIO",
          ocorrencia: "2026-11-13T03:27:04.241Z",
          precisao: "INSTANTE",
          registroEm: null,
          autor: "Diretor de Patrimônio",
          comissao: null,
          atributos: {
            id: "00000000-0000-4000-8000-000000000104",
            patrimonioId: "00000000-0000-4000-8000-000000000102",
            inventarioId: "00000000-0000-4000-8000-000000000105",
            numeroPatrimonio: "14",
            descricao: "Aparelho de ar-condicionado",
            inventario: "Inventário Geral 2026",
            verificacao: "VERIFICADO",
            situacao: "CORRETO",
          },
        },
      ],
      resumo: {
        quantidade: 1,
        porTipo: [{ tipo: "CONFERENCIA_INVENTARIO", quantidade: 1 }],
      },
      meta: { pagina: 1, limite: 20, total: 1, ultimaPagina: 1 },
    };
    vi.mocked(useRelatorioPrevia).mockReturnValue({
      state: {
        status: "success",
        data: {
          kind: "ficha",
          response: fichaResponse,
          ficha: {
            dados: {
              cadastro: {
                id: "00000000-0000-4000-8000-000000000106",
                patrimonioId: "00000000-0000-4000-8000-000000000102",
                numeroPatrimonio: "14",
                tipoNumeroPatrimonial: "OFICIAL",
                descricao: "Aparelho de ar-condicionado",
                parametro: {
                  id: "00000000-0000-4000-8000-000000000107",
                  metodo: "LINEAR",
                  inicio: "2026-09-01",
                },
              },
              secoes: [
                {
                  tipo: "CONFERENCIA_INVENTARIO",
                  disponivel: true,
                  quantidade: 1,
                },
              ],
            },
          },
        } as never,
      },
      isFetching: false,
      reload: vi.fn(),
    });

    const markup = renderToStaticMarkup(
      <RelatorioPreviaScreen
        draft={{ patrimonioId: "00000000-0000-4000-8000-000000000102" }}
        onAdjust={vi.fn()}
        onBack={vi.fn()}
        onPage={vi.fn()}
        request={{
          tipo: "ficha-bem",
          patrimonioId: "00000000-0000-4000-8000-000000000102",
          query: { pagina: 1, limite: 20 },
        }}
        selectedLabels={{ patrimonioId: "14 — Aparelho de ar-condicionado" }}
        tipo="ficha-bem"
      />,
    );

    expect(markup).toContain("Conferência de inventário");
    expect(markup).toContain("13/11/2026, 00:27:04");
    expect(markup).toContain("DETALHES DO EVENTO");
    expect(markup).toContain("Método: Linear");
    expect(markup).not.toContain("CONFERENCIA_INVENTARIO");
    expect(markup).not.toContain("00000000-0000-4000-8000-000000000101");
    expect(markup).not.toContain("00000000-0000-4000-8000-000000000107");
  });
});
