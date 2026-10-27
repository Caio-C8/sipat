import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DevelopmentCheckBanner,
  getDevelopmentCheckBannerCopy,
  shouldShowDevelopmentCheckBanner,
} from "./development-check-banner";

const routerPush = vi.fn();
let pathname = "/login";

vi.mock("expo-router", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: routerPush }),
}));

describe("DevelopmentCheckBanner", () => {
  beforeEach(() => {
    pathname = "/login";
  });

  it("oferece uma ação acessível para abrir as verificações", () => {
    const markup = renderToStaticMarkup(<DevelopmentCheckBanner />);

    expect(markup).toContain('role="link"');
    expect(markup).toContain(
      'aria-label="Ambiente de desenvolvimento — abrir verificações"',
    );
  });

  it("adapta a mensagem quando a rota de verificação já está aberta", () => {
    pathname = "/check";

    const markup = renderToStaticMarkup(<DevelopmentCheckBanner />);

    expect(markup).toContain(getDevelopmentCheckBannerCopy(true));
  });

  it("só habilita a faixa no ambiente de desenvolvimento", () => {
    expect(shouldShowDevelopmentCheckBanner("development")).toBe(true);
    expect(shouldShowDevelopmentCheckBanner("test")).toBe(false);
    expect(shouldShowDevelopmentCheckBanner("staging")).toBe(false);
    expect(shouldShowDevelopmentCheckBanner("production")).toBe(false);
  });
});
