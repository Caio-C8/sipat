import type { VerificarItemInventarioResultado } from "@repo/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ReadingResult, readingFeedback } from "./conferencia-feedback";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

const correctResult = {
  tipo: "CONFERENCIA_REGISTRADA",
  item: {
    situacao: "CORRETO",
    patrimonio: {
      descricao: "Notebook da conferência",
      numeroPatrimonio: "000123",
    },
    setorEsperado: { nome: "Tecnologia da Informação" },
    setorEncontrado: null,
    localizacaoPosterior: null,
  },
} as unknown as VerificarItemInventarioResultado;

describe("feedback da conferência", () => {
  it("mantém o resultado e oferece a próxima leitura explicitamente", () => {
    const markup = renderToStaticMarkup(
      <ReadingResult onReadNext={vi.fn()} result={correctResult} />,
    );

    expect(markup).toContain("Bem conferido");
    expect(markup).toContain("Notebook da conferência · 000123");
    expect(markup).toContain("Tecnologia da Informação · setor correto.");
    expect(markup).toContain("Ler próximo patrimônio");
    expect(markup).toContain(
      'aria-label="Ler próximo patrimônio. Limpa o resultado atual e reativa a câmera"',
    );
    expect(markup).toContain('data-icon="circle-check"');
  });

  it("explica a origem e o local de uma divergência", () => {
    const feedback = readingFeedback({
      ...correctResult,
      item: {
        ...correctResult.item,
        situacao: "DIVERGENCIA",
        setorEncontrado: { nome: "Compras e Licitações" },
      },
    } as VerificarItemInventarioResultado);

    expect(feedback.warning).toBe(true);
    expect(feedback.message).toBe(
      "Cadastrado em Tecnologia da Informação; encontrado em Compras e Licitações.",
    );
  });
});
