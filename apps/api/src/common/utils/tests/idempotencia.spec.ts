import {
  calcularHashArquivo,
  calcularHashIdempotencia,
  canonicalizarIdempotencia,
  construirConflitoIdempotencia,
} from "../idempotencia";

describe("utilitários de idempotência", () => {
  it("ordena propriedades recursivamente, omite undefined e preserva arrays", () => {
    expect(
      canonicalizarIdempotencia({
        z: 1,
        a: { y: undefined, b: 2, a: 1 },
        lista: [{ z: 2, a: 1 }, "B", "A"],
      }),
    ).toBe('{"a":{"a":1,"b":2},"lista":[{"a":1,"z":2},"B","A"],"z":1}');
  });

  it("normaliza UUIDs sem alterar outras strings", () => {
    expect(
      canonicalizarIdempotencia({
        id: "550E8400-E29B-41D4-A716-446655440000",
        texto: "ABC",
      }),
    ).toBe('{"id":"550e8400-e29b-41d4-a716-446655440000","texto":"ABC"}');
  });

  it("produz o mesmo hash para objetos semanticamente iguais", () => {
    expect(calcularHashIdempotencia({ b: 2, a: 1 })).toBe(
      calcularHashIdempotencia({ a: 1, b: 2 }),
    );
  });

  it("considera ordem de arrays e bytes de arquivos", () => {
    expect(calcularHashIdempotencia([1, 2])).not.toBe(
      calcularHashIdempotencia([2, 1]),
    );
    expect(calcularHashArquivo(Buffer.from("a"))).not.toBe(
      calcularHashArquivo(Buffer.from("b")),
    );
  });

  it("constrói o conflito público estável", () => {
    expect(construirConflitoIdempotencia("OPERACAO_JA_PROCESSADA")).toEqual({
      codigo: "OPERACAO_JA_PROCESSADA",
      mensagem:
        "A operação anterior foi concluída. Nenhuma nova alteração foi feita.",
      erros: [
        {
          campo: "chaveIdempotencia",
          codigo: "OPERACAO_JA_PROCESSADA",
          mensagem:
            "A operação anterior foi concluída. Nenhuma nova alteração foi feita.",
        },
      ],
    });
  });
});
