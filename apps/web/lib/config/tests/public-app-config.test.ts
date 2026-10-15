import { describe, expect, it } from "vitest";
import { obterConfiguracaoPublica } from "../public-app-config";

describe("obterConfiguracaoPublica", () => {
  it.each(["development", "staging", "production", "test"])(
    "aceita o ambiente %s",
    (environment) => {
      expect(obterConfiguracaoPublica("Aplicação", environment)).toMatchObject({
        appName: "Aplicação",
        environment,
      });
    },
  );

  it("usa os valores padrão quando as variáveis não foram definidas", () => {
    expect(obterConfiguracaoPublica(undefined, undefined)).toEqual({
      appName: "SIPAT",
      environment: "development",
    });
  });

  it("normaliza o nome público da aplicação", () => {
    expect(obterConfiguracaoPublica("  Minha aplicação  ", "staging")).toEqual({
      appName: "Minha aplicação",
      environment: "staging",
    });
  });

  it("não aceita um ambiente incompatível com o contrato", () => {
    expect(() =>
      obterConfiguracaoPublica("Aplicação", "homologacao"),
    ).toThrowError(
      "NEXT_PUBLIC_APP_ENV deve ser development, staging, production ou test.",
    );
  });
});
