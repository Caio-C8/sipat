import {
  calcularHashArquivo,
  calcularHashIdempotencia,
  canonicalizarIdempotencia,
  construirConflitoIdempotencia,
  construirNamespaceLockIdempotencia,
} from "../idempotencia";

describe("utilitários de idempotência", () => {
  const vetoresHashV1 = [
    {
      nome: "ordenação recursiva, undefined, null e ordem dos arrays",
      entrada: {
        z: 1,
        a: { y: undefined, b: 2, a: 1 },
        lista: [{ z: 2, a: 1 }, undefined, null, "B", "A"],
      },
      canonico:
        '{"a":{"a":1,"b":2},"lista":[{"a":1,"z":2},null,null,"B","A"],"z":1}',
      digest:
        "0340415644ddcb2dcc933f77fe3eef86dca6a2f94f155fb206be64ba40d82e92",
    },
    {
      nome: "UUID com variação de caixa",
      entrada: {
        id: "550E8400-E29B-41D4-A716-446655440000",
        texto: "ABC",
      },
      canonico: '{"id":"550e8400-e29b-41d4-a716-446655440000","texto":"ABC"}',
      digest:
        "a76d49307c8af39e1f7251b4dc730218acbf5e6ec89e77c463d178a34efed749",
    },
    {
      nome: "Date, bigint, zero negativo e números não finitos",
      entrada: {
        data: new Date("2026-10-31T12:34:56.789Z"),
        infinito: Number.POSITIVE_INFINITY,
        inteiro: 9007199254740993n,
        menosInfinito: Number.NEGATIVE_INFINITY,
        menosZero: -0,
        nan: Number.NaN,
      },
      canonico:
        '{"data":"2026-10-31T12:34:56.789Z","infinito":null,"inteiro":"9007199254740993","menosInfinito":null,"menosZero":0,"nan":null}',
      digest:
        "a6ffbdf7da1b44371068c302b594cdb2b8b0baf6edbbbd649fef47a637c53bc0",
    },
    {
      nome: "objeto decimal com toJSON",
      entrada: {
        valorDecimal: { toJSON: () => "1234.5000" },
      },
      canonico: '{"valorDecimal":"1234.5000"}',
      digest:
        "b863f0e9578c35cce5c0991e77786a46837743a73356e5df8f701570594860a5",
    },
  ] as const;

  it.each(vetoresHashV1)("preserva o vetor V1: $nome", (vetor) => {
    expect(canonicalizarIdempotencia(vetor.entrada)).toBe(vetor.canonico);
    expect(calcularHashIdempotencia(vetor.entrada)).toBe(vetor.digest);
  });

  it("preserva o vetor V1 dos bytes de arquivo", () => {
    const conteudo = Buffer.from([0, 1, 2, 255]);

    expect(calcularHashArquivo(conteudo)).toBe(
      "3d1f57c984978ef98a18378c8166c1cb8ede02c03eeb6aee7e2f121dfeee3e56",
    );
  });

  it("isola o namespace dos locks por domínio", () => {
    const usuarioId = "11111111-1111-4111-8111-111111111111";
    const chave = "22222222-2222-4222-8222-222222222222";

    expect(
      construirNamespaceLockIdempotencia("movimentacao", usuarioId, chave),
    ).toBe(`movimentacao:${usuarioId}:${chave}`);
    expect(
      construirNamespaceLockIdempotencia("manutencao", usuarioId, chave),
    ).toBe(`manutencao:${usuarioId}:${chave}`);
    expect(
      construirNamespaceLockIdempotencia("reavaliacao", usuarioId, chave),
    ).toBe(`reavaliacao:${usuarioId}:${chave}`);
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
