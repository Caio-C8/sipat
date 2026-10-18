import type { SenhaHasher } from "../../../common/security/senha-hasher";
import {
  provisionarPrimeiroAdministrador,
  ProvisionamentoAdministradorRecusadoError,
} from "../provisionamento-admin";

describe("provisionamento do primeiro administrador", () => {
  const dados = {
    nome: "Administrador Inicial",
    email: "admin@example.com",
    senha: "uma senha inicial segura",
  };

  function criarCenario(totalUsuarios: number) {
    const create = jest.fn();
    const transaction = {
      $executeRaw: jest.fn(),
      usuario: {
        count: jest.fn().mockResolvedValue(totalUsuarios),
        create,
      },
    };
    const database = {
      $transaction: jest.fn(
        (operacao: (cliente: typeof transaction) => Promise<void>) =>
          operacao(transaction),
      ),
    };
    const senhaHasher = {
      criarHash: jest.fn().mockResolvedValue("hash-seguro"),
    } as unknown as SenhaHasher;

    return { database, transaction, create, senhaHasher };
  }

  it("cria exatamente um administrador ativo sem registrar a senha", async () => {
    const cenario = criarCenario(0);

    await provisionarPrimeiroAdministrador(
      cenario.database as never,
      cenario.senhaHasher,
      dados,
    );

    expect(cenario.transaction.$executeRaw).toHaveBeenCalledTimes(1);
    expect(cenario.create).toHaveBeenCalledWith({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: "hash-seguro",
        perfil: "ADMINISTRADOR",
        ativo: true,
        createdById: null,
      },
    });
  });

  it("recusa execução quando já existe qualquer usuário", async () => {
    const cenario = criarCenario(1);

    await expect(
      provisionarPrimeiroAdministrador(
        cenario.database as never,
        cenario.senhaHasher,
        dados,
      ),
    ).rejects.toBeInstanceOf(ProvisionamentoAdministradorRecusadoError);
    expect(cenario.create).not.toHaveBeenCalled();
  });
});
