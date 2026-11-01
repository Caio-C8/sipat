import { ItemInventarioResponseSchema } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { ApiError } from "../../../lib/api/api-error";
import {
  buildCorrecaoBody,
  correcaoErrorMessage,
  isPendingDivergence,
} from "./correcao-state";

function pendingItem() {
  return ItemInventarioResponseSchema.parse({
    id: "11111111-1111-4111-8111-111111111111",
    patrimonio: {
      id: "22222222-2222-4222-8222-222222222222",
      numeroPatrimonio: "1001",
      descricao: "Notebook corporativo",
    },
    setorEsperado: {
      id: "33333333-3333-4333-8333-333333333333",
      nome: "Tecnologia da Informação",
    },
    observacao: null,
    statusVerificacao: "VERIFICADO",
    situacao: "DIVERGENCIA",
    setorEncontrado: {
      id: "44444444-4444-4444-8444-444444444444",
      nome: "Gabinete 01",
    },
    dataVerificacao: "2026-10-29T12:00:00.000Z",
    verificadoPorId: "55555555-5555-4555-8555-555555555555",
    statusPatrimonioNaVerificacao: "ATIVO",
    ausenciaJustificada: null,
    statusCorrecao: "PENDENTE",
    tipoCorrecao: null,
    dataCorrecao: null,
    corrigidoPorId: null,
    transferenciaCorrecaoId: null,
    localizacaoPosterior: null,
  });
}

describe("estado da correção de inventário", () => {
  it("mapeia trazer para o setor sem inventar transferência", () => {
    expect(buildCorrecaoBody("TRAZER_PARA_CADASTRADO", "  ")).toEqual({
      tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO",
    });
  });

  it("mapeia manter onde foi encontrado e preserva observação opcional", () => {
    expect(
      buildCorrecaoBody("MANTER_ENCONTRADO", "  Em uso no gabinete.  "),
    ).toEqual({
      tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
      observacao: "Em uso no gabinete.",
    });
  });

  it("valida o limite público da observação antes da rede", () => {
    expect(() =>
      buildCorrecaoBody("MANTER_ENCONTRADO", "a".repeat(2_001)),
    ).toThrow();
  });

  it("monta formulário somente para divergência pendente", () => {
    const item = pendingItem();
    expect(isPendingDivergence(item)).toBe(true);
    if (item.situacao !== "DIVERGENCIA") throw new Error("fixture inválida");
    const corrected = ItemInventarioResponseSchema.parse({
      ...item,
      statusCorrecao: "CORRIGIDO",
      tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO",
      dataCorrecao: "2026-10-29T13:00:00.000Z",
      corrigidoPorId: "55555555-5555-4555-8555-555555555555",
    });
    expect(isPendingDivergence(corrected)).toBe(false);
  });

  it("permite corrigir localização posterior pendente de item não localizado", () => {
    const divergente = pendingItem();
    const item = ItemInventarioResponseSchema.parse({
      ...divergente,
      situacao: "NAO_LOCALIZADO",
      setorEncontrado: null,
      statusCorrecao: null,
      ausenciaJustificada: null,
      localizacaoPosterior: {
        id: "66666666-6666-4666-8666-666666666666",
        setorEncontrado: {
          id: "44444444-4444-4444-8444-444444444444",
          nome: "Gabinete 01",
        },
        dataLocalizacao: "2026-10-29T13:00:00.000Z",
        localizadoPorId: "55555555-5555-4555-8555-555555555555",
        statusCorrecao: "PENDENTE",
        tipoCorrecao: null,
        dataCorrecao: null,
        corrigidoPorId: null,
        transferenciaCorrecaoId: null,
        observacao: null,
      },
    });
    expect(isPendingDivergence(item)).toBe(true);
  });

  it.each([
    [
      new ApiError("network"),
      "Não foi possível confirmar o resultado da correção",
    ],
    [new ApiError("timeout"), "Tente novamente"],
    [
      new ApiError("http", 409, "CORRECAO_ITEM_INVENTARIO_INCOMPATIVEL"),
      "não está mais pendente",
    ],
    [new ApiError("invalid-response"), "Não foi possível confirmar a correção"],
  ])("distingue falhas sem simular sucesso", (error, message) => {
    expect(correcaoErrorMessage(error)).toContain(message);
  });
});
