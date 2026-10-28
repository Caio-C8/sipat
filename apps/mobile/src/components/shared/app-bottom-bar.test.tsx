import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppBottomBar, appBottomBarItems } from "./app-bottom-bar";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

describe("AppBottomBar", () => {
  it("mantém somente Início ativo e os destinos inexistentes desabilitados", () => {
    expect(appBottomBarItems).toEqual([
      expect.objectContaining({ label: "Início", state: "active" }),
      expect.objectContaining({ label: "Bens", state: "disabled" }),
      expect.objectContaining({ label: "Inventário", state: "disabled" }),
      expect.objectContaining({ label: "Cadastro", state: "disabled" }),
      expect.objectContaining({ label: "Relatórios", state: "disabled" }),
    ]);

    const markup = renderToStaticMarkup(<AppBottomBar />);

    expect(markup).toContain('aria-label="Navegação principal"');
    expect(markup).toContain('aria-selected="true"');
    expect(markup.match(/aria-disabled="true"/g)).toHaveLength(4);
    expect(markup).not.toContain("href=");
  });
});
