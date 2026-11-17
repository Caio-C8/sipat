import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "./support/test";
import fixtures from "./support/web-domain-fixtures.json";

async function autenticar(
  page: Page,
  baseURL?: string,
  perfil: "active" | "director" = "director",
) {
  if (!baseURL) throw new Error("baseURL necessária");
  await page.context().addCookies([
    {
      name: "sipat_session",
      value: perfil,
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
    },
    {
      name: "sipat_manutencoes_scenario",
      value: "1",
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
}

const paginada = (dados: unknown[]) => ({
  status: 200,
  sucesso: true,
  mensagem: "Consulta concluída.",
  dados,
  meta: { total: dados.length, pagina: 1, limite: 50, ultimaPagina: 1 },
});

test.describe("Manutenções", () => {
  for (const perfil of ["active", "director"] as const) {
    test(`mantém consulta e operações visíveis para ${perfil === "active" ? "Administrador" : "Diretor"}`, async ({
      page,
      baseURL,
    }) => {
      await autenticar(page, baseURL, perfil);
      await page.goto(`/manutencoes/${fixtures.manutencao.id}`);
      await expect(
        page.getByRole("heading", { level: 1, name: "Pedido #1" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Orçamento/ }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /Retorno/ })).toBeVisible();
      const anexos = page.getByRole("button", { name: "Anexo", exact: true });
      await expect(anexos).toHaveCount(2);
      await expect(anexos.first()).toBeVisible();
    });
  }

  test("consulta lista e detalhe com navegação acessível", async ({
    page,
    baseURL,
  }) => {
    await autenticar(page, baseURL);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/manutencoes");
    await expect(page).toHaveTitle("Manutenções | SIPAT");
    const situacao = page.getByRole("combobox", {
      name: "Situação do pedido",
    });
    const caixaSituacao = await situacao.boundingBox();
    await situacao.click();
    const menuSituacao = page.locator('[data-slot="select-content"]');
    const opcaoSituacao = page.getByRole("option", { name: "Em andamento" });
    await expect(opcaoSituacao).toBeVisible();
    await menuSituacao.evaluate(async (elemento) => {
      await Promise.all(
        elemento
          .getAnimations()
          .map((animacao) => animacao.finished.catch(() => {})),
      );
    });
    const caixaMenu = await menuSituacao.boundingBox();
    expect(caixaSituacao).not.toBeNull();
    expect(caixaMenu).not.toBeNull();
    expect(caixaMenu!.y).toBeGreaterThanOrEqual(
      caixaSituacao!.y + caixaSituacao!.height,
    );
    await page.keyboard.press("Escape");
    await expect(page.getByText("Pedido #1")).toBeVisible();
    await page.getByRole("link", { name: "Abrir" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/manutencoes/${fixtures.manutencao.id}$`),
    );
    await expect(page.getByText("Notebook em manutenção")).toBeVisible();
    await expect(page.getByText("1 de 2 retornados")).toBeVisible();
    await expect(
      page.getByLabel("Novo PDF para substituição (até 10 MiB)"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Remover", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toContainText("o pedido");
    await page.getByRole("button", { name: "Cancelar" }).click();
    const detalhes = page.getByRole("button", { name: "Ver detalhes" });
    await detalhes.nth(0).click();
    await expect(page.getByText("Troca da placa principal.")).toBeVisible();
    await expect(page.getByText("Nenhum orçamento informado.")).toHaveCount(0);
    await detalhes.nth(1).click();
    await expect(
      page.getByText("Limpeza e substituição do rolete."),
    ).toBeVisible();
    await expect(page.getByText("Garantia de 90 dias")).toBeVisible();
    await expect(page.getByRole("button", { name: "Orçamento" })).toHaveCount(
      1,
    );
    expect(
      (await new AxeBuilder({ page }).include("main").analyze()).violations,
    ).toEqual([]);
  });

  test("monta e registra pedido usando somente a fronteira HTTP", async ({
    page,
    baseURL,
    apiMock,
  }) => {
    await autenticar(page, baseURL);
    apiMock.expectGet("/patrimonios", () => ({
      body: paginada([
        {
          id: fixtures.manutencao.patrimonioId,
          numeroPatrimonio: "101",
          tipoNumeroPatrimonial: "OFICIAL",
          descricao: "Notebook em manutenção",
          marca: null,
          modelo: null,
          numeroSerie: null,
          status: "ATIVO",
          depreciavel: true,
          situacaoContabil: {
            valorBrutoAtual: "5000.0000000",
            depreciacaoAcumuladaAtual: "500.0000000",
          },
          setorAtual: {
            id: "11111111-1111-4111-8111-111111111116",
            nome: "Tecnologia",
            responsavel: {
              id: "11111111-1111-4111-8111-111111111117",
              nome: "Responsável patrimonial",
            },
          },
          especie: {
            id: "11111111-1111-4111-8111-111111111118",
            nome: "Notebook",
            natureza: {
              id: "11111111-1111-4111-8111-111111111119",
              nome: "Equipamento",
            },
          },
        },
      ]),
    }));
    apiMock.expectGet("/manutencoes/opcoes/fornecedores", () => ({
      body: paginada([
        { id: fixtures.manutencao.fornecedorId, nome: "Oficina credenciada" },
      ]),
    }));
    apiMock.expectGet("/manutencoes/opcoes/comissoes", () => ({
      body: paginada([
        {
          id: fixtures.manutencao.comissaoId,
          nome: "Comissão patrimonial vigente",
          dataVigenciaInicio: "2026-01-01",
          dataVigenciaFim: "2026-12-31",
        },
      ]),
    }));
    await page.goto("/manutencoes/nova");
    await page.getByRole("combobox", { name: "Comissão responsável" }).click();
    await expect(
      page.getByRole("textbox", { name: "Buscar comissão" }),
    ).toBeVisible();
    await page
      .getByRole("option", { name: "Comissão patrimonial vigente" })
      .click();
    await page.getByRole("button", { name: "Adicionar bens" }).click();
    await page.getByRole("checkbox", { name: /101/ }).check();
    await expect(
      page.getByRole("button", { name: "Confirmar seleção" }),
    ).toBeInViewport();
    await page.getByRole("button", { name: "Confirmar seleção" }).click();
    await page.getByRole("button", { name: /101 · Notebook/ }).focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("textbox", { name: "Problema identificado" })
      .fill("Equipamento não inicializa.");
    await page.getByRole("textbox", { name: "Valor orçado (R$)" }).fill("1000");
    await page.getByRole("button", { name: "Criar pedido" }).click();
    await expect(page.locator("#item-0-dados")).toBeFocused();
    await expect(page.getByText("Revise os campos destacados")).toBeVisible();
    await page.getByLabel("Data do orçamento").fill("2026-11-16");
    await page
      .getByRole("textbox", { name: "Descrição do orçamento" })
      .fill("Diagnóstico e reparo inicial");
    expect(
      (await new AxeBuilder({ page }).include("main").analyze()).violations,
    ).toEqual([]);
    apiMock.expectPost("/manutencoes", ({ body, headers }) => {
      expect(headers["x-sipat-csrf"]).toBe("1");
      expect((body as { itens: unknown[] }).itens).toHaveLength(1);
      return {
        status: 201,
        body: {
          status: 201,
          sucesso: true,
          mensagem: "Pedido criado.",
          dados: {
            id: fixtures.manutencao.id,
            numeroPedido: "2",
            numeroRequisicao: "MAN-2026-001",
            dataEnvio: "2026-11-16",
            dataRetorno: null,
            status: "EM_ANDAMENTO",
            totalItens: 1,
            itensPendentes: 1,
            itensRetornados: 0,
            temAnexoObservacao: false,
            justificativa: null,
            comissao: {
              id: fixtures.manutencao.comissaoId,
              nome: "Comissão patrimonial vigente",
            },
            criadoPor: {
              id: "dcebc286-aa55-4a36-9f2e-f8f885d2126c",
              nome: "João Diretor",
            },
            criadoEm: "2026-11-16T12:00:00.000Z",
            itens: [],
            anexoObservacao: null,
          },
        },
      };
    });
    await page.getByRole("button", { name: "Criar pedido" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/manutencoes/${fixtures.manutencao.id}$`),
    );
  });
});
