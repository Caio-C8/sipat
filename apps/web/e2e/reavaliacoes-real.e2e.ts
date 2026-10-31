import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type Fixture = {
  token: string;
  comissaoId: string;
  bemId: string;
  numero: string;
  busca: string;
};
const real = Boolean(process.env.REAVALIACOES_INTEGRATION_DATABASE_URL);

test.describe("reavaliação Web → API → PostgreSQL descartável", () => {
  test.skip(
    !real,
    "Exige banco isolado e playwright.reavaliacoes-real.config.ts.",
  );

  test("seleciona bem, revê prévia, confirma e consulta registro persistido", async ({
    page,
  }) => {
    const fixture = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "test-results/reavaliacoes-real-fixture.json",
        ),
        "utf8",
      ),
    ) as Fixture;
    await page.context().addCookies([
      {
        name: "sipat_session",
        value: fixture.token,
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/reavaliacoes/nova");
    await expect(
      page.getByRole("heading", { name: "Nova reavaliação" }),
    ).toBeVisible();
    await page
      .getByRole("searchbox", { name: "Descrição ou características" })
      .fill(fixture.busca);
    await page.getByRole("button", { name: "Pesquisar" }).click();
    const bem = page.getByRole("listitem").filter({ hasText: fixture.numero });
    await expect(bem).toBeVisible();
    await bem.getByRole("button", { name: "Selecionar" }).click();
    const grupo = page.getByRole("group", { name: new RegExp(fixture.numero) });
    await expect(grupo).toBeVisible();
    await page
      .getByRole("combobox", { name: "Comissão vigente" })
      .selectOption(fixture.comissaoId);
    await grupo
      .getByRole("textbox", { name: "Novo valor bruto (R$)" })
      .fill("1200");
    await grupo
      .getByRole("spinbutton", { name: "Nova vida útil (meses)" })
      .fill("60");
    await grupo
      .getByRole("textbox", { name: "Novo residual (R$)" })
      .fill("150");
    await page.getByRole("button", { name: "Calcular prévia" }).click();
    await expect(
      page.getByRole("heading", { name: "3. Revisar antes de confirmar" }),
    ).toBeVisible();
    await expect(page.getByText("Quota mensal inicial estimada")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar reavaliação" }).click();
    await expect(
      page.getByText("1 registro(s) individual(is) criado(s)."),
    ).toBeVisible();
    await page
      .getByRole("link", { name: /Ver reavaliação do patrimônio/ })
      .click();
    await expect(page).toHaveURL(/\/reavaliacoes\/[0-9a-f-]+$/);
    await expect(page.getByText(fixture.numero)).toBeVisible();
    await expect(
      page.getByRole("row", { name: /Valor bruto/ }).getByRole("cell", {
        name: "R$ 1.200,0000000",
      }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole("heading", { name: "Detalhes da reavaliação" }),
    ).toBeVisible();
    const largura = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(largura).toBeLessThanOrEqual(390);
    const acessibilidade = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(acessibilidade.violations).toEqual([]);
  });
});
