import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function autenticar(page: Page, baseURL?: string) {
  if (!baseURL) throw new Error("baseURL necessária");
  await page.context().addCookies([
    {
      name: "sipat_session",
      value: "active",
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
    },
    {
      name: "sipat_relatorios_scenario",
      value: "1",
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
}

test.describe("Relatórios", () => {
  test("apresenta catálogo e abre a configuração do relatório", async ({
    page,
    baseURL,
  }) => {
    await autenticar(page, baseURL);
    await page.goto("/relatorios");
    await expect(page).toHaveTitle("Relatórios | SIPAT");
    await expect(
      page.getByRole("region", { name: "Catálogo de relatórios" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Relação de patrimônios" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Configurar relatório →" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Relação de patrimônios" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Gerar prévia" }),
    ).toBeVisible();
  });

  test("gera prévia, expõe totais e mantém reflow e acessibilidade", async ({
    page,
    baseURL,
  }) => {
    await autenticar(page, baseURL);
    await page.goto("/relatorios?relatorio=patrimonios&consultar=1");
    await expect(
      page.getByRole("heading", { name: "Prévia · Relação de patrimônios" }),
    ).toBeVisible();
    await expect(page.getByText("Notebook para relatório")).toBeVisible();
    await expect(
      page.getByText("Total de registros encontrados").locator(".."),
    ).toContainText("1");
    await expect(
      page.getByRole("button", { name: "Baixar PDF completo" }),
    ).toBeVisible();
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
    }
    expect(
      (await new AxeBuilder({ page }).include("main").analyze()).violations,
    ).toEqual([]);
  });

  test("rejeita relatório desconhecido sem consultar dados", async ({
    page,
    baseURL,
  }) => {
    await autenticar(page, baseURL);
    await page.goto("/relatorios?relatorio=sql&consultar=1");
    await expect(
      page.getByRole("heading", { name: "Relatório inválido" }),
    ).toBeVisible();
    await expect(
      page.getByText("Escolha um relatório do catálogo.", { exact: true }),
    ).toBeVisible();
  });
});
