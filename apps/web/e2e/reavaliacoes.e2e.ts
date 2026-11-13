import { expect, test, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function autenticar(
  context: BrowserContext,
  sessao: "active" | "director",
) {
  await context.addCookies([
    {
      name: "sipat_session",
      value: sessao,
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
}

test.describe("reavaliações por perfil", () => {
  test("Administrador consulta sem receber ações e a API mantém o 403", async ({
    context,
    page,
  }) => {
    await autenticar(context, "active");
    await page.goto("/reavaliacoes");
    await expect(
      page.getByRole("heading", { name: "Reavaliações", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Nova reavaliação" }),
    ).toHaveCount(0);
    await page.goto("/reavaliacoes/nova");
    await expect(
      page.getByRole("heading", { name: "Acesso não permitido" }),
    ).toBeVisible();
    const resposta = await page.request.post(
      "/api/backend/reavaliacoes/previa",
      {
        data: {},
      },
    );
    expect(resposta.status()).toBe(403);
    const acessibilidade = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(acessibilidade.violations).toEqual([]);
  });

  test("Diretor recebe a entrada para a criação independente", async ({
    context,
    page,
  }) => {
    await autenticar(context, "director");
    await page.goto("/reavaliacoes");
    await expect(
      page.getByRole("link", { name: "Nova reavaliação" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Nova reavaliação" }).click();
    await expect(
      page.getByRole("heading", { name: "Nova reavaliação" }),
    ).toBeVisible();
    await expect(page.getByLabel("Etapas da reavaliação")).toBeVisible();
  });
});
