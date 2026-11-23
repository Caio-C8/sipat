import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/core/api-error";
import {
  campoTecnico,
  chaveRegistroRelatorio,
  mensagemRelatorio,
  rotulo,
  rotuloOpcao,
  valor,
} from "./apresentacao";

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

describe("apresentação pública do relatório", () => {
  it("oculta identificadores técnicos e usa rótulos orientados ao usuário", () => {
    expect(campoTecnico("id")).toBe(true);
    expect(campoTecnico("patrimonioId")).toBe(true);
    expect(campoTecnico("numeroPatrimonio")).toBe(false);
    expect(rotulo("tipoNumeroPatrimonial")).toBe("Tipo de número patrimonial");
    expect(rotuloOpcao("DIA")).toBe("Somente data");
    expect(rotuloOpcao("INSTANTE")).toBe("Data e hora");
  });

  it("formata datas civis e instantes ISO para exibição", () => {
    expect(valor("2026-11")).toBe("11/2026");
    expect(valor("2026-11-23")).toBe("23/11/2026");
    expect(valor("2026-11-23T15:19:48.154000Z")).toBe("23/11/2026, 12:19:48");
    expect(valor("2026-11-23T15:19:48-03:00")).toBe("23/11/2026, 15:19:48");
    expect(valor("2026-11-23 15:19:48.154000+00")).toBe("23/11/2026, 12:19:48");
    expect(valor("2026-11-23 15:19:48.154000")).toBe("23/11/2026, 12:19:48");
    expect(valor("2026-11-23 sem horário")).toBe("2026-11-23 sem horário");
  });

  it("gera chaves distintas quando eventos compartilham o identificador", () => {
    const registro = { id: "evento-repetido" };
    expect(chaveRegistroRelatorio(registro, 0)).not.toBe(
      chaveRegistroRelatorio(registro, 1),
    );
  });
});
