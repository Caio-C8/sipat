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
  it("mantém Início, Bens e Cadastro navegáveis", () => {
    expect(appBottomBarItems).toEqual([
      expect.objectContaining({ label: "Início", path: "/" }),
      expect.objectContaining({ label: "Bens", path: "/bens" }),
      expect.objectContaining({ label: "Inventário" }),
      expect.objectContaining({
        label: "Cadastro",
        path: "/cadastro/patrimonio",
      }),
      expect.objectContaining({ label: "Relatórios" }),
    ]);

    const markup = renderToStaticMarkup(<AppBottomBar />);

    expect(markup).toContain('aria-label="Navegação principal"');
    expect(markup).toContain('aria-selected="true"');
    expect(markup.match(/aria-disabled="true"/g)).toHaveLength(2);
    expect(markup).not.toContain("href=");
  });
});
