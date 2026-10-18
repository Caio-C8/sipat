import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { MuitasRequisicoesException } from "../src/common/http/muitas-requisicoes.exception";
import { SenhaHasher } from "../src/common/security/senha-hasher";
import type { EnvironmentVariables } from "../src/environment";
import { AuthRepository } from "../src/modules/auth/auth.repository";
import { AuthService } from "../src/modules/auth/auth.service";
import { CapacidadeArgon2 } from "../src/modules/auth/capacidade-argon2";
import type { DespachanteEmailAuth } from "../src/modules/auth/despachante-email";
import type { MensagemEmailAuth } from "../src/modules/auth/email.types";
import {
  provisionarPrimeiroAdministrador,
  ProvisionamentoAdministradorRecusadoError,
} from "../src/modules/auth/provisionamento-admin";
import { SessaoRepository } from "../src/modules/auth/sessao.repository";

const databaseUrl = process.env.AUTH_INTEGRATION_DATABASE_URL;
const describeComPostgres = databaseUrl ? describe : describe.skip;
const SEGREDO_TESTE = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY";

function criarConfig(
  ambiente: "development" | "test",
  concorrencia = 4,
  fila = 8,
): ConfigService<EnvironmentVariables, true> {
  return {
    getOrThrow: jest.fn((chave: keyof EnvironmentVariables) => {
      if (chave === "APP_ENV") return ambiente;
      if (chave === "AUTH_RATE_LIMIT_HMAC_SECRET") return SEGREDO_TESTE;
      if (chave === "AUTH_ARGON2_MAX_CONCURRENCY") return concorrencia;
      if (chave === "AUTH_ARGON2_MAX_QUEUE") return fila;
      if (chave === "AUTH_PASSWORD_RESET_ENABLED") return true;
      if (chave === "AUTH_PASSWORD_RESET_URL")
        return "https://sipat.example/redefinir-senha";
      throw new Error(`Configuração inesperada: ${chave}`);
    }),
  } as unknown as ConfigService<EnvironmentVariables, true>;
}

function criarAuthService(
  database: DatabaseClient,
  ambiente: "development" | "test",
  senhaHasher: SenhaHasher,
  mensagensEmail: MensagemEmailAuth[] = [],
): AuthService {
  const config = criarConfig(ambiente);

  return new AuthService(
    new SessaoRepository(database),
    new AuthRepository(database),
    senhaHasher,
    new CapacidadeArgon2(config),
    config,
    {
      despachar: jest.fn((mensagem: MensagemEmailAuth) => {
        mensagensEmail.push(mensagem);
        return true;
      }),
    } as unknown as DespachanteEmailAuth,
  );
}

describeComPostgres("autenticação concorrente no PostgreSQL", () => {
  let database: DatabaseClient;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!databaseUrl?.includes("/sipat_auth003_test")) {
      throw new Error(
        "AUTH_INTEGRATION_DATABASE_URL deve apontar para sipat_auth003_test.",
      );
    }

    database = createDatabaseClient(databaseUrl);
    await database.$connect();
  });

  afterAll(async () => database?.$disconnect());

  beforeEach(async () => {
    await database.$executeRawUnsafe(
      'TRUNCATE TABLE "redefinicoes_senha", "tentativas_operacoes_senha", "tentativas_login", "sessoes_usuarios", "usuarios" CASCADE',
    );
  });

  it("cria somente um administrador em provisionamentos concorrentes", async () => {
    const senhaHasher = {
      criarHash: jest.fn().mockResolvedValue("hash-controlado"),
    } as unknown as SenhaHasher;

    const resultados = await Promise.allSettled([
      provisionarPrimeiroAdministrador(database, senhaHasher, {
        nome: "Administradora Um",
        email: "admin-um@example.com",
        senha: "uma senha inicial segura",
      }),
      provisionarPrimeiroAdministrador(database, senhaHasher, {
        nome: "Administradora Dois",
        email: "admin-dois@example.com",
        senha: "outra senha inicial segura",
      }),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    const rejeitada = resultados.find(({ status }) => status === "rejected");
    expect(rejeitada).toEqual(
      expect.objectContaining({
        status: "rejected",
        reason: expect.any(ProvisionamentoAdministradorRecusadoError),
      }),
    );
    expect(await database.usuario.count()).toBe(1);
  });

  it("mantém no máximo cinco sessões ativas sob logins concorrentes", async () => {
    const senhaHasher = new SenhaHasher();
    const senha = "uma senha segura de integração";
    const usuario = await database.usuario.create({
      data: {
        nome: "Administradora",
        email: "admin@example.com",
        senha: await senhaHasher.criarHash(senha),
        perfil: "ADMINISTRADOR",
        ativo: true,
      },
    });
    const agora = new Date();
    await database.sessaoUsuario.createMany({
      data: [
        {
          usuarioId: usuario.id,
          tokenHash: "a".repeat(64),
          expiraAt: new Date(agora.getTime() - 1),
          ultimaAtividadeAt: agora,
        },
        {
          usuarioId: usuario.id,
          tokenHash: "b".repeat(64),
          expiraAt: new Date(agora.getTime() + 8 * 60 * 60 * 1_000),
          ultimaAtividadeAt: new Date(agora.getTime() - 30 * 60 * 1_000),
        },
      ],
    });
    const service = criarAuthService(database, "development", senhaHasher);

    const resultados = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        service.login({ email: usuario.email, senha }),
      ),
    );
    const falhas = resultados.filter(
      (resultado): resultado is PromiseRejectedResult =>
        resultado.status === "rejected",
    );
    expect(
      falhas.every(
        ({ reason }) => reason instanceof MuitasRequisicoesException,
      ),
    ).toBe(true);

    for (
      let indice = resultados.length - falhas.length;
      indice < 6;
      indice += 1
    ) {
      await service.login({ email: usuario.email, senha });
    }

    const corteInatividade = new Date(Date.now() - 30 * 60 * 1_000);
    expect(
      await database.sessaoUsuario.count({
        where: {
          usuarioId: usuario.id,
          revogadoAt: null,
          expiraAt: { gt: new Date() },
          ultimaAtividadeAt: { gt: corteInatividade },
        },
      }),
    ).toBe(5);
    expect(
      await database.sessaoUsuario.count({
        where: { usuarioId: usuario.id, revogadoAt: { not: null } },
      }),
    ).toBe(1);
  });

  it("incrementa e bloqueia atomicamente tentativas concorrentes", async () => {
    const senhaHasher = {
      verificarHash: jest.fn().mockResolvedValue(false),
    } as unknown as SenhaHasher;
    const service = criarAuthService(database, "test", senhaHasher);

    const resultados = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        service.login({
          email: "aleatorio@example.com",
          senha: "senha incorreta",
        }),
      ),
    );
    const motivos = resultados
      .filter(
        (resultado): resultado is PromiseRejectedResult =>
          resultado.status === "rejected",
      )
      .map(({ reason }: PromiseRejectedResult) => reason as unknown);

    expect(
      motivos.filter((erro) => erro instanceof UnauthorizedException),
    ).toHaveLength(3);
    expect(
      motivos.filter((erro) => erro instanceof MuitasRequisicoesException),
    ).toHaveLength(5);
    expect(await database.tentativaLogin.count()).toBe(1);
    expect((await database.tentativaLogin.findFirst())?.tentativas).toBe(4);
  });

  it("altera o hash e revoga todas as sessões na mesma transação", async () => {
    const senhaHasher = new SenhaHasher();
    const senhaAtual = "uma senha atual segura";
    const novaSenha = "uma nova senha segura";
    const usuario = await database.usuario.create({
      data: {
        nome: "Diretor",
        email: "diretor@example.com",
        senha: await senhaHasher.criarHash(senhaAtual),
        perfil: "DIRETOR_PATRIMONIO",
        ativo: true,
      },
    });
    await database.sessaoUsuario.createMany({
      data: ["d", "e"].map((prefixo) => ({
        usuarioId: usuario.id,
        tokenHash: prefixo.repeat(64),
        expiraAt: new Date(Date.now() + 8 * 60 * 60 * 1_000),
        ultimaAtividadeAt: new Date(),
      })),
    });

    const service = criarAuthService(database, "test", senhaHasher);
    await service.alterarSenha(usuario.id, {
      senhaAtual,
      novaSenha,
      confirmacaoNovaSenha: novaSenha,
    });

    const persistido = await database.usuario.findUniqueOrThrow({
      where: { id: usuario.id },
      select: { senha: true },
    });
    await expect(
      senhaHasher.verificarHash(persistido.senha, novaSenha),
    ).resolves.toBe(true);
    expect(
      await database.sessaoUsuario.count({
        where: { usuarioId: usuario.id, revogadoAt: { not: null } },
      }),
    ).toBe(2);
  });

  it("permite somente uma alteração concorrente baseada no mesmo hash antigo", async () => {
    const senhaHasher = new SenhaHasher();
    const senhaAtual = "uma senha atual segura";
    const usuario = await database.usuario.create({
      data: {
        nome: "Administradora",
        email: "admin-concorrente@example.com",
        senha: await senhaHasher.criarHash(senhaAtual),
        perfil: "ADMINISTRADOR",
        ativo: true,
      },
    });
    const service = criarAuthService(database, "development", senhaHasher);

    const resultados = await Promise.allSettled([
      service.alterarSenha(usuario.id, {
        senhaAtual,
        novaSenha: "primeira nova senha segura",
        confirmacaoNovaSenha: "primeira nova senha segura",
      }),
      service.alterarSenha(usuario.id, {
        senhaAtual,
        novaSenha: "segunda nova senha segura",
        confirmacaoNovaSenha: "segunda nova senha segura",
      }),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      resultados.filter(
        (resultado): resultado is PromiseRejectedResult =>
          resultado.status === "rejected" &&
          resultado.reason instanceof UnauthorizedException,
      ),
    ).toHaveLength(1);

    const persistido = await database.usuario.findUniqueOrThrow({
      where: { id: usuario.id },
      select: { senha: true },
    });
    const hashesValidos = await Promise.all([
      senhaHasher.verificarHash(persistido.senha, "primeira nova senha segura"),
      senhaHasher.verificarHash(persistido.senha, "segunda nova senha segura"),
    ]);
    expect(hashesValidos.filter(Boolean)).toHaveLength(1);
  });

  it("reabre atomicamente a janela de rate limit no instante de expiração", async () => {
    const repository = new AuthRepository(database);
    const inicio = new Date("2026-10-18T12:00:00.000Z");
    const chave = "c".repeat(64);

    await expect(
      repository.reservarTentativaLogin(chave, inicio, 3, 60_000),
    ).resolves.toBeNull();
    await expect(
      repository.reservarTentativaLogin(chave, inicio, 3, 60_000),
    ).resolves.toBeNull();
    await expect(
      repository.reservarTentativaLogin(chave, inicio, 3, 60_000),
    ).resolves.toBeNull();
    await expect(
      repository.reservarTentativaLogin(chave, inicio, 3, 60_000),
    ).resolves.toEqual(new Date("2026-10-18T12:01:00.000Z"));
    await expect(
      repository.reservarTentativaLogin(
        chave,
        new Date("2026-10-18T12:01:00.000Z"),
        3,
        60_000,
      ),
    ).resolves.toBeNull();

    expect(
      await database.tentativaLogin.findUnique({ where: { chaveHash: chave } }),
    ).toEqual(
      expect.objectContaining({
        tentativas: 1,
        janelaExpiraAt: new Date("2026-10-18T12:02:00.000Z"),
      }),
    );
  });

  it("limpa tentativas expiradas em lotes finitos", async () => {
    const agora = new Date();
    await database.tentativaLogin.createMany({
      data: Array.from({ length: 150 }, (_, indice) => ({
        chaveHash: indice.toString(16).padStart(64, "0"),
        tentativas: 1,
        janelaExpiraAt: new Date(agora.getTime() - 1),
      })),
    });

    const removidas = await new AuthRepository(
      database,
    ).limparTentativasExpiradas(agora, 100);

    expect(removidas).toBe(100);
    expect(await database.tentativaLogin.count()).toBe(50);
  });

  it("permite somente um reset concorrente e revoga todas as sessões", async () => {
    const senhaHasher = new SenhaHasher();
    const usuario = await database.usuario.create({
      data: {
        nome: "Administradora",
        email: "recuperacao@example.com",
        senha: await senhaHasher.criarHash("uma senha inicial segura"),
        perfil: "ADMINISTRADOR",
        ativo: true,
      },
    });
    await database.sessaoUsuario.createMany({
      data: ["a", "b"].map((prefixo) => ({
        tokenHash: prefixo.repeat(64),
        usuarioId: usuario.id,
        expiraAt: new Date("2999-01-01"),
        ultimaAtividadeAt: new Date(),
      })),
    });
    const mensagensEmail: MensagemEmailAuth[] = [];
    const service = criarAuthService(
      database,
      "test",
      senhaHasher,
      mensagensEmail,
    );

    await service.solicitarRedefinicaoSenha({ email: usuario.email });
    const mensagem = mensagensEmail[0];
    if (mensagem?.tipo !== "REDEFINIR_SENHA") {
      throw new Error("Mensagem de redefinição esperada.");
    }
    const token = new URL(mensagem.link).searchParams.get("token")!;
    const dados = {
      token,
      novaSenha: "uma senha redefinida segura",
      confirmacaoNovaSenha: "uma senha redefinida segura",
    };

    const resultados = await Promise.allSettled([
      service.redefinirSenha(dados),
      service.redefinirSenha(dados),
    ]);

    expect(
      resultados.filter(({ status }) => status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      resultados.filter(
        (resultado): resultado is PromiseRejectedResult =>
          resultado.status === "rejected" &&
          resultado.reason instanceof UnauthorizedException,
      ),
    ).toHaveLength(1);
    expect(
      await database.sessaoUsuario.count({
        where: { usuarioId: usuario.id, revogadoAt: { not: null } },
      }),
    ).toBe(2);
    const persistido = await database.usuario.findUniqueOrThrow({
      where: { id: usuario.id },
      select: { senha: true },
    });
    await expect(
      senhaHasher.verificarHash(
        persistido.senha,
        "uma senha redefinida segura",
      ),
    ).resolves.toBe(true);
  });

  it("invalida o reset pendente na mesma transação da alteração autenticada", async () => {
    const senhaHasher = new SenhaHasher();
    const senhaAtual = "uma senha inicial segura";
    const usuario = await database.usuario.create({
      data: {
        nome: "Diretor",
        email: "alteracao-invalida-reset@example.com",
        senha: await senhaHasher.criarHash(senhaAtual),
        perfil: "DIRETOR_PATRIMONIO",
        ativo: true,
      },
    });
    const mensagensEmail: MensagemEmailAuth[] = [];
    const service = criarAuthService(
      database,
      "test",
      senhaHasher,
      mensagensEmail,
    );
    await service.solicitarRedefinicaoSenha({ email: usuario.email });
    const mensagem = mensagensEmail[0];
    if (mensagem?.tipo !== "REDEFINIR_SENHA") {
      throw new Error("Mensagem de redefinição esperada.");
    }
    const token = new URL(mensagem.link).searchParams.get("token")!;

    await service.alterarSenha(usuario.id, {
      senhaAtual,
      novaSenha: "uma senha alterada segura",
      confirmacaoNovaSenha: "uma senha alterada segura",
    });

    await expect(
      service.redefinirSenha({
        token,
        novaSenha: "outra senha redefinida segura",
        confirmacaoNovaSenha: "outra senha redefinida segura",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(
      await database.redefinicaoSenha.findUnique({
        where: { usuarioId: usuario.id },
        select: { consumidoAt: true },
      }),
    ).toEqual({ consumidoAt: expect.any(Date) });
  });
});
