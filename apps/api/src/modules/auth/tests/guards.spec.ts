import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { Reflector } from "@nestjs/core";
import { CABECALHO_CSRF } from "@repo/contracts";
import type { EnvironmentVariables } from "../../../environment";
import type { AuthService } from "../auth.service";
import { AutenticacaoGuard } from "../guards/autenticacao.guard";
import { AutorizacaoGuard } from "../guards/autorizacao.guard";
import { CsrfGuard } from "../guards/csrf.guard";

function criarContexto(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => criarContexto,
    getClass: () => class ControllerTeste {},
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function criarConfig(): ConfigService<EnvironmentVariables, true> {
  return {
    getOrThrow: jest.fn((chave: keyof EnvironmentVariables) => {
      if (chave === "APP_ENV") return "test";
      if (chave === "CORS_ORIGINS") return "https://web.example";
      throw new Error(`Configuração inesperada: ${chave}`);
    }),
  } as unknown as ConfigService<EnvironmentVariables, true>;
}

describe("AutenticacaoGuard", () => {
  const identidade = {
    id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    nome: "Maria da Silva",
    email: "maria@example.com",
    perfil: "ADMINISTRADOR" as const,
  };

  it("permite rota explicitamente pública sem consultar sessão", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;
    const authService = {
      autenticar: jest.fn(),
    } as unknown as AuthService;
    const guard = new AutenticacaoGuard(reflector, authService, criarConfig());

    await expect(guard.canActivate(criarContexto({}))).resolves.toBe(true);
    expect(authService.autenticar).not.toHaveBeenCalled();
  });

  it("anexa somente a identidade retornada por uma sessão válida", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const authService = {
      autenticar: jest.fn().mockResolvedValue(identidade),
    } as unknown as AuthService;
    const request = {
      cookies: { sipat_session: "A".repeat(43) },
    };
    const guard = new AutenticacaoGuard(reflector, authService, criarConfig());

    await expect(guard.canActivate(criarContexto(request))).resolves.toBe(true);
    expect(request).toEqual({
      cookies: { sipat_session: "A".repeat(43) },
      identidadeAutenticada: identidade,
    });
  });

  it("retorna 401 quando a sessão não autentica", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const authService = {
      autenticar: jest.fn().mockResolvedValue(null),
    } as unknown as AuthService;
    const guard = new AutenticacaoGuard(reflector, authService, criarConfig());

    await expect(guard.canActivate(criarContexto({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe("AutorizacaoGuard", () => {
  const identidade = {
    id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    nome: "Maria da Silva",
    email: "maria@example.com",
    perfil: "ADMINISTRADOR" as const,
  };

  it("permite rota pública sem exigir perfil", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;

    expect(new AutorizacaoGuard(reflector).canActivate(criarContexto({}))).toBe(
      true,
    );
  });

  it("retorna 401 se a identidade esperada não estiver anexada", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    expect(() =>
      new AutorizacaoGuard(reflector).canActivate(criarContexto({})),
    ).toThrow(UnauthorizedException);
  });

  it("nega por padrão quando a metadata de perfil está ausente", () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(undefined),
    } as unknown as Reflector;

    expect(() =>
      new AutorizacaoGuard(reflector).canActivate(
        criarContexto({ identidadeAutenticada: identidade }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("permite um perfil declarado e retorna 403 para outro perfil", () => {
    const reflectorPermitido = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(["ADMINISTRADOR"]),
    } as unknown as Reflector;
    const reflectorNegado = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(["DIRETOR_PATRIMONIO"]),
    } as unknown as Reflector;
    const contexto = criarContexto({ identidadeAutenticada: identidade });

    expect(new AutorizacaoGuard(reflectorPermitido).canActivate(contexto)).toBe(
      true,
    );
    expect(() =>
      new AutorizacaoGuard(reflectorNegado).canActivate(contexto),
    ).toThrow(ForbiddenException);
  });
});

describe("CsrfGuard", () => {
  const guard = new CsrfGuard(criarConfig());

  it.each(["GET", "HEAD", "OPTIONS"])(
    "não aplica CSRF ao método seguro %s",
    (method) => {
      expect(guard.canActivate(criarContexto({ method, headers: {} }))).toBe(
        true,
      );
    },
  );

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "aceita %s com Origin e header exatos",
    (method) => {
      expect(
        guard.canActivate(
          criarContexto({
            method,
            headers: {
              origin: "https://web.example",
              [CABECALHO_CSRF.toLowerCase()]: "1",
            },
          }),
        ),
      ).toBe(true);
    },
  );

  it.each([
    ["ausente", undefined],
    ["null", "null"],
    ["não permitida", "https://evil.example"],
  ])("rejeita Origin %s", (_caso, origin) => {
    expect(() =>
      guard.canActivate(
        criarContexto({
          method: "POST",
          headers: {
            origin,
            [CABECALHO_CSRF.toLowerCase()]: "1",
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it.each([
    ["ausente", undefined],
    ["inválido", "0"],
  ])("rejeita header CSRF %s", (_caso, valor) => {
    expect(() =>
      guard.canActivate(
        criarContexto({
          method: "POST",
          headers: {
            origin: "https://web.example",
            [CABECALHO_CSRF.toLowerCase()]: valor,
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
