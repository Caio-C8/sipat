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
import type { DespachanteEmailAuth } from "../despachante-email";
import type { SessaoRepository } from "../sessao.repository";
import { calcularHashTokenRedefinicaoSenha } from "../token-redefinicao";

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
    atualizarSenhaSeAtual: jest.fn(),
    listarSessoesAtivas: jest.fn(),
    revogarSessoes: jest.fn(),
    revogarTodasSessoes: jest.fn(),
    criarSessao: jest.fn(),
    limparTentativasLogin: jest.fn(),
    limparTentativasOperacaoSenha: jest.fn(),
    invalidarRedefinicaoSenha: jest.fn(),
    consumirRedefinicaoSenhaSeValida: jest.fn(),
  } as unknown as AuthRepository;
  const authRepository = {
    limparTentativasExpiradas: jest.fn(),
    buscarUsuarioParaLogin: jest.fn(),
    buscarUsuarioParaAlteracaoSenha: jest.fn(),
    reservarTentativaLogin: jest.fn(),
    limparTentativasOperacaoSenhaExpiradas: jest.fn(),
    reservarTentativaOperacaoSenha: jest.fn(),
    buscarUsuarioAtivoParaRecuperacao: jest.fn(),
    buscarRedefinicaoParaConsumo: jest.fn(),
    substituirRedefinicaoSenha: jest.fn(),
    executarTransacaoSerializavel: jest.fn(
      (operacao: (repository: AuthRepository) => Promise<unknown>) =>
        operacao(repositoryTransacao),
    ),
  } as unknown as AuthRepository;
  const senhaHasher = {
    criarHash: jest.fn(),
    verificarHash: jest.fn(),
  } as unknown as SenhaHasher;
  const capacidadeArgon2 = {
    executar: jest.fn((operacao: () => Promise<unknown>) => operacao()),
  } as unknown as CapacidadeArgon2;
  const despachanteEmail = {
    despachar: jest.fn().mockReturnValue(true),
  } as unknown as DespachanteEmailAuth;
  const config = {
    getOrThrow: jest.fn((chave: keyof EnvironmentVariables) => {
      if (chave === "APP_ENV") return "test";
      if (chave === "AUTH_RATE_LIMIT_HMAC_SECRET")
        return "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY";
      if (chave === "AUTH_PASSWORD_RESET_ENABLED") return true;
      if (chave === "AUTH_PASSWORD_RESET_URL")
        return "https://sipat.example/redefinir-senha";
      throw new Error(`Configuração inesperada: ${chave}`);
    }),
  } as unknown as ConfigService<EnvironmentVariables, true>;
  const service = new AuthService(
    sessoes,
    authRepository,
    senhaHasher,
    capacidadeArgon2,
    config,
    despachanteEmail,
  );

  function sessaoValida(
    perfil: PerfilUsuario = "ADMINISTRADOR",
  ): SessaoParaAutenticacao {
    return {
      id: "5826835a-bb5b-432a-b8b8-2c7622bbfabc",
      expiraAt: new Date("2026-10-18T20:00:00.000Z"),
      ultimaAtividadeAt: new Date("2026-10-18T11:56:00.000Z"),
      revogadoAt: null,
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
      authRepository.reservarTentativaOperacaoSenha as jest.Mock
    ).mockResolvedValue(null);
    (
      repositoryTransacao.atualizarUltimoLoginSeAtivo as jest.Mock
    ).mockResolvedValue(true);
    (repositoryTransacao.atualizarSenhaSeAtual as jest.Mock).mockResolvedValue(
      true,
    );
    (repositoryTransacao.listarSessoesAtivas as jest.Mock).mockResolvedValue(
      [],
    );
    (repositoryTransacao.revogarSessoes as jest.Mock).mockResolvedValue(
      undefined,
    );
    (repositoryTransacao.revogarTodasSessoes as jest.Mock).mockResolvedValue(
      undefined,
    );
    (repositoryTransacao.criarSessao as jest.Mock).mockResolvedValue(undefined);
    (repositoryTransacao.limparTentativasLogin as jest.Mock).mockResolvedValue(
      undefined,
    );
    (
      repositoryTransacao.limparTentativasOperacaoSenha as jest.Mock
    ).mockResolvedValue(undefined);
    (
      repositoryTransacao.invalidarRedefinicaoSenha as jest.Mock
    ).mockResolvedValue(undefined);
    (
      repositoryTransacao.consumirRedefinicaoSenhaSeValida as jest.Mock
    ).mockResolvedValue(true);
    (authRepository.limparTentativasExpiradas as jest.Mock).mockResolvedValue(
      0,
    );
    (
      authRepository.limparTentativasOperacaoSenhaExpiradas as jest.Mock
    ).mockResolvedValue(0);
    (senhaHasher.criarHash as jest.Mock).mockResolvedValue("hash-novo");
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
      ultimaAtividadeAt: new Date(agora.getTime() - 5 * 60 * 1_000),
    });

    await service.autenticar(token);

    expect(atualizarAtividadeSeNecessario).toHaveBeenCalledTimes(1);
  });

  it("não escreve atividade antes de cinco minutos", async () => {
    buscarPorTokenHash.mockResolvedValue({
      ...sessaoValida(),
      ultimaAtividadeAt: new Date(agora.getTime() - (5 * 60 * 1_000 - 1)),
    });

    await service.autenticar(token);

    expect(atualizarAtividadeSeNecessario).not.toHaveBeenCalled();
  });

  it("expira pela atividade persistida em 30 minutos", async () => {
    buscarPorTokenHash.mockResolvedValue({
      ...sessaoValida(),
      ultimaAtividadeAt: new Date(agora.getTime() - 30 * 60 * 1_000),
    });

    await expect(service.autenticar(token)).resolves.toBeNull();
    expect(atualizarAtividadeSeNecessario).not.toHaveBeenCalled();
  });

  it("mantém a janela efetiva de inatividade entre aproximadamente 25 e 30 minutos", async () => {
    const atividadePersistida = new Date("2026-10-18T12:00:00.000Z");
    buscarPorTokenHash.mockResolvedValue({
      ...sessaoValida(),
      expiraAt: new Date("2026-10-18T20:00:00.000Z"),
      ultimaAtividadeAt: atividadePersistida,
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
        expiraAt: expiraEm,
        ultimaAtividadeAt: new Date(Date.now() - 60_000),
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
    ["expirada", { ...sessaoValida(), expiraAt: agora }],
    ["revogada", { ...sessaoValida(), revogadoAt: agora }],
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
        expiraAt: new Date("2026-10-18T20:00:00.000Z"),
        ultimaAtividadeAt: agora,
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

  it("altera a própria senha e revoga todas as sessões", async () => {
    const usuario = {
      ativo: true,
      senha: "hash-atual",
    };
    (
      authRepository.buscarUsuarioParaAlteracaoSenha as jest.Mock
    ).mockResolvedValue(usuario);
    (senhaHasher.verificarHash as jest.Mock).mockResolvedValue(true);

    await service.alterarSenha(identidadeBase.id, {
      senhaAtual: "senha atual",
      novaSenha: "uma nova senha segura",
      confirmacaoNovaSenha: "uma nova senha segura",
    });

    expect(capacidadeArgon2.executar).toHaveBeenCalledTimes(1);
    expect(senhaHasher.verificarHash).toHaveBeenCalledWith(
      "hash-atual",
      "senha atual",
    );
    expect(senhaHasher.criarHash).toHaveBeenCalledWith("uma nova senha segura");
    expect(repositoryTransacao.atualizarSenhaSeAtual).toHaveBeenCalledWith(
      identidadeBase.id,
      "hash-atual",
      "hash-novo",
      agora,
    );
    expect(repositoryTransacao.revogarTodasSessoes).toHaveBeenCalledWith(
      identidadeBase.id,
      agora,
    );
    expect(repositoryTransacao.invalidarRedefinicaoSenha).toHaveBeenCalledWith(
      identidadeBase.id,
      agora,
    );
    expect(
      repositoryTransacao.limparTentativasOperacaoSenha,
    ).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/));
  });

  it("rejeita senha atual inválida sem criar hash nem modificar sessão", async () => {
    (
      authRepository.buscarUsuarioParaAlteracaoSenha as jest.Mock
    ).mockResolvedValue({ ativo: true, senha: "hash-atual" });
    (senhaHasher.verificarHash as jest.Mock).mockResolvedValue(false);

    const erro = await service
      .alterarSenha(identidadeBase.id, {
        senhaAtual: "incorreta",
        novaSenha: "uma nova senha segura",
        confirmacaoNovaSenha: "uma nova senha segura",
      })
      .catch((valor: unknown) => valor);

    expect(erro).toBeInstanceOf(UnauthorizedException);
    expect((erro as UnauthorizedException).getResponse()).toEqual({
      codigo: "SENHA_ATUAL_INVALIDA",
      mensagem: "A senha atual é inválida.",
      erros: [],
    });
    expect(senhaHasher.criarHash).not.toHaveBeenCalled();
    expect(authRepository.executarTransacaoSerializavel).not.toHaveBeenCalled();
    expect(repositoryTransacao.revogarTodasSessoes).not.toHaveBeenCalled();
  });

  it("rejeita alteração concorrente quando o hash atual já mudou", async () => {
    (
      authRepository.buscarUsuarioParaAlteracaoSenha as jest.Mock
    ).mockResolvedValue({ ativo: true, senha: "hash-atual" });
    (senhaHasher.verificarHash as jest.Mock).mockResolvedValue(true);
    (repositoryTransacao.atualizarSenhaSeAtual as jest.Mock).mockResolvedValue(
      false,
    );

    await expect(
      service.alterarSenha(identidadeBase.id, {
        senhaAtual: "senha atual",
        novaSenha: "uma nova senha segura",
        confirmacaoNovaSenha: "uma nova senha segura",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repositoryTransacao.revogarTodasSessoes).not.toHaveBeenCalled();
    expect(
      repositoryTransacao.limparTentativasOperacaoSenha,
    ).not.toHaveBeenCalled();
  });

  it("aplica à alteração de senha o rate limit persistente do ambiente", async () => {
    (
      authRepository.reservarTentativaOperacaoSenha as jest.Mock
    ).mockResolvedValue(new Date(agora.getTime() + 60_000));

    await expect(
      service.alterarSenha(identidadeBase.id, {
        senhaAtual: "senha atual",
        novaSenha: "uma nova senha segura",
        confirmacaoNovaSenha: "uma nova senha segura",
      }),
    ).rejects.toBeInstanceOf(MuitasRequisicoesException);
    expect(authRepository.reservarTentativaOperacaoSenha).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/),
      agora,
      3,
      60_000,
    );
    expect(
      authRepository.buscarUsuarioParaAlteracaoSenha,
    ).not.toHaveBeenCalled();
  });

  it("cria redefinição somente para usuário ativo e despacha sem expor o token", async () => {
    (
      authRepository.buscarUsuarioAtivoParaRecuperacao as jest.Mock
    ).mockResolvedValue({ id: identidadeBase.id, email: identidadeBase.email });
    (authRepository.substituirRedefinicaoSenha as jest.Mock).mockResolvedValue(
      undefined,
    );

    await service.solicitarRedefinicaoSenha({ email: identidadeBase.email });

    const mensagem = (despachanteEmail.despachar as jest.Mock).mock
      .calls[0]![0];
    const token = new URL(mensagem.link as string).searchParams.get("token");
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(authRepository.substituirRedefinicaoSenha).toHaveBeenCalledWith(
      identidadeBase.id,
      calcularHashTokenRedefinicaoSenha(token!),
      new Date(agora.getTime() + 15 * 60 * 1_000),
      agora,
    );
    expect(JSON.stringify(mensagem)).not.toContain(
      calcularHashTokenRedefinicaoSenha(token!),
    );
  });

  it("mantém solicitação neutra para conta inexistente ou inativa", async () => {
    (
      authRepository.buscarUsuarioAtivoParaRecuperacao as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      service.solicitarRedefinicaoSenha({ email: "ausente@example.com" }),
    ).resolves.toBeUndefined();

    expect(authRepository.reservarTentativaOperacaoSenha).toHaveBeenCalled();
    expect(authRepository.substituirRedefinicaoSenha).not.toHaveBeenCalled();
    expect(despachanteEmail.despachar).not.toHaveBeenCalled();
  });

  it("mantém o fluxo indisponível de forma neutra quando a flag está desligada", async () => {
    (config.getOrThrow as jest.Mock).mockReturnValueOnce(false);

    await expect(
      service.solicitarRedefinicaoSenha({ email: identidadeBase.email }),
    ).resolves.toBeUndefined();
    expect(
      authRepository.reservarTentativaOperacaoSenha,
    ).not.toHaveBeenCalled();

    (config.getOrThrow as jest.Mock).mockReturnValueOnce(false);
    await expect(
      service.redefinirSenha({
        token: "A".repeat(43),
        novaSenha: "uma nova senha segura",
        confirmacaoNovaSenha: "uma nova senha segura",
      }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("redefine senha com consumo, revogação e notificação posteriores", async () => {
    const redefinicao = {
      id: "78df5e9c-3e60-4a8e-a4d4-8ca70221f4f4",
      tokenHash: "b".repeat(64),
      expiraAt: new Date(agora.getTime() + 60_000),
      consumidoAt: null,
      usuario: {
        id: identidadeBase.id,
        email: identidadeBase.email,
        ativo: true,
        senha: "hash-atual",
      },
    };
    (
      authRepository.buscarRedefinicaoParaConsumo as jest.Mock
    ).mockResolvedValue(redefinicao);

    await service.redefinirSenha({
      token: "A".repeat(43),
      novaSenha: "uma nova senha segura",
      confirmacaoNovaSenha: "uma nova senha segura",
    });

    expect(
      repositoryTransacao.consumirRedefinicaoSenhaSeValida,
    ).toHaveBeenCalledWith(
      redefinicao.id,
      calcularHashTokenRedefinicaoSenha("A".repeat(43)),
      agora,
    );
    expect(repositoryTransacao.revogarTodasSessoes).toHaveBeenCalledWith(
      identidadeBase.id,
      agora,
    );
    expect(despachanteEmail.despachar).toHaveBeenCalledWith({
      tipo: "SENHA_REDEFINIDA",
      destinatario: identidadeBase.email,
    });
  });

  it.each([
    ["inexistente", null],
    [
      "expirada",
      {
        id: "78df5e9c-3e60-4a8e-a4d4-8ca70221f4f4",
        tokenHash: "b".repeat(64),
        expiraAt: agora,
        consumidoAt: null,
        usuario: {
          id: identidadeBase.id,
          email: identidadeBase.email,
          ativo: true,
          senha: "hash-atual",
        },
      },
    ],
  ])("usa a mesma falha para token %s", async (_caso, redefinicao) => {
    (
      authRepository.buscarRedefinicaoParaConsumo as jest.Mock
    ).mockResolvedValue(redefinicao);

    await expect(
      service.redefinirSenha({
        token: "A".repeat(43),
        novaSenha: "uma nova senha segura",
        confirmacaoNovaSenha: "uma nova senha segura",
      }),
    ).rejects.toMatchObject({ status: 401 });
    expect(senhaHasher.criarHash).not.toHaveBeenCalled();
  });
});
