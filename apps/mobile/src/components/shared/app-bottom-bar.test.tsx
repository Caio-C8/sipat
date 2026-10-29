import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppBottomBar, appBottomBarItems } from "./app-bottom-bar";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("expo-router", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("AppBottomBar", () => {
  it("habilita Inventário para o Diretor e mantém apenas Relatórios desabilitado", () => {
    expect(appBottomBarItems).toEqual([
      expect.objectContaining({ label: "Início", path: "/" }),
      expect.objectContaining({ label: "Bens", path: "/bens" }),
      expect.objectContaining({ label: "Inventário", path: "/inventarios" }),
      expect.objectContaining({
        label: "Cadastro",
        path: "/cadastro/patrimonio",
      }),
      expect.objectContaining({ label: "Relatórios" }),
    ]);

    const markup = renderToStaticMarkup(
      <AppBottomBar profile="DIRETOR_PATRIMONIO" />,
    );

    expect(markup).toContain('aria-label="Navegação principal"');
    expect(markup).toContain('aria-selected="true"');
    expect(markup.match(/aria-disabled="true"/g)).toHaveLength(1);
    expect(markup).not.toContain("href=");
  });

  it("comunica a restrição de Inventário para o Administrador", () => {
    const markup = renderToStaticMarkup(
      <AppBottomBar profile="ADMINISTRADOR" />,
    );

    expect(markup.match(/aria-disabled="true"/g)).toHaveLength(2);
    expect(markup).toContain(
      "Conferência disponível somente para o Diretor de Patrimônio",
    );
  });
});
