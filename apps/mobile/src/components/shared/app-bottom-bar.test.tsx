import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppBottomBar, appBottomBarItems } from "./app-bottom-bar";

const routerState = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("expo-router", () => ({
  usePathname: () => routerState.pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("AppBottomBar", () => {
  it("mantém todos os destinos principais navegáveis", () => {
    expect(appBottomBarItems).toEqual([
      expect.objectContaining({ label: "Início", path: "/" }),
      expect.objectContaining({ label: "Bens", path: "/bens" }),
      expect.objectContaining({ label: "Inventário", path: "/inventarios" }),
      expect.objectContaining({
        label: "Cadastro",
        path: "/cadastro/patrimonio",
      }),
      expect.objectContaining({ label: "Relatórios", path: "/relatorios" }),
    ]);

    const markup = renderToStaticMarkup(<AppBottomBar />);

    expect(markup).toContain('aria-label="Navegação principal"');
    expect(markup).toContain('aria-selected="true"');
    expect(markup).not.toContain('aria-disabled="true"');
    expect(markup).not.toContain("href=");
  });

  it("habilita a consulta de Inventário para o Administrador", () => {
    const markup = renderToStaticMarkup(<AppBottomBar />);

    expect(markup).not.toContain('aria-disabled="true"');
    expect(markup).toContain('aria-label="Inventário"');
  });

  it("mantém Relatórios ativo em toda a árvore", () => {
    routerState.pathname = "/relatorios/ficha-bem";
    const markup = renderToStaticMarkup(<AppBottomBar />);

    expect(markup).toMatch(/aria-label="Relatórios"[^>]+aria-selected="true"/);
    routerState.pathname = "/";
  });
});
