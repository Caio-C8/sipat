import type { VerificarItemInventarioResultado } from "@repo/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  READING_TOAST_DURATION_MS,
  ReadingToast,
  readingFeedback,
} from "./conferencia-feedback";

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
  it("apresenta o resultado em toast dispensável", () => {
    const markup = renderToStaticMarkup(
      <ReadingToast onClose={vi.fn()} result={correctResult} />,
    );

    expect(markup).toContain("Bem conferido");
    expect(markup).toContain("Notebook da conferência · 000123");
    expect(markup).toContain("Tecnologia da Informação · setor correto.");
    expect(markup).toContain('aria-label="Fechar aviso da leitura"');
    expect(markup).toContain('data-icon="circle-check"');
  });

  it("mantém o aviso tempo suficiente antes do fechamento automático", () => {
    expect(READING_TOAST_DURATION_MS).toBe(6_000);
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
