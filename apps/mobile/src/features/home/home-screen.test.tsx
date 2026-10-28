import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HomeScreen } from "./home-screen";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("../auth/session/session-context", () => ({
  useSession: () => ({
    manager: { logout: vi.fn() },
    state: {
      status: "authenticated",
      identity: { nome: "Ana Silva" },
    },
  }),
}));

describe("HomeScreen", () => {
  it("confirma a sessão sem conteúdo de domínio e oferece logout", () => {
    const markup = renderToStaticMarkup(<HomeScreen />);

    expect(markup).toContain("Início");
    expect(markup).toContain("Olá, Ana Silva");
    expect(markup).toContain("ainda não possui conteúdo patrimonial");
    expect(markup).toContain("Sair");
    expect(markup).not.toContain("MOBILE-HOME-001");
  });
});
