import { expect, test } from "@playwright/test";

test("administrador navega pelos cadastros visuais", async ({ page }) => {
  await page.context().addCookies([
    {
      name: "sipat_session",
      value: "active",
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
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
    await expect(
      page.getByText("Dados de exemplo · sem gravação"),
    ).toBeVisible();
  }
});

test("administrador consulta e abre o cadastro visual de setores", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: "sipat_session",
      value: "active",
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  await page.goto("/cadastros/setores");
  await expect(
    page.getByRole("heading", { name: "Setores", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Nome, código ou sigla" })
    .fill("Gabinete 02");
  await page.getByRole("button", { name: "Consultar", exact: true }).click();
  await expect(page.getByText("1 setor de exemplo")).toBeVisible();
  await page.getByRole("link", { name: "Consultar Gabinete 02" }).click();
  await expect(
    page.getByRole("heading", { name: "Gabinete 02" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bens vinculados ao setor" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar aos setores" }).click();
  await page.getByRole("link", { name: "Cadastrar setor" }).click();
  await expect(
    page.getByRole("heading", { name: "Cadastrar setor" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Salvar setor" }),
  ).toBeDisabled();
});

test("diretor consulta processos sem acessar cadastros administrativos", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: "sipat_session",
      value: "director",
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  await page.goto("/cadastros");
  await expect(page.getByRole("heading", { name: "Cadastros" })).toBeVisible();
  await page.goto("/cadastros/especies");
  await expect(
    page.getByRole("heading", { name: "Acesso não permitido" }),
  ).toBeVisible();
  await page.goto("/cadastros/setores");
  await expect(
    page.getByRole("heading", { name: "Acesso não permitido" }),
  ).toBeVisible();
});
