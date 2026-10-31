import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type Fixture = {
  token: string;
  comissaoId: string;
  bens: { id: string; numero: string }[];
  busca: string;
};
const real = Boolean(process.env.EMPRESTIMOS_INTEGRATION_DATABASE_URL);

test.describe("empréstimo Web → API → PostgreSQL descartável", () => {
  test.skip(
    !real,
    "Exige banco isolado e playwright.emprestimos-real.config.ts.",
  );

  test("registra grupo, devolve parcialmente e conclui com histórico", async ({
    page,
  }) => {
    const fixture = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "test-results/emprestimos-real-fixture.json",
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
    await page.goto("/emprestimos/nova");
    await expect(
      page.getByRole("heading", { name: "Novo empréstimo" }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Buscar patrimônio" })
      .fill(fixture.busca);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    for (const bem of fixture.bens) {
      await page
        .getByRole("listitem")
        .filter({ hasText: bem.numero })
        .getByRole("button", { name: "Selecionar" })
        .click();
    }
    await page
      .getByRole("textbox", { name: "Destinatário externo" })
      .fill("Instituição sintética RF16");
    await page
      .getByRole("textbox", { name: "Finalidade" })
      .fill("Teste integrado RF16");
    await page
      .getByRole("combobox", { name: "Comissão vigente na saída" })
      .selectOption(fixture.comissaoId);
    await page.getByRole("button", { name: "Registrar saída" }).click();
    const resultado = page.getByRole("region", {
      name: "Resultado do registro",
    });
    await expect(resultado).toContainText("2 bem(ns)");
    await resultado.getByRole("link").click();
    await expect(
      page.getByText("Em andamento · 2 de 2 pendente(s)"),
    ).toBeVisible();
    await page
      .getByRole("checkbox", { name: new RegExp(fixture.bens[0]!.numero) })
      .check();
    await page
      .getByRole("combobox", { name: "Comissão vigente na devolução" })
      .selectOption(fixture.comissaoId);
    await page
      .getByRole("button", { name: "Registrar devolução de 1 bem(ns)" })
      .click();
    await expect(
      page.getByText("Em andamento · 1 de 2 pendente(s)"),
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: new RegExp(fixture.bens[0]!.numero) }),
    ).toHaveCount(0);
    await page
      .getByRole("checkbox", { name: new RegExp(fixture.bens[1]!.numero) })
      .check();
    await page
      .getByRole("button", { name: "Registrar devolução de 1 bem(ns)" })
      .click();
    await expect(
      page.getByText("Concluído · 0 de 2 pendente(s)"),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Concluído · 0 de 2 pendente(s)"),
    ).toBeVisible();
    await expect(page.getByText("Devolvido")).toHaveCount(2);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    const acessibilidade = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(acessibilidade.violations).toEqual([]);
    await page.screenshot({
      path: "test-results/emprestimos-real-mobile.png",
      fullPage: true,
    });
  });
});
