import { BuscaService } from "./busca.service";

describe("BuscaService", () => {
  it("mantém os quinze grupos e cria Ver todos apenas para lista filtrável truncada", async () => {
    const repository = {
      buscar: jest.fn().mockResolvedValue([
        {
          dominio: "PATRIMONIOS",
          id: "11111111-1111-4111-8111-111111111111",
          identificador: "123",
          titulo: "Mesa",
          complemento: null,
          destino: "/patrimonios/11111111-1111-4111-8111-111111111111",
          total: 8n,
          posicao: 1n,
        },
      ]),
    };
    const service = new BuscaService(repository as never);

    const resultado = await service.buscar("mesa grande", 5);

    expect(resultado.grupos).toHaveLength(15);
    expect(resultado.grupos[0]).toMatchObject({
      dominio: "PATRIMONIOS",
      total: 8,
      truncado: true,
      verTodosDestino: "/patrimonios?busca=mesa+grande",
    });
    expect(
      resultado.grupos.find((grupo) => grupo.dominio === "DEPRECIACOES"),
    ).toMatchObject({
      total: 0,
      verTodosDestino: null,
    });
  });
});
