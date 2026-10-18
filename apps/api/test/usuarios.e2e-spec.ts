import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  CABECALHO_CSRF,
  ListarUsuariosResponseSchema,
  RespostaErroSchema,
  UsuarioDetalheSchema,
} from "@repo/contracts";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import { configurarCors } from "../src/configurar-cors";
import { calcularHashTokenSessao } from "../src/modules/auth/token-sessao";

const ADMIN_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const DIRETOR_ID = "c5c3cc23-a215-4bba-9ae0-671596433a36";
const USUARIO_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const OUTRO_USUARIO_ID = "24df3a43-5c02-47fb-ab92-03757a058f9f";
const ORIGEM = "http://localhost:3000";

type UsuarioMemoria = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfil: "ADMINISTRADOR" | "DIRETOR_PATRIMONIO";
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  createdById: string | null;
};

function usuarioBase(
  sobrescritas: Partial<UsuarioMemoria> = {},
): UsuarioMemoria {
  return {
    id: USUARIO_ID,
    nome: "Usuário de Teste",
    email: "usuario@example.com",
    senha: "$argon2id$hash-interno",
    perfil: "DIRETOR_PATRIMONIO",
    ativo: true,
    createdAt: new Date("2026-10-17T12:00:00.000Z"),
    updatedAt: null,
    createdById: ADMIN_ID,
    ...sobrescritas,
  };
}

describe("gestão de usuários", () => {
  let app: INestApplication;
  let usuarios: UsuarioMemoria[];
  const tokenAdministrador = "A".repeat(43);
  const tokenDiretor = "B".repeat(43);

  const database = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    usuario: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sessaoUsuario: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    database.$transaction.mockImplementation(
      async (operacao: (cliente: typeof database) => Promise<unknown>) =>
        operacao(database),
    );
    database.sessaoUsuario.findUnique.mockImplementation(
      ({ where }: { where: { tokenHash: string } }) => {
        const hashAdministrador = calcularHashTokenSessao(tokenAdministrador);
        const hashDiretor = calcularHashTokenSessao(tokenDiretor);

        if (where.tokenHash === hashAdministrador) {
          return {
            id: "00000000-0000-4000-8000-000000000001",
            expiresAt: new Date("2999-01-01T00:00:00.000Z"),
            lastActivityAt: new Date("2998-01-01T00:00:00.000Z"),
            revokedAt: null,
            usuario: {
              id: ADMIN_ID,
              nome: "Administrador",
              email: "admin@example.com",
              perfil: "ADMINISTRADOR",
              ativo: true,
            },
          };
        }

        if (where.tokenHash === hashDiretor) {
          return {
            id: "00000000-0000-4000-8000-000000000002",
            expiresAt: new Date("2999-01-01T00:00:00.000Z"),
            lastActivityAt: new Date("2998-01-01T00:00:00.000Z"),
            revokedAt: null,
            usuario: {
              id: DIRETOR_ID,
              nome: "Diretor",
              email: "diretor@example.com",
              perfil: "DIRETOR_PATRIMONIO",
              ativo: true,
            },
          };
        }

        return null;
      },
    );
    database.usuario.findUnique.mockImplementation(
      ({ where }: { where: { id?: string; email?: string } }) =>
        usuarios.find(
          (usuario) =>
            (where.id !== undefined && usuario.id === where.id) ||
            (where.email !== undefined && usuario.email === where.email),
        ) ?? null,
    );
    database.usuario.findMany.mockImplementation(
      ({
        where,
        skip,
        take,
      }: {
        where: {
          perfil?: UsuarioMemoria["perfil"];
          ativo?: boolean;
          OR?: Array<{
            nome?: { contains: string };
            email?: { contains: string };
          }>;
        };
        skip: number;
        take: number;
      }) => {
        const filtrados = usuarios.filter((usuario) => {
          if (where.perfil !== undefined && usuario.perfil !== where.perfil) {
            return false;
          }
          if (where.ativo !== undefined && usuario.ativo !== where.ativo) {
            return false;
          }
          if (where.OR !== undefined) {
            return where.OR.some((condicao) => {
              const busca =
                condicao.nome?.contains ?? condicao.email?.contains ?? "";
              return (
                usuario.nome
                  .toLocaleLowerCase()
                  .includes(busca.toLocaleLowerCase()) ||
                usuario.email
                  .toLocaleLowerCase()
                  .includes(busca.toLocaleLowerCase())
              );
            });
          }
          return true;
        });

        return filtrados.slice(skip, skip + take);
      },
    );
    database.usuario.count.mockImplementation(
      ({
        where,
      }: {
        where: {
          perfil?: UsuarioMemoria["perfil"];
          ativo?: boolean;
          OR?: unknown[];
        };
      }) =>
        usuarios.filter(
          (usuario) =>
            (where.perfil === undefined || usuario.perfil === where.perfil) &&
            (where.ativo === undefined || usuario.ativo === where.ativo),
        ).length,
    );
    database.usuario.create.mockImplementation(
      ({
        data,
      }: {
        data: {
          nome: string;
          email: string;
          senha: string;
          perfil: UsuarioMemoria["perfil"];
          ativo: boolean;
          createdBy: { connect: { id: string } };
        };
      }) => {
        const criado = usuarioBase({
          id: OUTRO_USUARIO_ID,
          nome: data.nome,
          email: data.email,
          senha: data.senha,
          perfil: data.perfil,
          ativo: data.ativo,
          createdById: data.createdBy.connect.id,
        });
        usuarios.push(criado);
        return criado;
      },
    );
    database.usuario.update.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<UsuarioMemoria>;
      }) => {
        const indice = usuarios.findIndex((usuario) => usuario.id === where.id);
        if (indice < 0) throw new Error("Registro não encontrado");
        usuarios[indice] = { ...usuarios[indice]!, ...data };
        return usuarios[indice];
      },
    );
    database.sessaoUsuario.updateMany.mockResolvedValue({ count: 2 });

    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE_CLIENT)
      .useValue(database)
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, `${ORIGEM},http://localhost:8081`);
    await app.init();
  });

  beforeEach(() => {
    usuarios = [usuarioBase()];
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  function cookie(token: string): string {
    return `sipat_session=${token}`;
  }

  function requisicaoAdministrador() {
    return {
      get: (path: string) =>
        request(app.getHttpServer())
          .get(path)
          .set("Cookie", cookie(tokenAdministrador)),
      post: (path: string) =>
        request(app.getHttpServer())
          .post(path)
          .set("Cookie", cookie(tokenAdministrador))
          .set("Origin", ORIGEM)
          .set(CABECALHO_CSRF, "1"),
      patch: (path: string) =>
        request(app.getHttpServer())
          .patch(path)
          .set("Cookie", cookie(tokenAdministrador))
          .set("Origin", ORIGEM)
          .set(CABECALHO_CSRF, "1"),
    };
  }

  function esperarCodigo(resposta: request.Response, codigo: string) {
    const resultado = RespostaErroSchema.safeParse(resposta.body);
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.codigo).toBe(codigo);
  }

  it("aplica 401 ao anônimo, 403 ao diretor e permite o administrador", async () => {
    const anonimo = await request(app.getHttpServer()).get("/api/usuarios");
    const diretor = await request(app.getHttpServer())
      .get("/api/usuarios")
      .set("Cookie", cookie(tokenDiretor));
    const administrador = await requisicaoAdministrador().get("/api/usuarios");

    expect(anonimo.status).toBe(401);
    expect(diretor.status).toBe(403);
    expect(administrador.status).toBe(200);
    esperarCodigo(anonimo, "NAO_AUTENTICADO");
    esperarCodigo(diretor, "ACESSO_NEGADO");
  });

  it("lista com paginação, busca, filtros e ordenação determinística", async () => {
    usuarios.push(
      usuarioBase({
        id: OUTRO_USUARIO_ID,
        nome: "Outro usuário",
        email: "outro@example.com",
        ativo: false,
      }),
    );

    const resposta = await requisicaoAdministrador().get(
      "/api/usuarios?pagina=1&limite=20&busca=outro&perfil=DIRETOR_PATRIMONIO&ativo=false",
    );

    expect(resposta.status).toBe(200);
    expect(ListarUsuariosResponseSchema.safeParse(resposta.body).success).toBe(
      true,
    );
    expect(resposta.body.dados).toHaveLength(1);
    expect(database.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
    expect(JSON.stringify(resposta.body)).not.toMatch(/senha|token/i);
  });

  it("consulta um usuário sem expor o hash", async () => {
    const resposta = await requisicaoAdministrador().get(
      `/api/usuarios/${USUARIO_ID}`,
    );

    expect(resposta.status).toBe(200);
    expect(UsuarioDetalheSchema.safeParse(resposta.body.dados).success).toBe(
      true,
    );
    expect(JSON.stringify(resposta.body)).not.toMatch(/senha|token|argon2/i);
  });

  it("rejeita CSRF ausente na criação", async () => {
    const resposta = await request(app.getHttpServer())
      .post("/api/usuarios")
      .set("Cookie", cookie(tokenAdministrador))
      .set("Origin", ORIGEM)
      .send({
        nome: "Novo usuário",
        email: "novo@example.com",
        senha: "frase secreta inicial",
        perfil: "DIRETOR_PATRIMONIO",
      });

    expect(resposta.status).toBe(403);
    esperarCodigo(resposta, "ACESSO_NEGADO");
  });

  it("cria ativo, deriva auditoria da sessão e persiste apenas o hash", async () => {
    const senha = "frase secreta inicial";
    const resposta = await requisicaoAdministrador()
      .post("/api/usuarios")
      .send({
        nome: "Novo usuário",
        email: "  NOVO@EXAMPLE.COM ",
        senha,
        perfil: "DIRETOR_PATRIMONIO",
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body.dados).toMatchObject({
      email: "novo@example.com",
      ativo: true,
      createdById: ADMIN_ID,
    });
    const dadosPersistidos = database.usuario.create.mock.calls[0]?.[0].data;
    expect(dadosPersistidos.senha).not.toBe(senha);
    expect(dadosPersistidos.senha).toMatch(/^\$argon2id\$/);
    expect(dadosPersistidos.createdBy).toEqual({ connect: { id: ADMIN_ID } });
    expect(JSON.stringify(resposta.body)).not.toMatch(/senha|token/i);
  });

  it("rejeita e-mail duplicado na criação e na atualização", async () => {
    usuarios.push(
      usuarioBase({
        id: OUTRO_USUARIO_ID,
        email: "duplicado@example.com",
      }),
    );

    const criacao = await requisicaoAdministrador().post("/api/usuarios").send({
      nome: "Duplicado",
      email: "DUPLICADO@EXAMPLE.COM",
      senha: "frase secreta inicial",
      perfil: "DIRETOR_PATRIMONIO",
    });
    const alteracao = await requisicaoAdministrador()
      .patch(`/api/usuarios/${USUARIO_ID}`)
      .send({ email: "duplicado@example.com" });

    expect(criacao.status).toBe(409);
    expect(alteracao.status).toBe(409);
    esperarCodigo(criacao, "EMAIL_USUARIO_JA_EXISTENTE");
    esperarCodigo(alteracao, "EMAIL_USUARIO_JA_EXISTENTE");
  });

  it("rejeita PATCH vazio e usuário inexistente", async () => {
    const vazio = await requisicaoAdministrador()
      .patch(`/api/usuarios/${USUARIO_ID}`)
      .send({});
    const inexistente = await requisicaoAdministrador().get(
      "/api/usuarios/7ce084e2-e31b-423d-ac44-03f7829a4658",
    );

    expect(vazio.status).toBe(400);
    expect(inexistente.status).toBe(404);
    esperarCodigo(vazio, "VALIDACAO_ENTRADA_INVALIDA");
    esperarCodigo(inexistente, "USUARIO_NAO_ENCONTRADO");
  });

  it("altera parcialmente apenas os campos permitidos", async () => {
    const resposta = await requisicaoAdministrador()
      .patch(`/api/usuarios/${USUARIO_ID}`)
      .send({ nome: "Nome alterado" });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.nome).toBe("Nome alterado");
    expect(database.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USUARIO_ID },
        data: expect.objectContaining({ nome: "Nome alterado" }),
      }),
    );
  });

  it("inativa e revoga todas as sessões de forma transacional", async () => {
    const resposta = await requisicaoAdministrador()
      .patch(`/api/usuarios/${USUARIO_ID}/situacao`)
      .send({ ativo: false });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.ativo).toBe(false);
    expect(database.$transaction).toHaveBeenCalledTimes(1);
    expect(database.sessaoUsuario.updateMany).toHaveBeenCalledWith({
      where: { usuarioId: USUARIO_ID, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("ativa sem revogar sessões", async () => {
    usuarios[0]!.ativo = false;

    const resposta = await requisicaoAdministrador()
      .patch(`/api/usuarios/${USUARIO_ID}/situacao`)
      .send({ ativo: true });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.ativo).toBe(true);
    expect(database.sessaoUsuario.updateMany).not.toHaveBeenCalled();
  });

  it("proíbe autoinativação e inativação do último administrador ativo", async () => {
    const autoinativacao = await requisicaoAdministrador()
      .patch(`/api/usuarios/${ADMIN_ID}/situacao`)
      .send({ ativo: false });

    usuarios = [
      usuarioBase({
        perfil: "ADMINISTRADOR",
        ativo: true,
      }),
    ];
    const ultimoAdministrador = await requisicaoAdministrador()
      .patch(`/api/usuarios/${USUARIO_ID}/situacao`)
      .send({ ativo: false });

    expect(autoinativacao.status).toBe(409);
    expect(ultimoAdministrador.status).toBe(409);
    esperarCodigo(autoinativacao, "AUTOINATIVACAO_NAO_PERMITIDA");
    esperarCodigo(ultimoAdministrador, "ULTIMO_ADMINISTRADOR_ATIVO");
  });
});
