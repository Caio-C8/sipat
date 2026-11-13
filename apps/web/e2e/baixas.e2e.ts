import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const patrimonioId = "7041c62b-5f83-432c-a178-889977d839b1";

async function sessao(
  page: Page,
  baseURL: string | undefined,
  perfil: "active" | "director",
) {
  if (!baseURL) throw new Error("baseURL necessária");
  await page.context().addCookies([
    {
      name: "sipat_session",
      value: perfil,
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
    },
    {
      name: "sipat_baixas_scenario",
      value: "1",
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
}

test.describe("Baixas patrimoniais", () => {
  test("Administrador consulta lista e detalhe sem controles exclusivos", async ({
    page,
    baseURL,
  }) => {
    await sessao(page, baseURL, "active");
    await page.goto("/baixas");
    await expect(page).toHaveTitle("Baixa | SIPAT");
    await expect(
      page.getByRole("heading", { name: "Baixa", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Registrar baixa" }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Ver detalhe" }).click();
    await expect(page).toHaveURL(new RegExp(`/baixas/${patrimonioId}`));
    await expect(
      page.getByRole("heading", { name: "Baixa — 123" }),
    ).toBeVisible();
    await expect(page.getByText("João Diretor", { exact: true })).toBeVisible();
    await expect(
      page.getByText("dcebc286-aa55-4a36-9f2e-f8f885d2126c"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Abrir PDF comprobatório" }),
    ).toHaveCount(0);
    expect(
      (await new AxeBuilder({ page }).include("main").analyze()).violations,
    ).toEqual([]);
  });

  test("Diretor registra uma baixa unitária e lê o detalhe persistido", async ({
    page,
    baseURL,
  }) => {
    await sessao(page, baseURL, "director");
    await page.goto("/baixas/nova");
    await page
      .getByRole("radio", { name: "Selecionar patrimônio 123" })
      .check();
    await page
      .getByRole("button", { name: /Continuar com 1 patrimônio/ })
      .click();
    await page.getByLabel("Data da baixa").fill("2026-11-10");
    await page
      .getByRole("combobox", { name: "Tipo", exact: true })
      .selectOption("ALIENACAO");
    await expect(page.getByLabel("Comissão vigente na data")).toContainText(
      "Comissão patrimonial vigente",
    );
    await page
      .getByLabel("Comissão vigente na data")
      .selectOption("5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab");
    await page
      .getByLabel("Motivo")
      .fill("Alienação autorizada após avaliação.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Confirmar baixa" }).click();
    await expect(page).toHaveURL(new RegExp(`/baixas/${patrimonioId}`));
    await expect(page.getByRole("status")).toContainText(
      "Baixa registrada com sucesso",
    );
    await expect(
      page.getByRole("button", { name: "Abrir PDF comprobatório" }),
    ).toBeVisible();
  });

  test("mantém reflow, foco e acessibilidade nos viewports exigidos", async ({
    page,
    baseURL,
    browser,
  }) => {
    await sessao(page, baseURL, "director");
    for (const width of [1920, 1536, 900, 390]) {
      await page.setViewportSize({ width, height: 1080 });
      await page.goto("/baixas");
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
      expect(
        (await new AxeBuilder({ page }).include("main").analyze()).violations,
      ).toEqual([]);
    }
    const contextoAmpliado = await browser.newContext({
      viewport: { width: 640, height: 540 },
      deviceScaleFactor: 2,
    });
    await contextoAmpliado.addCookies(await page.context().cookies());
    const paginaAmpliada = await contextoAmpliado.newPage();
    await paginaAmpliada.goto(new URL("/baixas", baseURL).toString());
    expect(
      await paginaAmpliada.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    expect(
      (await new AxeBuilder({ page: paginaAmpliada }).include("main").analyze())
        .violations,
    ).toEqual([]);
    await contextoAmpliado.close();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
      "BODY",
    );
  });
});
