import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./support/test";

test.describe("Página inicial", () => {
  test("apresenta a visão geral ilustrativa", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/^Visão geral \| .+/);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Bem-vindo, Paulo!",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: "Início",
      }),
    ).toHaveAttribute("href", "/");

    await expect(
      page.getByText("SIPAT · Visão geral · dados ilustrativos"),
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
