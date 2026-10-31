import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import CheckScreen from "../../app/check";
import { institutionalPalette } from "../../theme/tokens";

vi.mock("expo-router", () => ({
  Redirect: () => null,
  usePathname: () => "/check",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../../config/public-app-config", () => ({
  publicAppConfig: {
    appName: "SIPAT",
    appVersion: "1.2.3",
    environment: "development",
    apiBaseUrl: "https://api.example.test",
    apiHealthUrl: "https://api.example.test/api/health",
  },
}));

vi.mock("../auth/session/session-context", () => ({
  useSession: () => ({ state: { status: "anonymous" } }),
}));

describe("CheckScreen", () => {
  it("exibe runtime, health e o catálogo completo sem dados privados", () => {
    const markup = renderToStaticMarkup(<CheckScreen />);

    expect(markup).toContain("Verificações da infraestrutura");
    expect(markup).toContain("Aplicativo móvel");
    expect(markup).toContain("API backend");
    expect(markup).toContain("Rotas do aplicativo");
    expect(markup).toContain("/login");
    expect(markup).toContain("/redefinir-senha");
    expect(markup).toContain("/senha-atualizada");
    expect(markup).toContain("/check");
    expect(markup).not.toContain("accessToken");
    expect(markup).not.toContain("refreshToken");
    expect(markup.toLowerCase()).toContain("#2563eb");
    expect(institutionalPalette).toMatchObject({
      action: "#2563EB",
      institutional: "#1E3A5F",
      structure: "#0F2644",
    });
  });
});
