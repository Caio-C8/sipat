import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/core/api-error";
import { mensagemRelatorio } from "./apresentacao";

function erro({
  status,
  codigo,
  categoria = "http",
}: {
  status: number | null;
  codigo: string;
  categoria?: ConstructorParameters<typeof ApiError>[0]["categoria"];
}) {
  return new ApiError({
    status,
    codigo,
    categoria,
    mensagem: "Detalhe técnico que não deve substituir a orientação.",
  });
}

describe("mensagemRelatorio", () => {
  it("identifica explicitamente filtros recusados", () => {
    expect(
      mensagemRelatorio(
        erro({ status: 400, codigo: "VALIDACAO_ENTRADA_INVALIDA" }),
      ),
    ).toBe(
      "Os filtros não foram aceitos. Limpe ou revise os valores informados e consulte novamente.",
    );
  });

  it("não atribui falhas internas aos filtros", () => {
    expect(
      mensagemRelatorio(erro({ status: 503, codigo: "INDISPONIVEL" })),
    ).toBe(
      "O serviço de relatórios está temporariamente indisponível. Tente novamente em instantes.",
    );
    expect(mensagemRelatorio(new Error("falha inesperada"))).toBe(
      "Não foi possível carregar os registros. Tente novamente; se o problema continuar, atualize a página.",
    );
  });
});
