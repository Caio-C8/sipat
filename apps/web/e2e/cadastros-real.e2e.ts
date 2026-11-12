import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
type Fixture = {
  admin: { token: string };
  diretor: { token: string };
  fornecedorId: string;
};
const real = process.env.CADASTROS_INTEGRATION_DATABASE_URL;
const habilitado = Boolean(
  real &&
  new URL(real).hostname === "127.0.0.1" &&
  new URL(real).pathname === "/sipat_cadastros",
);
const tag = randomUUID().slice(0, 8);
const cnpjFornecedor = criarCnpjValido();
let processoId = "";
test.describe("cadastros Web → API → PostgreSQL isolado", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    !habilitado,
    "Exige banco sipat_cadastros isolado e fixture em test-results/cadastros-real-fixture.json.",
  );
  test("administrador grava e altera os sete cadastros, membros e PDFs", async ({
    page,
  }, info) => {
    test.setTimeout(180000);
    const fixture = JSON.parse(
      readFileSync(
        path.resolve("../../test-results/cadastros-real-fixture.json"),
        "utf8",
      ),
    ) as Fixture;
    await page.context().addCookies([
      {
        name: "sipat_session",
        value: fixture.admin.token,
        url: String(info.project.use.baseURL),
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/cadastros/naturezas");
    await page
      .getByLabel("Nome da natureza *", { exact: true })
      .fill("Natureza " + tag);
    await salvarCadastro(page, "Salvar natureza", "naturezas", "POST");
    await expect(page).toHaveURL(/id=/);
    const naturezaId = new URL(page.url()).searchParams.get("id")!;
    await expect(
      page.getByRole("heading", { name: "Editar natureza" }),
    ).toBeVisible();
    await page
      .getByLabel("Descrição", { exact: true })
      .fill("Descrição alterada " + tag);
    await salvarCadastro(page, "Salvar natureza", "naturezas", "PATCH");
    await expect(page.getByLabel("Descrição", { exact: true })).toHaveValue(
      "Descrição alterada " + tag,
    );
    await expect(
      page.getByRole("button", { name: /^Salvar (natureza|setor|processo)$/ }),
    ).toBeEnabled();
    await page.reload();
    await expect(page.getByLabel("Descrição", { exact: true })).toHaveValue(
      "Descrição alterada " + tag,
    );
    await page.goto("/cadastros/especies");
    await page
      .getByLabel("Nome da espécie *", { exact: true })
      .fill("Espécie " + tag);
    await page
      .getByRole("combobox", { name: "Natureza vinculada", exact: true })
      .selectOption(naturezaId);
    await salvarCadastro(page, "Salvar espécie", "especies", "POST");
    await expect(page).toHaveURL(/id=/);
    await expect(
      page.getByRole("heading", { name: "Editar espécie" }),
    ).toBeVisible();
    await page
      .getByLabel("Nome da espécie *", { exact: true })
      .fill("Espécie editada " + tag);
    await salvarCadastro(page, "Salvar espécie", "especies", "PATCH");
    await expect(
      page.getByRole("link", { name: new RegExp("Espécie editada " + tag) }),
    ).toBeVisible();
    const responsaveis: string[] = [];
    for (const numero of [1, 2]) {
      await page.goto("/cadastros/responsaveis");
      await page.getByLabel("Matrícula *", { exact: true }).fill(tag + numero);
      await page
        .getByLabel("Nome completo *", { exact: true })
        .fill("Funcionário " + numero + " " + tag);
      await salvarCadastro(page, "Salvar responsável", "responsaveis", "POST");
      await expect(page).toHaveURL(/id=/);
      responsaveis.push(new URL(page.url()).searchParams.get("id")!);
    }
    await page
      .getByRole("button", { name: "Inativar cadastro", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar situação", exact: true })
      .click();
    await expect(
      page.getByText("Situação atual:", { exact: false }),
    ).toContainText("Inativo");
    await page
      .getByRole("button", { name: "Ativar cadastro", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar situação", exact: true })
      .click();
    await expect(
      page.getByText("Situação atual:", { exact: false }),
    ).toContainText("Ativo");
    await page.goto("/cadastros/fornecedores");
    await page
      .getByLabel("Razão social *", { exact: true })
      .fill("Fornecedor Web " + tag);
    await page.getByLabel("CNPJ", { exact: true }).fill(cnpjFornecedor);
    await salvarCadastro(page, "Salvar fornecedor", "fornecedores", "POST");
    await expect(page).toHaveURL(/id=/);
    await page
      .getByLabel("Nome fantasia", { exact: true })
      .fill("Fantasia " + tag);
    await salvarCadastro(page, "Salvar fornecedor", "fornecedores", "PATCH");
    await expect(
      page.getByRole("button", { name: "Salvar fornecedor", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("link", { name: new RegExp("Fornecedor Web " + tag) }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Inativar cadastro", exact: true })
      .click();
    const inativada = page.waitForResponse(
      (r) =>
        r.request().method() === "PATCH" &&
        new URL(r.url()).pathname.endsWith("/situacao"),
    );
    await page
      .getByRole("button", { name: "Confirmar situação", exact: true })
      .click();
    expect((await inativada).status()).toBe(200);
    await expect(
      page.getByText("Situação atual:", { exact: false }),
    ).toContainText("Inativo");
    await page.goto("/cadastros/fornecedores");
    await page
      .getByRole("combobox", { name: "Situação" })
      .selectOption("inativos");
    await page.getByRole("button", { name: "Consultar", exact: true }).click();
    await expect(page).toHaveURL(/situacao=inativos/);
    await expect(
      page.getByRole("link", { name: new RegExp("Fornecedor Web " + tag) }),
    ).toBeVisible();
    await page.goto("/cadastros/fornecedores");
    await page
      .getByLabel("Razão social *", { exact: true })
      .fill("Fornecedor duplicado " + tag);
    await page.getByLabel("CNPJ", { exact: true }).fill(cnpjFornecedor);
    const conflitoCnpj = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        new URL(r.url()).pathname.endsWith("/api/backend/fornecedores"),
    );
    await page
      .getByRole("button", { name: "Salvar fornecedor", exact: true })
      .click();
    expect((await conflitoCnpj).status()).toBe(409);
    await expect(
      page.getByRole("form", { name: "Novo fornecedor" }).getByRole("alert"),
    ).toContainText("Já existe um fornecedor");
    await page.goto("/cadastros/comissoes");
    await page
      .getByLabel("Nome da comissão *", { exact: true })
      .fill("Comissão " + tag);
    await page
      .getByLabel("Início da vigência *", { exact: true })
      .fill("2026-01-01");
    await page
      .getByLabel("Fim da vigência *", { exact: true })
      .fill("2027-12-31");
    await page
      .getByRole("combobox", { name: "Funcionário", exact: true })
      .selectOption(responsaveis[0]!);
    await page
      .getByRole("combobox", { name: "Função na comissão", exact: true })
      .selectOption("PRESIDENTE");
    await page
      .getByRole("button", { name: "Adicionar funcionário", exact: true })
      .click();
    await salvarCadastro(page, "Salvar comissão", "comissoes", "POST");
    await expect(page).toHaveURL(/id=/);
    await expect(
      page.getByRole("heading", { name: "Editar comissão" }),
    ).toBeVisible();
    await page
      .getByLabel("Nome da comissão *", { exact: true })
      .fill("Comissão editada " + tag);
    await salvarCadastro(page, "Salvar comissão", "comissoes", "PATCH");
    await expect(
      page.getByRole("link", { name: new RegExp("Comissão editada " + tag) }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Funcionário", exact: true })
      .selectOption(responsaveis[1]!);
    await page
      .getByRole("button", { name: "Adicionar funcionário", exact: true })
      .click();
    await expect(
      page.getByRole("combobox", {
        name: "Papel de Funcionário 2 " + tag,
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("combobox", {
        name: "Papel de Funcionário 1 " + tag,
        exact: true,
      })
      .selectOption("MEMBRO");
    await expect(
      page.getByRole("combobox", {
        name: "Papel de Funcionário 1 " + tag,
        exact: true,
      }),
    ).toHaveValue("MEMBRO");
    await page
      .getByRole("button", {
        name: "Remover Funcionário 2 " + tag,
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Confirmar remoção", exact: true })
      .click();
    await expect(
      page.getByRole("combobox", {
        name: "Papel de Funcionário 2 " + tag,
        exact: true,
      }),
    ).toHaveCount(0);
    await page.goto("/cadastros/setores/novo");
    await page
      .getByLabel("Nome do setor *", { exact: true })
      .fill("Setor " + tag);
    await page.getByLabel("Sala", { exact: true }).fill("101");
    await page
      .getByRole("combobox", { name: "Responsável", exact: true })
      .selectOption(responsaveis[0]!);
    await salvarCadastro(page, "Salvar setor", "setores", "POST");
    await expect(page).toHaveURL(/setores\/[0-9a-f-]+\?salvo=1/);
    await page.getByLabel("Sala", { exact: true }).fill("102");
    await salvarCadastro(page, "Salvar setor", "setores", "PATCH");
    await page.reload();
    await expect(page.getByLabel("Sala", { exact: true })).toHaveValue("102");
    await page
      .getByRole("button", { name: "Inativar cadastro", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmar situação", exact: true })
      .click();
    await expect(
      page.getByText("Situação atual:", { exact: false }),
    ).toContainText("Inativo");
    await page.goto("/cadastros");
    await page.getByLabel("Número do processo", { exact: true }).fill(tag);
    await page.getByLabel("Ano do processo", { exact: true }).fill("2026");
    await page
      .getByLabel("Valor total (R$)", { exact: true })
      .fill("1250,1234567");
    await page
      .getByRole("button", { name: "Adicionar nota fiscal", exact: true })
      .click();
    await page
      .getByLabel("Número da nota fiscal *", { exact: true })
      .fill("NF-" + tag);
    await page.getByLabel("Ano da nota fiscal *", { exact: true }).fill("2026");
    await page
      .getByLabel("Data de emissão *", { exact: true })
      .fill("2026-11-02");
    await page
      .getByRole("combobox", { name: "Fornecedor", exact: true })
      .selectOption(fixture.fornecedorId);
    const pdf = {
      name: "nota.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(
        "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF",
      ),
    };
    await page.getByLabel("PDF da nota 1", { exact: true }).setInputFiles(pdf);
    await salvarCadastro(page, "Salvar processo", "processos-compra", "POST");
    await expect(page).toHaveURL(/id=/);
    processoId = new URL(page.url()).searchParams.get("id")!;
    await expect(
      page.getByRole("heading", { name: "Editar processo de compra" }),
    ).toBeVisible();
    await page.goto("/cadastros/fornecedores");
    await expect(
      page.getByRole("heading", { name: "Acesso não permitido" }),
    ).toBeVisible();
    const link = page.getByRole("link", {
      name: "Abrir PDF da nota NF-" + tag,
      exact: true,
    });
    await expect(link).toBeVisible();
    const download = await page.request.get((await link.getAttribute("href"))!);
    expect(download.status()).toBe(200);
    expect((await download.body()).subarray(0, 5).toString()).toBe("%PDF-");
    await page
      .getByLabel("Substituir PDF da nota NF-" + tag, { exact: true })
      .setInputFiles({ ...pdf, name: "nota-revisada.pdf" });
    await expect(
      page.getByRole("status").filter({ hasText: "Anexo atualizado." }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Remover PDF da nota NF-" + tag,
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Confirmar remoção do PDF", exact: true })
      .click();
    await expect(link).toHaveCount(0);
    await page
      .getByRole("button", { name: "Editar nota NF-" + tag, exact: true })
      .click();
    await page
      .getByLabel("Número da nota fiscal *", { exact: true })
      .fill("NF-editada-" + tag);
    await salvarCadastro(page, "Salvar nota fiscal", "notas-fiscais", "PATCH");
    await expect(
      page.getByText("NF-editada-" + tag + "/2026", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Adicionar nota fiscal", exact: true })
      .click();
    await page
      .getByLabel("Número da nota fiscal *", { exact: true })
      .fill("NF-nova-" + tag);
    await page.getByLabel("Ano da nota fiscal *", { exact: true }).fill("2026");
    await page
      .getByLabel("Data de emissão *", { exact: true })
      .fill("2026-11-02");
    await page
      .getByRole("combobox", { name: "Fornecedor", exact: true })
      .selectOption(fixture.fornecedorId);
    await salvarCadastro(page, "Salvar nota fiscal", "notas-fiscais", "POST");
    await expect(
      page.getByText("NF-nova-" + tag + "/2026", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Observação", { exact: true })
      .fill("Processo alterado " + tag);
    await salvarCadastro(page, "Salvar processo", "processos-compra", "PATCH");
    await page.reload();
    await expect(page.getByLabel("Observação", { exact: true })).toHaveValue(
      "Processo alterado " + tag,
    );
    expect(
      (await new AxeBuilder({ page }).include("main").analyze()).violations,
    ).toEqual([]);
    for (const width of [390, 900, 1536]) {
      await page.setViewportSize({ width, height: 1000 });
      const excesso = await page.evaluate(() =>
        Array.from(document.querySelectorAll("main *"))
          .filter(
            (e) => e.getBoundingClientRect().right > window.innerWidth + 1,
          )
          .map((e) => ({
            tag: e.tagName,
            classe: e.className,
            right: e.getBoundingClientRect().right,
            width: e.getBoundingClientRect().width,
          }))
          .slice(-12),
      );
      expect(excesso).toEqual([]);
    }
  });
  test("diretor consulta notas, cadastra processo sem notas e tem gestão administrativa negada", async ({
    page,
  }, info) => {
    const fixture = JSON.parse(
      readFileSync(
        path.resolve("../../test-results/cadastros-real-fixture.json"),
        "utf8",
      ),
    ) as Fixture;
    await page.context().addCookies([
      {
        name: "sipat_session",
        value: fixture.diretor.token,
        url: String(info.project.use.baseURL),
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/cadastros?id=" + processoId);
    await expect(
      page.getByRole("heading", { name: "Notas fiscais vinculadas" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Adicionar nota fiscal", exact: true }),
    ).toHaveCount(0);
    await page.goto("/cadastros");
    await page
      .getByLabel("Número do processo", { exact: true })
      .fill("Diretor-" + tag);
    await salvarCadastro(page, "Salvar processo", "processos-compra", "POST");
    await expect(page).toHaveURL(/id=/);
    await expect(
      page.getByText("Nenhuma nota fiscal vinculada.", { exact: true }),
    ).toBeVisible();
    await page.goto("/cadastros/naturezas");
    await expect(
      page.getByRole("heading", { name: "Acesso não permitido" }),
    ).toBeVisible();
    await page.goto("/cadastros/setores/novo");
    await expect(
      page.getByRole("heading", { name: "Acesso não permitido" }),
    ).toBeVisible();
  });
});

async function salvarCadastro(
  page: import("@playwright/test").Page,
  rotulo: string,
  endpoint: string,
  method: "POST" | "PATCH",
) {
  const concluida = page.waitForResponse(
    (r) =>
      r.request().method() === method &&
      new URL(r.url()).pathname.startsWith("/api/backend/" + endpoint),
  );
  await page.getByRole("button", { name: rotulo, exact: true }).click();
  expect((await concluida).status()).toBe(method === "POST" ? 201 : 200);
}

function criarCnpjValido() {
  const base = randomUUID().replace(/\D/g, "").padEnd(12, "1").slice(0, 12);
  const digito = (valor: string) => {
    let peso = 2;
    let soma = 0;
    for (let indice = valor.length - 1; indice >= 0; indice -= 1) {
      soma += Number(valor[indice]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const primeiro = digito(base);
  return `${base}${primeiro}${digito(`${base}${primeiro}`)}`;
}
