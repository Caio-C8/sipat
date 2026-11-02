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
        name: /^Salvar (processo|espécie|natureza|comissão|responsável)$/,
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
  for (const rota of [
    "/cadastros/especies",
    "/cadastros/naturezas",
    "/cadastros/comissoes",
    "/cadastros/responsaveis",
    "/cadastros/setores",
    "/cadastros/setores/novo",
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
