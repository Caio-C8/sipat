import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./support/test";

test.describe("Página inicial", () => {
  test("carrega a aplicação e apresenta os health checks", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/^Início \| .+/);

    await expect(
      page.getByRole("heading", {
        level: 1,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: /Aplicação web/,
      }),
    ).toHaveAttribute("href", "/api/health");

    await expect(
      page.getByRole("link", {
        name: /API backend/,
      }),
    ).toHaveAttribute("href", "/api/backend/health");
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
