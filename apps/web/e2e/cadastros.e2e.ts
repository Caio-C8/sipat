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
test("administrador navega pelos cadastros integrados e distingue listas vazias", async ({
  page,
}) => {
  await sessao(page);
  for (const [rota, titulo] of [
    ["/cadastros", "Cadastros"],
    ["/cadastros/especies", "Cadastrar espécie"],
    ["/cadastros/naturezas", "Cadastrar natureza"],
    ["/cadastros/comissoes", "Cadastrar comissão"],
    ["/cadastros/responsaveis", "Cadastrar responsável"],
    ["/cadastros/fornecedores", "Cadastrar fornecedor"],
  ] as const) {
    await page.goto(rota);
    await expect(
      page.getByRole("heading", { name: titulo, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Nenhum registro encontrado.")).toBeVisible();
    await expect(
      page.getByText(/Prévia visual|sem gravação|de exemplo/),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: /^Salvar (processo|espécie|natureza|comissão|responsável|fornecedor)$/,
      }),
    ).toBeEnabled();
  }
});
test("administrador consulta setores reais e abre formulário habilitado", async ({
  page,
}) => {
  await sessao(page);
  await page.goto("/cadastros/setores");
  await page.getByRole("textbox", { name: "Nome do setor" }).fill("Gabinete");
  await page.getByRole("button", { name: "Consultar", exact: true }).click();
  await expect(page).toHaveURL(/busca=Gabinete/);
  await expect(page.getByText("Nenhum setor encontrado.")).toBeVisible();
  await page.getByRole("link", { name: "Cadastrar setor" }).click();
  await expect(
    page.getByRole("heading", { name: "Cadastrar setor", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Salvar setor" }),
  ).toBeEnabled();
});
test("administrador filtra fornecedores por situação na URL", async ({
  page,
}) => {
  await sessao(page);
  await page.goto("/cadastros/fornecedores");
  await page
    .getByRole("combobox", { name: "Situação" })
    .selectOption("inativos");
  await page.getByRole("button", { name: "Consultar", exact: true }).click();
  await expect(page).toHaveURL(/situacao=inativos/);
  await expect(page.getByText("Nenhum registro encontrado.")).toBeVisible();
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
  await page.goto("/cadastros/fornecedores");
  await page.getByLabel("Razão social *").fill("Fornecedor E2E");
  await page.getByLabel("CNPJ").fill("11.444.777/0001-61");
  await page.getByRole("button", { name: "Salvar fornecedor" }).click();
  await expect(page).toHaveURL(/id=7041c62b-5f83-432c-a178-889977d839b1/);
  await expect(
    page.getByRole("heading", { name: "Editar fornecedor" }),
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
    page.getByRole("button", { name: "Salvar fornecedor" }),
  ).toBeEnabled();
  await expect(page.getByLabel("Nome fantasia")).toHaveValue(
    "Fornecedor atualizado",
  );
  await page.getByRole("button", { name: "Inativar cadastro" }).click();
  await page.getByRole("button", { name: "Confirmar situação" }).click();
  await expect(page.getByText("Situação atual:")).toContainText("Inativo");
  await page.goto("/cadastros/fornecedores");
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
test("diretor cria processo sem notas novas e não acessa cadastros administrativos", async ({
  page,
}) => {
  await sessao(page, "director");
  await page.goto("/cadastros");
  await expect(
    page.getByRole("heading", { name: "Cadastros", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Você pode cadastrar o processo sem notas.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Adicionar nota fiscal" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Fornecedores", exact: true }),
  ).toHaveCount(0);
  for (const rota of [
    "/cadastros/especies",
    "/cadastros/naturezas",
    "/cadastros/comissoes",
    "/cadastros/responsaveis",
    "/cadastros/setores",
    "/cadastros/setores/novo",
    "/cadastros/fornecedores",
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
  await page.goto("/cadastros/naturezas");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Consulta temporariamente indisponível.",
  );
  await expect(page.getByText("Nenhum registro encontrado.")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Tentar novamente" }),
  ).toBeVisible();
});
