import { MODULE_METADATA } from "@nestjs/common/constants";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "../auth.module";
import { AutenticacaoGuard } from "../guards/autenticacao.guard";
import { AutorizacaoGuard } from "../guards/autorizacao.guard";
import { CsrfGuard } from "../guards/csrf.guard";

describe("AuthModule", () => {
  it("registra os Guards globais na ordem autenticação, autorização e CSRF", () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      AuthModule,
    ) as readonly unknown[];

    const guardsGlobais = providers
      .filter(
        (provider): provider is { provide: symbol; useClass: unknown } =>
          typeof provider === "object" &&
          provider !== null &&
          Reflect.get(provider, "provide") === APP_GUARD,
      )
      .map((provider) => provider.useClass);

    expect(guardsGlobais).toEqual([
      AutenticacaoGuard,
      AutorizacaoGuard,
      CsrfGuard,
    ]);
  });
});
