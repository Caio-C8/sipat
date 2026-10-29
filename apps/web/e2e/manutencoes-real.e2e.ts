import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type Fixture = {
  token: string;
  comissaoId: string;
  fornecedorId: string;
  bens: { id: string; numero: string }[];
};

const real = Boolean(process.env.MANUTENCOES_INTEGRATION_DATABASE_URL);
test.describe("manutenção Web → API → PostgreSQL descartável", () => {
  test.skip(
    !real,
    "Exige banco isolado e playwright.manutencoes-real.config.ts.",
  );

  test("cria pedido com dois itens, revê orçamento, anexa PDF e recebe parcialmente", async ({
    page,
  }) => {
    const fixture = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "test-results/manutencoes-real-fixture.json",
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
    await page.goto("/manutencoes/nova");
    await expect(
      page.getByRole("heading", { name: "Novo pedido de manutenção" }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Comissão vigente" })
      .selectOption(fixture.comissaoId);
    for (const bem of fixture.bens) {
      await page
        .getByRole("combobox", { name: "Patrimônio", exact: true })
        .selectOption(bem.id);
      await page
        .getByRole("button", { name: "Adicionar", exact: true })
        .click();
    }
    const primeiro = page.getByRole("group", {
      name: new RegExp(fixture.bens[0]!.numero),
    });
    const segundo = page.getByRole("group", {
      name: new RegExp(fixture.bens[1]!.numero),
    });
    await primeiro
      .getByRole("combobox", { name: "Fornecedor (opcional)" })
      .selectOption(fixture.fornecedorId);
    await primeiro
      .getByRole("textbox", { name: "Problema (opcional)" })
      .fill("Falha no equipamento");
    await segundo
      .getByRole("combobox", { name: "Tipo" })
      .selectOption("PREVENTIVA");
    await page.getByRole("button", { name: "Criar pedido" }).click();
    await page.waitForURL(/\/manutencoes\/[0-9a-f-]+$/);
    const pedidoId = page.url().split("/").at(-1)!;
    await expect(page.getByText("0 retornados e 2 pendentes")).toBeVisible();

    const item = page
      .locator('section[aria-labelledby^="item-"]')
      .filter({ hasText: fixture.bens[0]!.numero });
    await expect(
      item.getByRole("button", { name: "Confirmar retorno" }),
    ).toHaveCount(1);
    await item
      .getByRole("textbox", { name: "Descrição", exact: true })
      .fill("Peça nova");
    await item
      .getByRole("textbox", { name: "Valor", exact: true })
      .fill("20.00");
    await item.getByRole("button", { name: "Salvar orçamento" }).click();
    await expect(item.getByText(/Versão 1:/)).toBeVisible();
    await expect(
      item.getByRole("button", { name: "Confirmar retorno" }),
    ).toHaveCount(1);

    const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
    await page.getByLabel("Arquivo PDF (até 10 MiB)").first().setInputFiles({
      name: "pedido.pdf",
      mimeType: "application/pdf",
      buffer: pdf,
    });
    await page
      .getByRole("button", { name: "Enviar documento" })
      .first()
      .click();
    const linkPdf = page
      .getByRole("link", { name: /Documento de manutenção\.pdf/ })
      .first();
    await expect(linkPdf).toBeVisible();
    const respostaPdf = await page.request.get(
      (await linkPdf.getAttribute("href")) ?? "",
    );
    expect(respostaPdf.status()).toBe(200);
    expect(respostaPdf.headers()["content-type"]).toContain("application/pdf");
    await expect(
      item.getByRole("button", { name: "Confirmar retorno" }),
    ).toHaveCount(1);

    await item.getByRole("textbox", { name: "Valor realizado" }).fill("20.00");
    await item
      .getByRole("textbox", { name: "Serviço realizado" })
      .fill("Peça substituída");
    await item.getByRole("button", { name: "Confirmar retorno" }).click();
    await expect(page.getByText("1 retornados e 1 pendentes")).toBeVisible();
    await expect(item.getByText("Situação do bem: ATIVO")).toBeVisible();
    await expect(
      page
        .locator('section[aria-labelledby^="item-"]')
        .filter({ hasText: fixture.bens[1]!.numero })
        .getByText("Situação do bem: Em manutenção"),
    ).toBeVisible();

    await page.goto(`/manutencoes?busca=${fixture.bens[0]!.numero}`);
    await expect(page.getByRole("table")).toContainText(pedidoId);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "test-results/manutencoes-real-mobile.png",
      fullPage: true,
    });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
});
