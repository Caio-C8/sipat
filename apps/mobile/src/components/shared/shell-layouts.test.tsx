import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AppLayout from "../../app/(app)/_layout";
import AuthLayout from "../../app/(auth)/_layout";

vi.mock("expo-router", () => ({
  Redirect: ({ href }: { href: string }) => <span>{href}</span>,
  Stack: () => <main>Conteúdo da rota</main>,
  usePathname: () => "/login",
}));

vi.mock("./app-bottom-bar", () => ({
  AppBottomBar: () => <nav aria-label="Navegação principal" />,
}));

vi.mock("../../features/auth/session/session-context", () => ({
  useSession: () => ({ state: { status: "authenticated" } }),
}));

vi.mock("../../features/auth/session/session-routing", () => ({
  authRedirect: () => null,
  protectedRedirect: () => null,
}));

describe("shells de navegação", () => {
  it("renderiza a bottom bar somente no grupo autenticado", () => {
    const appMarkup = renderToStaticMarkup(<AppLayout />);
    const authMarkup = renderToStaticMarkup(<AuthLayout />);

    expect(appMarkup).toContain('aria-label="Navegação principal"');
    expect(authMarkup).not.toContain('aria-label="Navegação principal"');
  });
});
