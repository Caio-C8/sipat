import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { test, expect } from "./support/test";
import fixtures from "./support/web-domain-fixtures.json";

async function autenticar(page: Page, baseURL?: string) {
  if (!baseURL) throw new Error("baseURL necessária");
  await page.context().addCookies([
    {
      name: "sipat_session",
      value: "director",
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
  test("consulta lista e detalhe com navegação acessível", async ({
    page,
    baseURL,
  }) => {
    await autenticar(page, baseURL);
    await page.goto("/manutencoes");
    await expect(page).toHaveTitle("Manutenções | SIPAT");
    await expect(page.getByText("MAN-2026-001")).toBeVisible();
    await page.getByRole("link", { name: "Abrir" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/manutencoes/${fixtures.manutencao.id}$`),
    );
    await expect(page.getByText("Notebook em manutenção")).toBeVisible();
    await expect(page.getByText("0 de 1 retornados")).toBeVisible();
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
    await page
      .getByRole("combobox", { name: "Comissão responsável" })
      .selectOption(fixtures.manutencao.comissaoId);
    await page.getByRole("button", { name: "Adicionar bens" }).click();
    await page.getByRole("checkbox", { name: /101/ }).check();
    await page.getByRole("button", { name: "Confirmar seleção" }).click();
    await page.getByRole("button", { name: "Configurar 101" }).click();
    await page
      .getByRole("textbox", { name: "Problema identificado" })
      .fill("Equipamento não inicializa.");
    await page.getByRole("button", { name: "Salvar atendimento" }).click();
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
            numeroRequisicao: "MAN-2026-001",
            dataEnvio: "2026-11-16",
            dataRetorno: null,
            status: "EM_ANDAMENTO",
            totalItens: 1,
            itensPendentes: 1,
            itensRetornados: 0,
            temPdfPedido: false,
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
            documentos: [],
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
