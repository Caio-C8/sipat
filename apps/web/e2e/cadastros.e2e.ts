import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
async function sessao(page: import("@playwright/test").Page, value = "active") {
  await page.context().addCookies([
    {
      name: "sipat_session",
      value,
      url: test.info().project.use.baseURL ?? "http://localhost:3100",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
}
test("administrador navega pelos cadastros independentes e abre criação em modal", async ({
  page,
}) => {
  await sessao(page);
  for (const [rota, titulo, criar] of [
    ["/processos-compra", "Processos de compra", "Cadastrar processo"],
    ["/especies", "Espécies", "Cadastrar espécie"],
    ["/naturezas", "Naturezas", "Cadastrar natureza"],
    ["/comissoes", "Comissões", "Cadastrar comissão"],
  ] as const) {
    await page.goto(rota);
    await expect(
      page.getByRole("heading", { name: titulo, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Nenhum registro encontrado.")).toBeVisible();
    await expect(
      page.getByText(/Prévia visual|sem gravação|de exemplo/),
    ).toHaveCount(0);
    await page.getByRole("link", { name: criar }).click();
    await expect(
      page.getByRole("dialog", { name: new RegExp(criar, "i") }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Fechar" }).click();
  }
  for (const [rota, titulo, criar] of [
    ["/responsaveis", "Responsáveis", "Cadastrar responsável"],
    ["/fornecedores", "Fornecedores", "Cadastrar fornecedor"],
  ] as const) {
    await page.goto(rota);
    await expect(page.getByRole("heading", { name: titulo })).toBeVisible();
    await expect(page.getByRole("link", { name: criar })).toBeVisible();
  }
});
test("usuários usa modal pela lista e página completa em acesso direto", async ({
  page,
}) => {
  await sessao(page);
  await page.goto("/usuarios");
  await expect(
    page.getByRole("heading", { name: "Pesquisar usuários" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pesquisar", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Cadastrar usuário" }).click();
  await expect(
    page.getByRole("dialog", { name: "Cadastrar usuário" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();

  await page.goto("/usuarios/novo");
  await expect(
    page.getByRole("heading", { name: "Cadastrar usuário", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Limpar" })).toBeVisible();
});
test("fundação de formulário mantém foco, acessibilidade e layout responsivo", async ({
  page,
}) => {
  await sessao(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/naturezas/novo");
    await expect(
      page.getByRole("form", { name: "Nova natureza" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Salvar natureza" }).click();
  await expect(page.getByLabel("Nome da natureza *")).toBeFocused();
  await expect(page.getByText("Revise os dados informados")).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .include('form[aria-label="Nova natureza"]')
        .analyze()
    ).violations,
  ).toEqual([]);

  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect(
    page.getByRole("button", { name: "Salvar natureza" }),
  ).toBeVisible();
});
test("administrador consulta setores reais e abre formulário habilitado", async ({
  page,
}) => {
  await sessao(page);
  await page.goto("/setores");
  await page.getByRole("textbox", { name: "Buscar" }).fill("Gabinete");
  await page.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(page).toHaveURL(/busca=Gabinete/);
  await expect(page.getByText("Nenhum setor encontrado.")).toBeVisible();
  await page.getByRole("link", { name: "Cadastrar setor" }).click();
  await expect(
    page.getByRole("dialog", { name: "Cadastrar setor", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Salvar setor" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Fechar" }).click();
  await page.goto("/setores/novo");
  await expect(
    page.getByRole("heading", { name: "Cadastrar setor", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Limpar" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("administrador filtra fornecedores por situação na URL", async ({
  page,
}) => {
  await sessao(page);
  await page.goto("/fornecedores");
  await page.getByRole("combobox", { name: "Situação" }).click();
  await page.getByRole("option", { name: "Inativos" }).click();
  await page.getByRole("button", { name: "Pesquisar", exact: true }).click();
  await expect(page).toHaveURL(/situacao=inativos/);
  await expect(page.getByText("Nenhum fornecedor encontrado.")).toBeVisible();
});
test("administrador cria, altera, inativa e corrige conflito de fornecedor", async ({
  page,
}) => {
  await sessao(page);
  await page.context().addCookies([
    {
      name: "sipat_fornecedores_scenario",
      value: "crud",
      url: test.info().project.use.baseURL ?? "http://localhost:3100",
    },
  ]);
  await page.goto("/fornecedores");
  await page.getByRole("link", { name: "Cadastrar fornecedor" }).click();
  await expect(
    page.getByRole("dialog", { name: "Cadastrar fornecedor" }),
  ).toBeVisible();
  await page.getByLabel("Razão social *").fill("Fornecedor E2E");
  await page.getByLabel("CNPJ").fill("11.444.777/0001-61");
  await page.getByRole("button", { name: "Salvar fornecedor" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Editar" }).click();
  await expect(
    page.getByRole("dialog", { name: "Editar fornecedor" }),
  ).toBeVisible();
  await page.getByLabel("Nome fantasia").fill("Fornecedor atualizado");
  const alteracao = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      /\/api\/backend\/fornecedores\/[0-9a-f-]+$/.test(
        new URL(response.url()).pathname,
      ),
  );
  await page.getByRole("button", { name: "Salvar fornecedor" }).click();
  expect((await alteracao).status()).toBe(200);
  await expect(
    page.getByRole("dialog", { name: "Editar fornecedor" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Editar", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Editar fornecedor" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome fantasia")).toHaveValue(
    "Fornecedor atualizado",
  );
  await page.getByRole("button", { name: "Inativar cadastro" }).click();
  await page.getByRole("button", { name: "Confirmar situação" }).click();
  await expect(page.getByText("Situação atual:")).toContainText("Inativo");
  await page.getByRole("button", { name: "Fechar" }).click();
  await page.getByRole("link", { name: "Cadastrar fornecedor" }).click();
  await page.getByLabel("Razão social *").fill("Fornecedor duplicado");
  await page.getByLabel("CNPJ").fill("11.444.777/0001-61");
  await page.getByRole("button", { name: "Salvar fornecedor" }).click();
  await expect(
    page.getByRole("form", { name: "Novo fornecedor" }).getByRole("alert"),
  ).toContainText("Já existe um fornecedor");
  await expect(page.getByLabel("Razão social *")).toHaveValue(
    "Fornecedor duplicado",
  );
});
test("diretor gerencia processos e consulta cadastros sem ações administrativas", async ({
  page,
}) => {
  await sessao(page, "director");
  await page.goto("/processos-compra");
  await expect(
    page.getByRole("heading", { name: "Processos de compra", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Cadastrar processo" }).click();
  await expect(
    page.getByRole("button", { name: "Adicionar nota fiscal" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Adicionar nota fiscal" }).click();
  await expect(page.getByLabel("Fornecedor")).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
  for (const rota of ["/especies", "/naturezas", "/comissoes"]) {
    await page.goto(rota);
    await expect(page.getByRole("link", { name: /^Cadastrar/ })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Editar", exact: true }),
    ).toHaveCount(0);
  }
  for (const rota of ["/responsaveis", "/fornecedores"]) {
    await page.goto(rota);

    const conteudo = page.getByRole("main");

    await expect(
      conteudo.getByRole("link", {
        name: /^Cadastrar (responsável|fornecedor)$/,
      }),
    ).toHaveCount(0);

    await expect(
      conteudo.getByRole("link", { name: "Editar", exact: true }),
    ).toHaveCount(0);
  }
  await page.goto("/setores");
  await expect(
    page.getByRole("heading", { name: "Setores", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Cadastrar setor" })).toHaveCount(
    0,
  );
  await page.goto("/setores/novo");
  await expect(
    page.getByRole("heading", { name: "Acesso não permitido" }),
  ).toBeVisible();
  for (const rota of [
    "/fornecedores/novo",
    "/fornecedores/7041c62b-5f83-432c-a178-889977d839b1/editar",
    "/responsaveis/novo",
    "/responsaveis/7041c62b-5f83-432c-a178-889977d839b1/editar",
    "/setores/7041c62b-5f83-432c-a178-889977d839b1/editar",
    "/naturezas/novo",
    "/naturezas/7041c62b-5f83-432c-a178-889977d839b1/editar",
    "/especies/novo",
    "/especies/7041c62b-5f83-432c-a178-889977d839b1/editar",
    "/comissoes/novo",
    "/comissoes/7041c62b-5f83-432c-a178-889977d839b1/editar",
  ]) {
    await page.goto(rota);
    await expect(
      page.getByRole("heading", { name: "Acesso não permitido" }),
    ).toBeVisible();
  }
});
test("falha da API aparece como erro e não como lista vazia", async ({
  page,
}) => {
  await sessao(page);
  await page.context().addCookies([
    {
      name: "sipat_cadastros_scenario",
      value: "error",
      url: "http://localhost:3100",
    },
  ]);
  await page.goto("/naturezas");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Consulta temporariamente indisponível.",
  );
  await expect(page.getByText("Nenhum registro encontrado.")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Tentar novamente" }),
  ).toBeVisible();
});
