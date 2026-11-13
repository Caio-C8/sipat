import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type Fixture = {
  token: string;
  adminToken: string;
  comissaoId: string;
  bens: { id: string; numero: string }[];
  bensSeparados: { id: string; numero: string }[];
  busca: string;
};
const real = Boolean(process.env.EMPRESTIMOS_INTEGRATION_DATABASE_URL);
function fixture(): Fixture {
  return JSON.parse(
    readFileSync(
      path.resolve(process.cwd(), "test-results/emprestimos-real-fixture.json"),
      "utf8",
    ),
  ) as Fixture;
}
async function conferirTela(page: Page, largura: number, arquivo: string) {
  await page.setViewportSize({ width: largura, height: 900 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(largura);
  await page.screenshot({ path: `test-results/${arquivo}`, fullPage: true });
}

test.describe("empréstimo Web → API → PostgreSQL descartável", () => {
  test.skip(
    !real,
    "Exige banco isolado e playwright.emprestimos-real.config.ts.",
  );

  test("registra grupo, devolve parcialmente e conclui com histórico", async ({
    page,
  }) => {
    const dados = fixture();
    await page.context().addCookies([
      {
        name: "sipat_session",
        value: dados.token,
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/emprestimos/nova");
    await expect(
      page.getByRole("heading", { name: "Novo empréstimo" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Alterar seleção" }).click();
    await page
      .getByRole("textbox", { name: "Patrimônio ou descrição" })
      .fill(dados.busca);
    await page.getByRole("button", { name: "Pesquisar" }).click();
    for (const bem of dados.bens) {
      await page
        .getByRole("row")
        .filter({ hasText: bem.numero })
        .getByRole("checkbox")
        .check();
    }
    await conferirTela(page, 1024, "emprestimos-selecao-intermediaria.png");
    await page
      .getByRole("textbox", { name: "Patrimônio ou descrição" })
      .fill("busca-sem-resultado-rf16");
    await page.getByRole("button", { name: "Pesquisar" }).click();
    await expect(page.getByText("2 de 50 bens selecionados")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar seleção (2)" }).click();
    await page
      .getByRole("textbox", { name: "Destinatário" })
      .fill("Instituição sintética RF16");
    await page
      .getByRole("textbox", { name: "Finalidade" })
      .fill("Teste integrado RF16");
    await page
      .getByRole("combobox", { name: "Comissão vigente na data do empréstimo" })
      .selectOption(dados.comissaoId);
    await conferirTela(page, 1440, "emprestimos-cadastro-amplo.png");
    await page.getByRole("button", { name: "Revisar empréstimo" }).click();
    await expect(
      page.getByRole("heading", { name: "Revisar empréstimo" }),
    ).toBeVisible();
    await conferirTela(page, 390, "emprestimos-revisao-estreita.png");
    let saida: { dados: { id: string }[] | { id: string } } | null = null;
    await page.route(
      "**/api/backend/emprestimos",
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        const resposta = await route.fetch();
        expect(resposta.status()).toBe(201);
        saida = await resposta.json();
        await route.abort("connectionfailed");
      },
      { times: 1 },
    );
    await page.getByRole("button", { name: "Confirmar empréstimo" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Não foi possível conectar com o serviço" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Confirmar empréstimo" }).click();
    await expect(
      page.getByRole("status").filter({
        hasText:
          "Esta operação já havia sido concluída. Nenhuma nova alteração foi feita.",
      }),
    ).toBeVisible();
    const emprestimos = (
      saida as unknown as {
        dados: { id: string }[] | { id: string };
      }
    ).dados;
    const emprestimoId = Array.isArray(emprestimos)
      ? emprestimos[0]!.id
      : emprestimos.id;
    await page.goto(`/emprestimos/${emprestimoId}`);
    await expect(page.getByText("2 de 2 pendente(s)")).toBeVisible();
    await conferirTela(page, 1440, "emprestimos-detalhe-amplo.png");
    await page.getByRole("button", { name: "Registrar devolução" }).click();
    await conferirTela(page, 1024, "emprestimos-devolucao-intermediaria.png");
    await page
      .getByRole("checkbox", { name: new RegExp(dados.bens[0]!.numero) })
      .check();
    await page
      .getByRole("combobox", { name: "Comissão vigente na devolução" })
      .selectOption(dados.comissaoId);
    await page.route(
      `**/api/backend/emprestimos/${emprestimoId}/devolucoes`,
      async (route) => {
        const resposta = await route.fetch();
        expect(resposta.status()).toBe(201);
        await route.abort("connectionfailed");
      },
      { times: 1 },
    );
    await page.getByRole("button", { name: "Confirmar devolução" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Não foi possível conectar com o serviço" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Confirmar devolução" }).click();
    await expect(
      page.getByRole("status").filter({
        hasText:
          "Esta operação já havia sido concluída. Nenhuma nova alteração foi feita.",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("1 de 2 bens pendentes", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: new RegExp(dados.bens[0]!.numero) }),
    ).toHaveCount(0);
    await page
      .getByRole("link", { name: "Atualizar detalhes do empréstimo" })
      .click();
    await page.getByRole("button", { name: "Registrar devolução" }).click();
    await page
      .getByRole("checkbox", { name: new RegExp(dados.bens[1]!.numero) })
      .check();
    await page
      .getByRole("combobox", { name: "Comissão vigente na devolução" })
      .selectOption(dados.comissaoId);
    await page.getByRole("button", { name: "Confirmar devolução" }).click();
    await expect(page.getByText("0 de 2 pendente(s)")).toBeVisible();
    await page.reload();
    await expect(page.getByText("0 de 2 pendente(s)")).toBeVisible();
    await expect(page.getByText("Devolvido")).toHaveCount(2);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    const acessibilidade = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(acessibilidade.violations).toEqual([]);
    await page.goto("/emprestimos?aba=historico");
    await expect(
      page.getByRole("heading", { name: "Histórico de empréstimos" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("row")
        .filter({ hasText: "Instituição sintética RF16" })
        .first(),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/emprestimos-real-mobile.png",
      fullPage: true,
    });
  });

  test("cria registros separados e restringe escrita ao diretor", async ({
    page,
  }) => {
    const dados = fixture();
    await page.context().addCookies([
      {
        name: "sipat_session",
        value: dados.token,
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/emprestimos/nova");
    await page.getByRole("button", { name: "Alterar seleção" }).click();
    await page
      .getByRole("textbox", { name: "Patrimônio ou descrição" })
      .fill(dados.busca);
    await page.getByRole("button", { name: "Pesquisar" }).click();
    for (const bem of dados.bensSeparados)
      await page
        .getByRole("row")
        .filter({ hasText: bem.numero })
        .getByRole("checkbox")
        .check();
    await page.getByRole("button", { name: "Confirmar seleção (2)" }).click();
    await page
      .getByRole("textbox", { name: "Destinatário" })
      .fill("Instituição sintética separada RF16");
    await page
      .getByRole("textbox", { name: "Finalidade" })
      .fill("Teste integrado RF16 separado");
    await page
      .getByRole("combobox", { name: "Comissão vigente na data do empréstimo" })
      .selectOption(dados.comissaoId);
    await page.getByRole("radio", { name: /Separadamente/ }).check();
    await page.getByRole("button", { name: "Revisar empréstimo" }).click();
    await page.getByRole("button", { name: "Confirmar empréstimo" }).click();
    await expect(
      page.getByRole("heading", { name: "Empréstimo registrado" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Resultado do registro" })
        .getByRole("link", { name: /^Empréstimo/ }),
    ).toHaveCount(2);
    await page.context().clearCookies();
    await page.context().addCookies([
      {
        name: "sipat_session",
        value: dados.adminToken,
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/emprestimos?aba=andamento");
    await expect(
      page.getByRole("heading", { name: "Empréstimos em andamento" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Novo empréstimo" }),
    ).toHaveCount(0);
    await page
      .getByRole("row")
      .filter({ hasText: "Instituição sintética separada RF16" })
      .first()
      .getByRole("link", { name: "Abrir" })
      .click();
    await expect(
      page.getByRole("heading", { level: 1, name: /^Empréstimo [0-9a-f]/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Registrar devolução" }),
    ).toHaveCount(0);
    await page.goto("/emprestimos/nova");
    await expect(
      page.getByRole("heading", { name: "Acesso não permitido" }),
    ).toBeVisible();
  });
});
