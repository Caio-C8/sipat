import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { PerfilUsuario } from "@repo/contracts";
import { Prisma } from "@repo/database";
import { MuitasRequisicoesException } from "../../../common/http/muitas-requisicoes.exception";
import type { SenhaHasher } from "../../../common/security/senha-hasher";
import type { EnvironmentVariables } from "../../../environment";
import type { AuthRepository } from "../auth.repository";
import { AuthService } from "../auth.service";
import type { SessaoParaAutenticacao } from "../auth.types";
import type { CapacidadeArgon2 } from "../capacidade-argon2";
import type { SessaoRepository } from "../sessao.repository";

describe("AuthService", () => {
  const agora = new Date("2026-10-18T12:00:00.000Z");
  const token = "A".repeat(43);
  const identidadeBase = {
    id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    nome: "Maria da Silva",
    email: "maria@example.com",
  } as const;

  const buscarPorTokenHash = jest.fn();
  const atualizarAtividadeSeNecessario = jest.fn();
  const revogarPorTokenHash = jest.fn();
  const sessoes = {
    buscarPorTokenHash,
    atualizarAtividadeSeNecessario,
    revogarPorTokenHash,
  } as unknown as SessaoRepository;

  const repositoryTransacao = {
    atualizarUltimoLoginSeAtivo: jest.fn(),
    listarSessoesAtivas: jest.fn(),
    revogarSessoes: jest.fn(),
    criarSessao: jest.fn(),
    limparTentativasLogin: jest.fn(),
  } as unknown as AuthRepository;
  const authRepository = {
    limparTentativasExpiradas: jest.fn(),
    buscarUsuarioParaLogin: jest.fn(),
    reservarTentativaLogin: jest.fn(),
    executarTransacaoSerializavel: jest.fn(
      (operacao: (repository: AuthRepository) => Promise<unknown>) =>
        operacao(repositoryTransacao),
    ),
  } as unknown as AuthRepository;
  const senhaHasher = {
    verificarHash: jest.fn(),
  } as unknown as SenhaHasher;
  const capacidadeArgon2 = {
    executar: jest.fn((operacao: () => Promise<unknown>) => operacao()),
  } as unknown as CapacidadeArgon2;
  const config = {
    getOrThrow: jest.fn((chave: keyof EnvironmentVariables) => {
      if (chave === "APP_ENV") return "test";
      if (chave === "AUTH_RATE_LIMIT_HMAC_SECRET")
        return "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY";
      throw new Error(`Configuração inesperada: ${chave}`);
    }),
  } as unknown as ConfigService<EnvironmentVariables, true>;
  const service = new AuthService(
    sessoes,
    authRepository,
    senhaHasher,
    capacidadeArgon2,
    config,
  );

  function sessaoValida(
    perfil: PerfilUsuario = "ADMINISTRADOR",
  ): SessaoParaAutenticacao {
    return {
      id: "5826835a-bb5b-432a-b8b8-2c7622bbfabc",
      expiresAt: new Date("2026-10-18T20:00:00.000Z"),
      lastActivityAt: new Date("2026-10-18T11:56:00.000Z"),
      revokedAt: null,
      usuario: {
        ...identidadeBase,
        perfil,
        ativo: true,
      },
    };
  }

  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    jest.setSystemTime(agora);
    jest.clearAllMocks();
    (
      authRepository.executarTransacaoSerializavel as jest.Mock
    ).mockImplementation(
      (operacao: (repository: AuthRepository) => Promise<unknown>) =>
        operacao(repositoryTransacao),
    );
    (capacidadeArgon2.executar as jest.Mock).mockImplementation(
      (operacao: () => Promise<unknown>) => operacao(),
    );
    (authRepository.reservarTentativaLogin as jest.Mock).mockResolvedValue(
      null,
    );
    (
      repositoryTransacao.atualizarUltimoLoginSeAtivo as jest.Mock
    ).mockResolvedValue(true);
    (repositoryTransacao.listarSessoesAtivas as jest.Mock).mockResolvedValue(
      [],
    );
    (repositoryTransacao.revogarSessoes as jest.Mock).mockResolvedValue(
      undefined,
    );
    (repositoryTransacao.criarSessao as jest.Mock).mockResolvedValue(undefined);
    (repositoryTransacao.limparTentativasLogin as jest.Mock).mockResolvedValue(
      undefined,
    );
    (authRepository.limparTentativasExpiradas as jest.Mock).mockResolvedValue(
      0,
    );
  });

  it.each(["ADMINISTRADOR", "DIRETOR_PATRIMONIO"] as const)(
    "autentica sessão válida do perfil %s",
    async (perfil) => {
      buscarPorTokenHash.mockResolvedValue(sessaoValida(perfil));

      await expect(service.autenticar(token)).resolves.toEqual({
        ...identidadeBase,
        perfil,
      });
      expect(buscarPorTokenHash).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{64}$/),
      );
    },
  );

  it("atualiza atividade somente após o agrupamento de cinco minutos", async () => {
    buscarPorTokenHash.mockResolvedValue({
      ...sessaoValida(),
      lastActivityAt: new Date(agora.getTime() - 5 * 60 * 1_000),
    });

    await service.autenticar(token);

    expect(atualizarAtividadeSeNecessario).toHaveBeenCalledTimes(1);
  });

  it("não escreve atividade antes de cinco minutos", async () => {
    buscarPorTokenHash.mockResolvedValue({
      ...sessaoValida(),
      lastActivityAt: new Date(agora.getTime() - (5 * 60 * 1_000 - 1)),
    });

    await service.autenticar(token);

    expect(atualizarAtividadeSeNecessario).not.toHaveBeenCalled();
  });

  it("expira pela atividade persistida em 30 minutos", async () => {
    buscarPorTokenHash.mockResolvedValue({
      ...sessaoValida(),
      lastActivityAt: new Date(agora.getTime() - 30 * 60 * 1_000),
    });

    await expect(service.autenticar(token)).resolves.toBeNull();
    expect(atualizarAtividadeSeNecessario).not.toHaveBeenCalled();
  });

  it("mantém a janela efetiva de inatividade entre aproximadamente 25 e 30 minutos", async () => {
    const atividadePersistida = new Date("2026-10-18T12:00:00.000Z");
    buscarPorTokenHash.mockResolvedValue({
      ...sessaoValida(),
      expiresAt: new Date("2026-10-18T20:00:00.000Z"),
      lastActivityAt: atividadePersistida,
    });

    jest.setSystemTime(new Date("2026-10-18T12:04:59.999Z"));
    await expect(service.autenticar(token)).resolves.toEqual(
      expect.objectContaining(identidadeBase),
    );
    expect(atualizarAtividadeSeNecessario).not.toHaveBeenCalled();

    jest.setSystemTime(new Date("2026-10-18T12:30:00.000Z"));
    await expect(service.autenticar(token)).resolves.toBeNull();

    const ultimaRequestAceita = new Date("2026-10-18T12:04:59.999Z");
    expect(Date.now() - ultimaRequestAceita.getTime()).toBe(
      25 * 60 * 1_000 + 1,
    );
  });

  it("aplica a duração absoluta de oito horas sem renová-la por atividade", async () => {
    const expiraEm = new Date("2026-10-18T20:00:00.000Z");
    buscarPorTokenHash.mockImplementation(() =>
      Promise.resolve({
        ...sessaoValida(),
        expiresAt: expiraEm,
        lastActivityAt: new Date(Date.now() - 60_000),
      }),
    );

    jest.setSystemTime(new Date(expiraEm.getTime() - 1));
    await expect(service.autenticar(token)).resolves.toEqual(
      expect.objectContaining(identidadeBase),
    );

    jest.setSystemTime(expiraEm);
    await expect(service.autenticar(token)).resolves.toBeNull();
  });

  it("rejeita token malformado sem consultar o banco", async () => {
    await expect(service.autenticar("invalido")).resolves.toBeNull();
    expect(buscarPorTokenHash).not.toHaveBeenCalled();
  });

  it.each([
    ["inexistente", null],
    ["expirada", { ...sessaoValida(), expiresAt: agora }],
    ["revogada", { ...sessaoValida(), revokedAt: agora }],
    [
      "de usuário inativo",
      {
        ...sessaoValida(),
        usuario: { ...sessaoValida().usuario, ativo: false },
      },
    ],
  ])("rejeita sessão %s", async (_caso, sessao) => {
    buscarPorTokenHash.mockResolvedValue(sessao);
    await expect(service.autenticar(token)).resolves.toBeNull();
  });

  it.each([
    ["senha inválida", true, false],
    ["usuário inativo", false, true],
    ["usuário inexistente", null, false],
  ])(
    "mantém resposta pública uniforme para %s",
    async (_caso, ativo, senhaValida) => {
      (authRepository.buscarUsuarioParaLogin as jest.Mock).mockResolvedValue(
        ativo === null
          ? null
          : {
              ...identidadeBase,
              perfil: "ADMINISTRADOR",
              ativo,
              senha: "hash",
            },
      );
      (senhaHasher.verificarHash as jest.Mock).mockResolvedValue(senhaValida);

      const erro = await service
        .login({ email: identidadeBase.email, senha: "senha" })
        .catch((valor: unknown) => valor);

      expect(erro).toBeInstanceOf(UnauthorizedException);
      expect((erro as UnauthorizedException).getResponse()).toEqual({
        codigo: "CREDENCIAIS_INVALIDAS",
        mensagem: "E-mail ou senha inválidos.",
        erros: [],
      });
      expect(senhaHasher.verificarHash).toHaveBeenCalledTimes(1);
    },
  );

  it("cria sessão, atualiza último login e revoga a mais antiga ao atingir cinco", async () => {
    (authRepository.buscarUsuarioParaLogin as jest.Mock).mockResolvedValue({
      ...identidadeBase,
      perfil: "ADMINISTRADOR",
      ativo: true,
      senha: "hash",
    });
    (senhaHasher.verificarHash as jest.Mock).mockResolvedValue(true);
    const ids = Array.from({ length: 5 }, (_, indice) => ({
      id: `00000000-0000-4000-8000-${String(indice).padStart(12, "0")}`,
    }));
    (repositoryTransacao.listarSessoesAtivas as jest.Mock).mockResolvedValue(
      ids,
    );

    const resultado = await service.login({
      email: identidadeBase.email,
      senha: "senha",
    });

    expect(resultado.identidade).toEqual({
      ...identidadeBase,
      perfil: "ADMINISTRADOR",
    });
    expect(resultado.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(repositoryTransacao.revogarSessoes).toHaveBeenCalledWith(
      [ids[0]!.id],
      agora,
    );
    expect(repositoryTransacao.criarSessao).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: identidadeBase.id,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: new Date("2026-10-18T20:00:00.000Z"),
        lastActivityAt: agora,
      }),
    );
    expect(repositoryTransacao.limparTentativasLogin).toHaveBeenCalledTimes(1);
  });

  it("aplica o corte de inatividade ao consultar sessões que contam no limite", async () => {
    (authRepository.buscarUsuarioParaLogin as jest.Mock).mockResolvedValue({
      ...identidadeBase,
      perfil: "DIRETOR_PATRIMONIO",
      ativo: true,
      senha: "hash",
    });
    (senhaHasher.verificarHash as jest.Mock).mockResolvedValue(true);

    await service.login({ email: identidadeBase.email, senha: "senha" });

    expect(repositoryTransacao.listarSessoesAtivas).toHaveBeenCalledWith(
      identidadeBase.id,
      agora,
      new Date("2026-10-18T11:30:00.000Z"),
    );
  });

  it("limita a três repetições de conflito serializável e responde 429", async () => {
    (authRepository.buscarUsuarioParaLogin as jest.Mock).mockResolvedValue({
      ...identidadeBase,
      perfil: "ADMINISTRADOR",
      ativo: true,
      senha: "hash",
    });
    (senhaHasher.verificarHash as jest.Mock).mockResolvedValue(true);
    const conflito = new Prisma.PrismaClientKnownRequestError(
      "conflito controlado",
      { code: "P2034", clientVersion: "7.10.1" },
    );
    (
      authRepository.executarTransacaoSerializavel as jest.Mock
    ).mockRejectedValue(conflito);

    await expect(
      service.login({ email: identidadeBase.email, senha: "senha" }),
    ).rejects.toBeInstanceOf(MuitasRequisicoesException);
    expect(authRepository.executarTransacaoSerializavel).toHaveBeenCalledTimes(
      3,
    );
  });

  it("revoga somente o hash correspondente no logout", async () => {
    await service.logout(token);

    expect(revogarPorTokenHash).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/),
      agora,
    );
  });
});
