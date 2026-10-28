import { describe, expect, it, vi } from "vitest";
import { getPublicAppConfig } from "./public-app-config";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      version: "1.2.3",
    },
  },
}));

describe("getPublicAppConfig", () => {
  it.each(["development", "staging", "production", "test"])(
    "aceita o ambiente %s",
    (environment) => {
      expect(
        getPublicAppConfig(
          "SIPAT Mobile",
          environment,
          "https://api.example.test/",
          undefined,
          undefined,
        ),
      ).toEqual({
        appName: "SIPAT Mobile",
        appVersion: "1.2.3",
        environment,
        apiBaseUrl: "https://api.example.test",
        apiHealthUrl: "https://api.example.test/api/health",
      });
    },
  );

  it("resolve a API local a partir do host anunciado pelo Metro", () => {
    expect(
      getPublicAppConfig(
        undefined,
        "development",
        undefined,
        "3100",
        "192.168.1.20:8081",
      ),
    ).toEqual({
      appName: "SIPAT",
      appVersion: "1.2.3",
      environment: "development",
      apiBaseUrl: "http://192.168.1.20:3100",
      apiHealthUrl: "http://192.168.1.20:3100/api/health",
    });
  });

  it("não aceita ambiente desconhecido", () => {
    expect(() =>
      getPublicAppConfig(
        undefined,
        "homologacao",
        undefined,
        undefined,
        undefined,
      ),
    ).toThrow(
      "EXPO_PUBLIC_APP_ENV deve ser development, staging, production ou test.",
    );
  });

  it("não aceita uma porta inválida para a API de desenvolvimento", () => {
    expect(() =>
      getPublicAppConfig(
        undefined,
        "development",
        undefined,
        "70000",
        "192.168.1.20:8081",
      ),
    ).toThrow("EXPO_PUBLIC_API_PORT deve ser uma porta TCP válida.");
  });
});
