import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { CABECALHO_CSRF, RespostaErroSchema } from "@repo/contracts";
import { DATABASE_CLIENT } from "../src/common/database/database.constants";
import cookieParser from "cookie-parser";
import request from "supertest";
import * as z from "zod";
import { AppModule } from "../src/app.module";
import { configurarCors } from "../src/configurar-cors";

describe("health endpoint", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE_CLIENT)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        sessaoUsuario: { findUnique: jest.fn() },
      })
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    configurarCors(app, "http://localhost:3000,http://localhost:8081");
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("returns the service status with a request id", async () => {
    const response = await request(app.getHttpServer()).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
    });
    expect(["development", "staging", "production", "test"]).toContain(
      response.body.environment,
    );
    expect(response.body.timestamp).toEqual(expect.any(String));

    const requisicaoId = response.headers["x-request-id"];

    expect(z.uuid().safeParse(requisicaoId).success).toBe(true);
  });

  it("returns the same request id in the error body and header", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/rota-inexistente",
    );

    expect(response.status).toBe(404);

    const resultado = RespostaErroSchema.safeParse(response.body);

    expect(resultado.success).toBe(true);

    if (!resultado.success) {
      throw new Error("A resposta não atende ao contrato público de erro.");
    }

    expect(resultado.data).toMatchObject({
      status: 404,
      sucesso: false,
      codigo: "RECURSO_NAO_ENCONTRADO",
      mensagem: "O recurso solicitado não foi encontrado.",
      erros: [],
    });

    const requisicaoIdCabecalho = response.headers["x-request-id"];

    expect(z.uuid().safeParse(requisicaoIdCabecalho).success).toBe(true);
    expect(resultado.data.requisicaoId).toBe(requisicaoIdCabecalho);
  });

  it("ignores a request id supplied by the client", async () => {
    const requisicaoIdCliente = "00000000-0000-4000-8000-000000000000";

    const response = await request(app.getHttpServer())
      .get("/api/health")
      .set("X-Request-Id", requisicaoIdCliente);

    const requisicaoIdResposta = response.headers["x-request-id"];

    expect(response.status).toBe(200);
    expect(z.uuid().safeParse(requisicaoIdResposta).success).toBe(true);
    expect(requisicaoIdResposta).not.toBe(requisicaoIdCliente);
  });

  it("exposes public CORS headers without credentials", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/health")
      .set("Origin", "http://localhost:3000");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(
      response.headers["access-control-allow-credentials"],
    ).toBeUndefined();
    expect(response.headers["access-control-expose-headers"]).toBe(
      "X-Request-Id",
    );
  });

  it("allows the local mobile Web origin", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/health")
      .set("Origin", "http://localhost:8081");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:8081",
    );
  });

  it("answers preflight with the explicitly supported methods and headers", async () => {
    const response = await request(app.getHttpServer())
      .options("/api/health")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "PATCH")
      .set("Access-Control-Request-Headers", "content-type");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(response.headers["access-control-allow-methods"]).toBe(
      "GET,HEAD,POST,PUT,PATCH,DELETE",
    );
    expect(response.headers["access-control-allow-headers"]).toBe(
      `Content-Type,${CABECALHO_CSRF}`,
    );
    expect(
      response.headers["access-control-allow-credentials"],
    ).toBeUndefined();
  });

  it("does not expose CORS headers to an unconfigured origin", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/health")
      .set("Origin", "https://origem-nao-permitida.example");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(
      response.headers["access-control-allow-credentials"],
    ).toBeUndefined();
  });
});
