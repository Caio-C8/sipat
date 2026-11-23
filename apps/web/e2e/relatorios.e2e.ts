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
      page
        .getByRole("region", { name: "Catálogo de relatórios" })
        .getByRole("article"),
    ).toHaveCount(10);
    await expect(
      page.getByRole("heading", { name: "Relação de patrimônios" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Configurar relatório" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Relação de patrimônios" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Gerar prévia" }),
    ).toBeVisible();
    await expect(page.getByLabel("Busca")).toHaveCount(0);
    await expect(page.getByText("Seleção por cadastro")).toHaveCount(0);
    await expect(page.getByText(/\d+ opções/)).toHaveCount(0);
    const patrimonio = page.getByRole("combobox", { name: "Patrimônio" });
    await expect(patrimonio).toBeVisible();
    await patrimonio.click();
    await page
      .getByRole("option", { name: "REL-301 · Notebook para relatório" })
      .click();
    await page.getByRole("button", { name: "Gerar prévia" }).click();
    await expect(page).toHaveURL(
      new RegExp(
        `patrimonioId=${encodeURIComponent("33333333-3333-4333-8333-333333333331")}`,
      ),
    );
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
    await expect(page.getByText("4.500,0000000").first()).toBeVisible();
    await expect(
      page.getByText(
        /UUID|São Paulo|America\/Sao_Paulo|Rastreabilidade|desempate/i,
      ),
    ).toHaveCount(0);
    await expect(page.getByText("Ordenação", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Página", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Sobre a prévia", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      page.getByText("Observações importantes", { exact: true }),
    ).toHaveCount(0);
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

  test("ignora a busca textual antiga na relação de patrimônios", async ({
    page,
    baseURL,
  }) => {
    await autenticar(page, baseURL);
    await page.goto(
      "/relatorios?relatorio=patrimonios&consultar=1&busca=identificador-antigo",
    );
    await expect(page.getByLabel("Busca")).toHaveCount(0);
    await expect(page.getByText("identificador-antigo")).toHaveCount(0);
  });

  test("formata competências, datas e horários da prévia", async ({
    page,
    baseURL,
  }) => {
    await autenticar(page, baseURL);
    await page.goto("/relatorios?relatorio=depreciacoes&consultar=1");
    await expect(
      page.getByRole("cell", { name: "10/2026", exact: true }),
    ).toBeVisible();
    await page.getByText("Mais informações").click();
    await expect(page.getByText("01/11/2026, 09:00:00")).toBeVisible();
    await expect(page.getByText("2026-11-01T12:00:00.000Z")).toHaveCount(0);
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
