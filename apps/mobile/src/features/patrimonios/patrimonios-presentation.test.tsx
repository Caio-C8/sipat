import type { PatrimonioDetalhe } from "@repo/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DadosTab, ValoresTab } from "./patrimonio-detail-screen";
import { PatrimonioCard } from "./patrimonios-screen";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("../../config/public-app-config", () => ({
  publicAppConfig: { apiBaseUrl: "https://api.example.test" },
}));

const patrimonio = {
  id: "11111111-1111-4111-8111-111111111111",
  numeroPatrimonio: "2656",
  tipoNumeroPatrimonial: "OFICIAL",
  descricao: "Notebook corporativo",
  marca: "Dell",
  modelo: "Latitude 3450",
  numeroSerie: "LAT2026001",
  status: "ATIVO",
  setorAtual: {
    id: "22222222-2222-4222-8222-222222222222",
    nome: "Tecnologia da Informação",
    responsavel: {
      id: "33333333-3333-4333-8333-333333333333",
      nome: "Paulo Caixeta",
    },
  },
  especie: {
    id: "44444444-4444-4444-8444-444444444444",
    nome: "Notebooks",
    natureza: {
      id: "55555555-5555-4555-8555-555555555555",
      nome: "Bens móveis",
    },
  },
  dataTombamento: "2026-01-27",
  tipoIncorporacao: "AQUISICAO",
  valorIncorporacao: "6000.0000000",
  processoCompra: {
    id: "66666666-6666-4666-8666-666666666666",
    numeroProcesso: "024",
    anoProcesso: 2026,
  },
  situacaoContabil: {
    valorBrutoAtual: "6000.0000000",
    depreciacaoAcumuladaAtual: "720.0000000",
  },
  parametroDepreciacaoAtual: {
    metodo: "LINEAR",
    vidaUtilInicialMeses: 60,
    percentualResidual: "10",
    valorResidual: "600.0000000",
    valorBaseInicial: "6000.0000000",
    dataInicio: "2026-02-01",
    dataFim: null,
  },
  createdAt: "2026-01-27T12:00:00.000Z",
  updatedAt: null,
} as const satisfies PatrimonioDetalhe;

describe("apresentação de patrimônios", () => {
  it("renderiza o card somente com campos presentes no resumo público", () => {
    const markup = renderToStaticMarkup(
      <PatrimonioCard onPress={vi.fn()} patrimonio={patrimonio} />,
    );

    expect(markup).toContain("002656");
    expect(markup).toContain("Notebook corporativo");
    expect(markup).toContain("Tecnologia da Informação");
    expect(markup).not.toContain("R$ 5.280,00");
  });

  it("renderiza Dados sem Histórico, Sala ou ficha inventados", () => {
    const markup = renderToStaticMarkup(<DadosTab patrimonio={patrimonio} />);

    expect(markup).toContain("Identificação");
    expect(markup).toContain("Classificação e localização");
    expect(markup).toContain("Paulo Caixeta");
    expect(markup).not.toContain("Histórico");
    expect(markup).not.toContain("Sala");
    expect(markup).not.toContain("Gerar ficha");
  });

  it("deriva o valor atual e apresenta somente os dados contratados", () => {
    const markup = renderToStaticMarkup(<ValoresTab patrimonio={patrimonio} />);

    expect(markup).toContain("R$ 5.280,00");
    expect(markup).toContain("R$ 720,00");
    expect(markup).toContain("Depreciação · método linear");
    expect(markup).not.toContain("Gerar ficha");
  });
});
