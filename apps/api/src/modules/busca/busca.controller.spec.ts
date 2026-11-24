import { BuscaController } from "./busca.controller";
import { CHAVE_PERFIS_PERMITIDOS } from "../auth/auth.constants";

describe("BuscaController", () => {
  it("permite somente os dois perfis de leitura compartilhada", () => {
    expect(
      Reflect.getMetadata(
        CHAVE_PERFIS_PERMITIDOS,
        BuscaController.prototype.buscar,
      ),
    ).toEqual(["ADMINISTRADOR", "DIRETOR_PATRIMONIO"]);
  });

  it("devolve somente a resposta pública da busca agregada", async () => {
    const dados = { termo: "mesa", grupos: [] };
    const service = { buscar: jest.fn().mockResolvedValue(dados) };
    const controller = new BuscaController(service as never);

    await expect(
      controller.buscar({ termo: "mesa", limite: 5 }),
    ).resolves.toEqual({
      status: 200,
      sucesso: true,
      mensagem: "Busca concluída com sucesso.",
      dados,
    });
    expect(service.buscar).toHaveBeenCalledWith("mesa", 5);
  });
});
