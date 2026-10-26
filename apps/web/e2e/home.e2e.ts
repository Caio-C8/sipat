import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./support/test";

test.describe("Página inicial", () => {
  test("apresenta o catálogo público de páginas e health checks", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/^Início \| .+/);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "SIPAT",
      }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: /Login/ })).toHaveAttribute(
      "href",
      "/login",
    );
    await expect(
      page.getByRole("link", { name: /Visão geral/ }),
    ).toHaveAttribute("href", "/dashboard");
    await expect(
      page.getByRole("link", { name: /Aplicação Web/ }),
    ).toHaveAttribute("href", "/api/health");
    await expect(
      page.getByText("/api/backend/:path*", { exact: true }),
    ).toBeVisible();
  });

  test("não possui violações automatizáveis de acessibilidade", async ({
    page,
  }) => {
    await page.goto("/");

    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      resultado.violations,
      JSON.stringify(resultado.violations, null, 2),
    ).toEqual([]);
  });
});
