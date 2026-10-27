import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppTopbar } from "./app-topbar";

vi.mock("../../../assets/brasao.png", () => ({
  default: { uri: "brasao.png" },
}));

describe("AppTopbar", () => {
  it("identifica o produto e a Câmara em um cabeçalho acessível", () => {
    const markup = renderToStaticMarkup(<AppTopbar />);

    expect(markup).toContain('role="heading"');
    expect(markup).toContain("SIPAT");
    expect(markup).toContain("Câmara Municipal de Patos de Minas");
    expect(markup).toContain(
      'aria-label="SIPAT, Câmara Municipal de Patos de Minas"',
    );
  });
});
