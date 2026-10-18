import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { CABECALHO_CSRF, RespostaErroSchema } from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { SenhaHasher } from "../src/common/security/senha-hasher";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

type UsuarioMemoria = {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMINISTRADOR" | "DIRETOR_PATRIMONIO";
  ativo: boolean;
  senha: string;
  ultimoLoginAt: Date | null;
};

type SessaoMemoria = {
  id: string;
  tokenHash: string;
  usuarioId: string;
  expiraAt: Date;
  ultimaAtividadeAt: Date;
  revogadoAt: Date | null;
  createdAt: Date;
};

describe("autenticação E2E", () => {
  let app: INestApplication;
  let usuarios: UsuarioMemoria[];
  let sessoes: SessaoMemoria[];
  const tentativas = new Map<
    string,
    { tentativas: number; janelaExpiraAt: Date; updatedAt: Date }
  >();
  const senhaHasher = new SenhaHasher();
  let senhaHash: string;
  let sequenciaSessao = 0;

  const ids = {
    administrador: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    diretor: "38df5e9c-3e60-4a8e-a4d4-8ca70221f4f1",
    inativo: "48df5e9c-3e60-4a8e-a4d4-8ca70221f4f2",
  } as const;
  const senha = "uma senha segura de teste";

  beforeAll(async () => {
    senhaHash = await senhaHasher.criarHash(senha);

    const database = criarDatabaseMock();
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(database)
      .compile();

    app = modulo.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, "http://localhost:3000");
    await app.init();
  });

  afterAll(async () => app.close());

  beforeEach(() => {
    usuarios = [
      {
        id: ids.administrador,
        nome: "Administradora",
        email: "admin@example.com",
        perfil: "ADMINISTRADOR",
        ativo: true,
        senha: senhaHash,
        ultimoLoginAt: null,
      },
      {
        id: ids.diretor,
        nome: "Diretor",
        email: "diretor@example.com",
        perfil: "DIRETOR_PATRIMONIO",
        ativo: true,
        senha: senhaHash,
        ultimoLoginAt: null,
      },
      {
        id: ids.inativo,
        nome: "Inativo",
        email: "inativo@example.com",
        perfil: "ADMINISTRADOR",
        ativo: false,
        senha: senhaHash,
        ultimoLoginAt: null,
      },
    ];
    sessoes = [];
    tentativas.clear();
    sequenciaSessao = 0;
  });

  function criarDatabaseMock() {
    const database: Record<string, unknown> = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(
        (operacao: (transaction: unknown) => Promise<unknown>) =>
          operacao(database),
      ),
      $queryRaw: jest.fn(
        (
          _query: TemplateStringsArray,
          chaveHash: string,
          novaExpiracao: Date,
          agora: Date,
          marcadorBloqueado: number,
        ) => {
          const existente = tentativas.get(chaveHash);
          const expirou =
            existente === undefined ||
            existente.janelaExpiraAt.getTime() <= agora.getTime();
          const registro = {
            tentativas: expirou
              ? 1
              : Math.min(existente.tentativas + 1, marcadorBloqueado),
            janelaExpiraAt: expirou ? novaExpiracao : existente.janelaExpiraAt,
            updatedAt: new Date(),
          };
          tentativas.set(chaveHash, registro);
          return [registro];
        },
      ),
      usuario: {
        findUnique: jest.fn(
          ({ where }: { where: { email?: string; id?: string } }) =>
            usuarios.find(
              (usuario) =>
                (where.email !== undefined && usuario.email === where.email) ||
                (where.id !== undefined && usuario.id === where.id),
            ) ?? null,
        ),
        updateMany: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string; ativo: boolean; senha?: string };
            data: { ultimoLoginAt?: Date; senha?: string };
          }) => {
            const usuario = usuarios.find(
              (item) =>
                item.id === where.id &&
                item.ativo === where.ativo &&
                (where.senha === undefined || item.senha === where.senha),
            );
            if (!usuario) return { count: 0 };
            if (data.ultimoLoginAt) usuario.ultimoLoginAt = data.ultimoLoginAt;
            if (data.senha) usuario.senha = data.senha;
            return { count: 1 };
          },
        ),
      },
      sessaoUsuario: {
        findUnique: jest.fn(({ where }: { where: { tokenHash: string } }) => {
          const sessao = sessoes.find(
            (item) => item.tokenHash === where.tokenHash,
          );
          const usuario = usuarios.find(
            (item) => item.id === sessao?.usuarioId,
          );
          return sessao && usuario ? { ...sessao, usuario } : null;
        }),
        findMany: jest.fn(
          ({
            where,
          }: {
            where: {
              usuarioId: string;
              expiraAt: { gt: Date };
              ultimaAtividadeAt: { gt: Date };
            };
          }) =>
            sessoes
              .filter(
                (sessao) =>
                  sessao.usuarioId === where.usuarioId &&
                  sessao.revogadoAt === null &&
                  sessao.expiraAt > where.expiraAt.gt &&
                  sessao.ultimaAtividadeAt > where.ultimaAtividadeAt.gt,
              )
              .sort(
                (a, b) =>
                  a.createdAt.getTime() - b.createdAt.getTime() ||
                  a.id.localeCompare(b.id),
              )
              .map(({ id }) => ({ id })),
        ),
        create: jest.fn(
          ({
            data,
          }: {
            data: Omit<SessaoMemoria, "id" | "createdAt" | "revogadoAt">;
          }) => {
            sequenciaSessao += 1;
            const sessao: SessaoMemoria = {
              ...data,
              id: `00000000-0000-4000-8000-${String(sequenciaSessao).padStart(12, "0")}`,
              revogadoAt: null,
              createdAt: new Date(),
            };
            sessoes.push(sessao);
            return sessao;
          },
        ),
        updateMany: jest.fn(
          ({
            where,
            data,
          }: {
            where: {
              id?: string | { in: string[] };
              usuarioId?: string;
              tokenHash?: string;
              revogadoAt?: null;
              expiraAt?: { gt: Date };
              AND?: Array<{
                ultimaAtividadeAt: Date | { lte: Date };
              }>;
            };
            data: { revogadoAt?: Date; ultimaAtividadeAt?: Date };
          }) => {
            let count = 0;
            for (const sessao of sessoes) {
              const idsPermitidos =
                typeof where.id === "object" ? where.id.in : undefined;
              if (
                (typeof where.id === "string" && sessao.id !== where.id) ||
                (idsPermitidos && !idsPermitidos.includes(sessao.id)) ||
                (where.usuarioId && sessao.usuarioId !== where.usuarioId) ||
                (where.tokenHash && sessao.tokenHash !== where.tokenHash) ||
                (where.revogadoAt === null && sessao.revogadoAt !== null) ||
                (where.expiraAt && sessao.expiraAt <= where.expiraAt.gt) ||
                (where.AND?.some(({ ultimaAtividadeAt }) =>
                  ultimaAtividadeAt instanceof Date
                    ? sessao.ultimaAtividadeAt.getTime() !==
                      ultimaAtividadeAt.getTime()
                    : sessao.ultimaAtividadeAt > ultimaAtividadeAt.lte,
                ) ??
                  false)
              ) {
                continue;
              }
              if (data.revogadoAt) sessao.revogadoAt = data.revogadoAt;
              if (data.ultimaAtividadeAt)
                sessao.ultimaAtividadeAt = data.ultimaAtividadeAt;
              count += 1;
            }
            return { count };
          },
        ),
      },
      tentativaLogin: {
        findUnique: jest.fn(
          ({ where }: { where: { chaveHash: string } }) =>
            tentativas.get(where.chaveHash) ?? null,
        ),
        upsert: jest.fn(
          ({
            where,
            create,
            update,
          }: {
            where: { chaveHash: string };
            create: { tentativas: number; janelaExpiraAt: Date };
            update: { tentativas: number; janelaExpiraAt: Date };
          }) => {
            const dados = tentativas.has(where.chaveHash) ? update : create;
            const registro = { ...dados, updatedAt: new Date() };
            tentativas.set(where.chaveHash, registro);
            return registro;
          },
        ),
        update: jest.fn(({ where }: { where: { chaveHash: string } }) => {
          const registro = tentativas.get(where.chaveHash)!;
          registro.tentativas += 1;
          return registro;
        }),
        findMany: jest.fn(() => []),
        deleteMany: jest.fn(
          ({ where }: { where: { chaveHash?: string | { in: string[] } } }) => {
            if (typeof where.chaveHash === "string") {
              const removido = tentativas.delete(where.chaveHash);
              return { count: removido ? 1 : 0 };
            }
            return { count: 0 };
          },
        ),
      },
    };

    return database;
  }

  function login(email: string, senhaInformada = senha) {
    return request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .send({ email, senha: senhaInformada });
  }

  function alterarSenha(
    cookie: string,
    body: Record<string, unknown> = {
      senhaAtual: senha,
      novaSenha: "uma nova senha segura de teste",
      confirmacaoNovaSenha: "uma nova senha segura de teste",
    },
  ) {
    return request(app.getHttpServer())
      .post("/api/auth/alterar-senha")
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .set("Cookie", cookie)
      .send(body);
  }

  function cookieDaResposta(resposta: request.Response): string {
    const setCookie = resposta.headers["set-cookie"] as unknown as string[];
    return setCookie[0]!.split(";", 1)[0]!;
  }

  it.each([
    ["admin@example.com", "ADMINISTRADOR"],
    ["diretor@example.com", "DIRETOR_PATRIMONIO"],
  ])("faz login válido de %s", async (email, perfil) => {
    const resposta = await login(email).expect(200);

    expect(resposta.body.dados).toEqual(
      expect.objectContaining({ email, perfil }),
    );
    expect(resposta.body).not.toHaveProperty("token");
    expect(JSON.stringify(resposta.body)).not.toContain(senhaHash);
    const cookieSessao = resposta.headers["set-cookie"]?.[0];
    expect(cookieSessao).toContain("HttpOnly");
    expect(cookieSessao).toContain("SameSite=Strict");
    expect(sessoes).toHaveLength(1);
    expect(sessoes[0]!.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(cookieSessao).not.toContain(sessoes[0]!.tokenHash);
    expect(
      usuarios.find((usuario) => usuario.email === email)!.ultimoLoginAt,
    ).toBeInstanceOf(Date);
  });

  it("mantém resposta uniforme para senha inválida, usuário inexistente e inativo", async () => {
    const respostas = await Promise.all([
      login("admin@example.com", "senha incorreta"),
      login("ausente@example.com", "senha incorreta"),
      login("inativo@example.com"),
    ]);

    for (const resposta of respostas) {
      expect(resposta.status).toBe(401);
      expect(resposta.body).toEqual(
        expect.objectContaining({
          codigo: "CREDENCIAIS_INVALIDAS",
          mensagem: "E-mail ou senha inválidos.",
        }),
      );
    }
  });

  it("aplica rate limit, Retry-After genérico e recupera após a janela", async () => {
    for (let tentativa = 0; tentativa < 3; tentativa += 1) {
      await login("ausente@example.com", "senha incorreta").expect(401);
    }

    const bloqueada = await login(
      "ausente@example.com",
      "senha incorreta",
    ).expect(429);
    expect(bloqueada.headers["retry-after"]).toMatch(/^\d+$/);
    expect(RespostaErroSchema.parse(bloqueada.body).codigo).toBe(
      "MUITAS_REQUISICOES",
    );

    for (const registro of tentativas.values()) {
      registro.janelaExpiraAt = new Date(0);
    }
    await login("ausente@example.com", "senha incorreta").expect(401);
  });

  it("exige Origin e CSRF também no login público", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .set(CABECALHO_CSRF, "1")
      .send({ email: "admin@example.com", senha })
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Origin", "https://invalida.example")
      .set(CABECALHO_CSRF, "1")
      .send({ email: "admin@example.com", senha })
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Origin", "http://localhost:3000")
      .send({ email: "admin@example.com", senha })
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "0")
      .send({ email: "admin@example.com", senha })
      .expect(403);
  });

  it("retorna /auth/me para os dois perfis e 401 sem sessão", async () => {
    for (const email of ["admin@example.com", "diretor@example.com"]) {
      const respostaLogin = await login(email).expect(200);
      const respostaMe = await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", cookieDaResposta(respostaLogin))
        .expect(200);
      expect(respostaMe.body.dados).toEqual(expect.objectContaining({ email }));
      expect(JSON.stringify(respostaMe.body)).not.toContain("senha");
    }

    await request(app.getHttpServer()).get("/api/auth/me").expect(401);
  });

  it.each(["admin@example.com", "diretor@example.com"])(
    "altera somente a própria senha de %s, revoga todas as sessões e expira o cookie",
    async (email) => {
      const primeira = await login(email).expect(200);
      const segunda = await login(email).expect(200);
      const usuario = usuarios.find((item) => item.email === email)!;
      const hashAnterior = usuario.senha;

      const resposta = await alterarSenha(cookieDaResposta(primeira)).expect(
        204,
      );

      expect(resposta.body).toEqual({});
      expect(resposta.headers["set-cookie"]?.[0]).toContain("Max-Age=0");
      expect(usuario.senha).not.toBe(hashAnterior);
      await expect(
        senhaHasher.verificarHash(
          usuario.senha,
          "uma nova senha segura de teste",
        ),
      ).resolves.toBe(true);
      expect(
        sessoes.filter(
          (sessao) =>
            sessao.usuarioId === usuario.id && sessao.revogadoAt !== null,
        ),
      ).toHaveLength(2);

      await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", cookieDaResposta(segunda))
        .expect(401);
      await login(email).expect(401);
      await login(email, "uma nova senha segura de teste").expect(200);
    },
  );

  it("rejeita senha atual inválida sem alterar hash, sessões ou cookie", async () => {
    const respostaLogin = await login("admin@example.com").expect(200);
    const usuario = usuarios.find(
      (item) => item.email === "admin@example.com",
    )!;
    const hashAnterior = usuario.senha;

    const resposta = await alterarSenha(cookieDaResposta(respostaLogin), {
      senhaAtual: "senha incorreta",
      novaSenha: "uma nova senha segura de teste",
      confirmacaoNovaSenha: "uma nova senha segura de teste",
    }).expect(401);

    expect(resposta.body).toEqual(
      expect.objectContaining({
        codigo: "SENHA_ATUAL_INVALIDA",
        mensagem: "A senha atual é inválida.",
      }),
    );
    expect(resposta.headers["set-cookie"]).toBeUndefined();
    expect(usuario.senha).toBe(hashAnterior);
    expect(sessoes).toEqual([expect.objectContaining({ revogadoAt: null })]);
  });

  it("protege a alteração por autenticação, perfil, CSRF e body estrito", async () => {
    const confirmacaoDivergente = `${senha}-diferente`;

    await request(app.getHttpServer())
      .post("/api/auth/alterar-senha")
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .send({
        senhaAtual: senha,
        novaSenha: "uma nova senha segura de teste",
        confirmacaoNovaSenha: "uma nova senha segura de teste",
      })
      .expect(401);

    const respostaLogin = await login("admin@example.com").expect(200);
    const cookie = cookieDaResposta(respostaLogin);

    await request(app.getHttpServer())
      .post("/api/auth/alterar-senha")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", cookie)
      .send({
        senhaAtual: senha,
        novaSenha: "uma nova senha segura de teste",
        confirmacaoNovaSenha: "uma nova senha segura de teste",
      })
      .expect(403);

    await alterarSenha(cookie, {
      senhaAtual: senha,
      novaSenha: "uma nova senha segura de teste",
      confirmacaoNovaSenha: "uma nova senha segura de teste",
      usuarioId: ids.diretor,
    }).expect(400);

    await alterarSenha(cookie, {
      senhaAtual: senha,
      novaSenha: "uma nova senha segura de teste",
      confirmacaoNovaSenha: confirmacaoDivergente,
    }).expect(400);
  });

  it("rejeita /auth/me com sessão expirada, revogada ou usuário inativo", async () => {
    const casos = ["expirada", "revogada", "inativa"] as const;

    for (const caso of casos) {
      const token = caso[0]!.toUpperCase().repeat(43);
      sessoes.push({
        id: `00000000-0000-4000-8000-00000000000${sessoes.length + 1}`,
        tokenHash: calcularHashTokenSessao(token)!,
        usuarioId: caso === "inativa" ? ids.inativo : ids.administrador,
        expiraAt:
          caso === "expirada" ? new Date(0) : new Date("2999-01-01T00:00:00Z"),
        ultimaAtividadeAt: new Date("2998-01-01T00:00:00Z"),
        revogadoAt: caso === "revogada" ? new Date() : null,
        createdAt: new Date(),
      });

      await request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Cookie", `sipat_session=${token}`)
        .expect(401);
    }
  });

  it("faz logout idempotente, expira cookie e revoga apenas a sessão atual", async () => {
    const primeiro = await login("admin@example.com").expect(200);
    await login("admin@example.com").expect(200);
    const cookiePrimeiro = cookieDaResposta(primeiro);

    const resposta = await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .set("Cookie", cookiePrimeiro)
      .expect(204);

    expect(resposta.headers["set-cookie"]?.[0]).toContain("Max-Age=0");
    expect(sessoes.filter((sessao) => sessao.revogadoAt !== null)).toHaveLength(
      1,
    );
    expect(sessoes.filter((sessao) => sessao.revogadoAt === null)).toHaveLength(
      1,
    );

    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .set("Cookie", cookiePrimeiro)
      .expect(204);
  });

  it("mantém Origin e CSRF obrigatórios no logout sem sessão", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set(CABECALHO_CSRF, "1")
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Origin", "http://localhost:3000")
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "0")
      .expect(403);
    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Origin", "http://localhost:3000")
      .set(CABECALHO_CSRF, "1")
      .expect(204);
  });
});
