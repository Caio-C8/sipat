import { BuscaRepository } from "./busca.repository";

describe("BuscaRepository", () => {
  it("parametriza e escapa curingas informados pelo usuário", async () => {
    const queryRaw = jest.fn().mockResolvedValue([]);
    const repository = new BuscaRepository({ $queryRaw: queryRaw } as never);

    await repository.buscar("50%_\\", 5);

    const valores = queryRaw.mock.calls[0]?.slice(1) as unknown[];
    expect(valores).toContain("%50\\%\\_\\\\%");
    expect(valores).toContain(5);
  });
});
