import { ConflictException, NotFoundException } from "@nestjs/common";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { Prisma } from "@repo/database";
import type { SenhaHasher } from "../../../common/security/senha-hasher";
import type { UsuarioDetalhePayload } from "../types";
import type { UsuariosRepository } from "../usuarios.repository";
import { UsuariosService } from "../usuarios.service";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const USUARIO_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";

const identidade: IdentidadeAutenticada = {
  id: ADMIN_ID,
  nome: "Administração",
  email: "admin@example.com",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: false,
};

function usuario(
  sobrescritas: Partial<UsuarioDetalhePayload> = {},
): UsuarioDetalhePayload {
  return {
    id: USUARIO_ID,
    nome: "Usuário de Teste",
    email: "usuario@example.com",
    perfil: "DIRETOR_PATRIMONIO",
    ativo: true,
    createdAt: new Date("2026-10-17T12:00:00.000Z"),
    updatedAt: null,
    createdById: ADMIN_ID,
    ...sobrescritas,
  };
}

function criarDependencias() {
  const repository = {
    criar: jest.fn(),
    listar: jest.fn(),
    contar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarParaRegra: jest.fn(),
    buscarIdPorEmail: jest.fn(),
    alterar: jest.fn(),
    contarAdministradoresAtivos: jest.fn(),
    alterarSituacao: jest.fn(),
    revogarSessoesAtivas: jest.fn(),
    executarTransacaoSerializavel: jest.fn(),
  };
  const senhaHasher = { criarHash: jest.fn() };

  return {
    repository,
    senhaHasher,
    service: new UsuariosService(
      repository as unknown as UsuariosRepository,
      senhaHasher as unknown as SenhaHasher,
    ),
  };
}

describe("UsuariosService", () => {
  it("normaliza e-mail, cria o hash antes da persistência e audita pela sessão", async () => {
    const { repository, senhaHasher, service } = criarDependencias();
    repository.buscarIdPorEmail.mockResolvedValue(null);
    senhaHasher.criarHash.mockResolvedValue("hash-seguro");
    repository.criar.mockResolvedValue(usuario());

    await service.criar(
      {
        nome: "Usuário de Teste",
        email: "  USUA\u0301RIO@EXAMPLE.COM  ",
        senha: "frase secreta inicial",
        perfil: "DIRETOR_PATRIMONIO",
      },
      identidade,
    );

    expect(senhaHasher.criarHash).toHaveBeenCalledWith("frase secreta inicial");
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "usuário@example.com",
        senha: "hash-seguro",
        ativo: true,
        createdBy: { connect: { id: ADMIN_ID } },
      }),
    );
  });

  it("traduz a corrida de unicidade do banco para conflito público", async () => {
    const { repository, senhaHasher, service } = criarDependencias();
    repository.buscarIdPorEmail.mockResolvedValue(null);
    senhaHasher.criarHash.mockResolvedValue("hash-seguro");
    repository.criar.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "7.8.0",
      }),
    );

    await expect(
      service.criar(
        {
          nome: "Usuário",
          email: "usuario@example.com",
          senha: "frase secreta inicial",
          perfil: "DIRETOR_PATRIMONIO",
        },
        identidade,
      ),
    ).rejects.toMatchObject({
      response: { codigo: "EMAIL_USUARIO_JA_EXISTENTE" },
    });
  });

  it("lista com paginação e total consistentes", async () => {
    const { repository, service } = criarDependencias();
    repository.listar.mockResolvedValue([usuario()]);
    repository.contar.mockResolvedValue(21);

    const resultado = await service.listar({ pagina: 2, limite: 20 });

    expect(repository.listar).toHaveBeenCalledWith({
      where: {},
      skip: 20,
      take: 20,
    });
    expect(resultado).toMatchObject({
      total: 21,
      pagina: 2,
      ultimaPagina: 2,
      limite: 20,
    });
  });

  it("rejeita consulta e alteração de usuário inexistente", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarPorId.mockResolvedValue(null);
    repository.buscarParaRegra.mockResolvedValue(null);

    await expect(service.consultar(USUARIO_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.alterar(USUARIO_ID, { nome: "Outro nome" }, identidade),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("proíbe que o administrador altere o próprio perfil", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarParaRegra.mockResolvedValue({
      id: ADMIN_ID,
      perfil: "ADMINISTRADOR",
      ativo: true,
    });

    await expect(
      service.alterar(ADMIN_ID, { perfil: "DIRETOR_PATRIMONIO" }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "AUTOALTERACAO_PERFIL_NAO_PERMITIDA" },
    });
  });

  it("proíbe a autoinativação antes de iniciar a transação", async () => {
    const { repository, service } = criarDependencias();

    await expect(
      service.alterarSituacao(ADMIN_ID, { ativo: false }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "AUTOINATIVACAO_NAO_PERMITIDA" },
    });
    expect(repository.executarTransacaoSerializavel).not.toHaveBeenCalled();
  });

  it("protege o último administrador ativo", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarParaRegra.mockResolvedValue({
      id: USUARIO_ID,
      perfil: "ADMINISTRADOR",
      ativo: true,
    });
    repository.contarAdministradoresAtivos.mockResolvedValue(1);
    repository.executarTransacaoSerializavel.mockImplementation(
      (operacao: (repositorio: UsuariosRepository) => Promise<unknown>) =>
        operacao(repository as unknown as UsuariosRepository),
    );

    await expect(
      service.alterarSituacao(USUARIO_ID, { ativo: false }, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "ULTIMO_ADMINISTRADOR_ATIVO" },
    });
    expect(repository.alterarSituacao).not.toHaveBeenCalled();
  });

  it("inativa e revoga todas as sessões na mesma transação", async () => {
    const { repository, service } = criarDependencias();
    const inativo = usuario({ ativo: false });
    repository.buscarParaRegra.mockResolvedValue({
      id: USUARIO_ID,
      perfil: "DIRETOR_PATRIMONIO",
      ativo: true,
    });
    repository.alterarSituacao.mockResolvedValue(inativo);
    repository.revogarSessoesAtivas.mockResolvedValue(undefined);
    repository.executarTransacaoSerializavel.mockImplementation(
      (operacao: (repositorio: UsuariosRepository) => Promise<unknown>) =>
        operacao(repository as unknown as UsuariosRepository),
    );

    await expect(
      service.alterarSituacao(USUARIO_ID, { ativo: false }, identidade),
    ).resolves.toEqual(inativo);
    expect(repository.alterarSituacao).toHaveBeenCalledWith(USUARIO_ID, false);
    expect(repository.revogarSessoesAtivas).toHaveBeenCalledWith(USUARIO_ID);
    expect(
      repository.alterarSituacao.mock.invocationCallOrder[0]!,
    ).toBeLessThan(
      repository.revogarSessoesAtivas.mock.invocationCallOrder[0]!,
    );
  });

  it("não revoga sessões ao ativar um usuário", async () => {
    const { repository, service } = criarDependencias();
    const ativo = usuario({ ativo: true });
    repository.buscarParaRegra.mockResolvedValue({
      id: USUARIO_ID,
      perfil: "DIRETOR_PATRIMONIO",
      ativo: false,
    });
    repository.alterarSituacao.mockResolvedValue(ativo);
    repository.executarTransacaoSerializavel.mockImplementation(
      (operacao: (repositorio: UsuariosRepository) => Promise<unknown>) =>
        operacao(repository as unknown as UsuariosRepository),
    );

    await service.alterarSituacao(USUARIO_ID, { ativo: true }, identidade);

    expect(repository.revogarSessoesAtivas).not.toHaveBeenCalled();
  });

  it("expõe conflitos de regra como ConflictException", async () => {
    const { repository, service } = criarDependencias();
    repository.buscarIdPorEmail.mockResolvedValue(USUARIO_ID);

    await expect(
      service.criar(
        {
          nome: "Usuário",
          email: "usuario@example.com",
          senha: "frase secreta inicial",
          perfil: "DIRETOR_PATRIMONIO",
        },
        identidade,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
