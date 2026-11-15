import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./support/test";

test.describe("Página inicial", () => {
  test("encaminha o visitante anônimo para o login", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page).toHaveTitle(/^Login \| .+/);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Acesse sua conta",
      }),
    ).toBeVisible();
  });

  test("mantém os health checks públicos", async ({ request }) => {
    const webResponse = await request.get("/api/health");
    expect(webResponse.ok()).toBe(true);
    await expect(webResponse.json()).resolves.toMatchObject({
      status: "ok",
      service: "web",
    });

    const apiResponse = await request.get("/api/backend/health");
    expect(apiResponse.ok()).toBe(true);
    await expect(apiResponse.json()).resolves.toMatchObject({ status: "ok" });
  });

  test("mantém o destino anônimo sem violações automatizáveis de acessibilidade", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);

    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      resultado.violations,
      JSON.stringify(resultado.violations, null, 2),
    ).toEqual([]);
  });
});
