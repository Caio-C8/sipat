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
      name: "sipat_emprestimos_scenario",
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
  meta: { total: dados.length, pagina: 1, limite: 20, ultimaPagina: 1 },
});

test.describe("Empréstimos", () => {
  test("consulta lista e detalhe sem depender do banco", async ({
    page,
    baseURL,
  }) => {
    await autenticar(page, baseURL);
    await page.goto("/emprestimos");
    await expect(page).toHaveTitle("Empréstimos | SIPAT");
    await expect(page.getByText("Instituição parceira")).toBeVisible();
    await page.getByRole("link", { name: "Abrir" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/emprestimos/${fixtures.emprestimo.id}`),
    );
    await expect(page.getByText("Projetor multimídia")).toBeVisible();
    await expect(page.getByText("1 de 1 pendente(s)")).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include("main").analyze()).violations,
    ).toEqual([]);
  });

  test("seleciona bem, revisa e confirma o empréstimo pela API simulada", async ({
    page,
    baseURL,
    apiMock,
  }) => {
    await autenticar(page, baseURL);
    const comissao = {
      id: fixtures.emprestimo.comissaoId,
      nome: "Comissão patrimonial vigente",
      dataVigenciaInicio: "2026-01-01",
      dataVigenciaFim: "2026-12-31",
    };
    const bem = {
      id: fixtures.emprestimo.patrimonioId,
      numeroPatrimonio: "201",
      descricao: "Projetor multimídia",
      setor: { id: "22222222-2222-4222-8222-222222222225", nome: "Plenário" },
      status: "ATIVO",
    };
    apiMock.expectGet(
      "/emprestimos/opcoes/comissoes",
      () => ({ body: paginada([comissao]) }),
      2,
    );
    await page.goto("/emprestimos/nova");
    await page.getByLabel("Destinatário").fill("Instituição parceira");
    await page.getByLabel("Finalidade").fill("Atividade institucional");
    await page
      .getByRole("combobox", { name: "Comissão vigente na data do empréstimo" })
      .selectOption(comissao.id);
    apiMock.expectGet("/emprestimos/opcoes/patrimonios", () => ({
      body: paginada([bem]),
    }));
    await page.getByRole("button", { name: "Alterar seleção" }).click();
    await page.getByRole("checkbox", { name: "Selecionar 201" }).check();
    await page.getByRole("button", { name: "Confirmar seleção (1)" }).click();
    await page.getByRole("button", { name: "Revisar empréstimo" }).click();
    await expect(
      page.getByRole("heading", { name: "Revisar empréstimo" }),
    ).toBeVisible();
    apiMock.expectPost("/emprestimos", ({ body, headers }) => {
      expect(headers["x-sipat-csrf"]).toBe("1");
      expect((body as { patrimonioIds: string[] }).patrimonioIds).toEqual([
        bem.id,
      ]);
      return {
        status: 201,
        body: {
          status: 201,
          sucesso: true,
          mensagem: "Empréstimo registrado.",
          dados: {
            id: fixtures.emprestimo.id,
            modoAgrupamento: "EM_GRUPO",
            destinatario: "Instituição parceira",
            dataEmprestimo: "2026-11-16T12:00:00.000Z",
            dataPrevistaDevolucao: "2026-11-16T12:00:00.000Z",
            total: 1,
            pendentes: 1,
            situacao: "EM_ANDAMENTO",
            emAtraso: false,
            createdAt: "2026-11-16T12:00:00.000Z",
            finalidade: "Atividade institucional",
            observacao: null,
            comissao: { id: comissao.id, nome: comissao.nome },
            registradoPor: {
              id: "dcebc286-aa55-4a36-9f2e-f8f885d2126c",
              nome: "João Diretor",
            },
            itens: [
              {
                id: fixtures.emprestimo.itemId,
                patrimonio: {
                  id: bem.id,
                  numeroPatrimonio: bem.numeroPatrimonio,
                  descricao: bem.descricao,
                },
                setorVinculo: bem.setor,
                pendente: true,
                devolucao: null,
              },
            ],
          },
        },
      };
    });
    await page.getByRole("button", { name: "Confirmar empréstimo" }).click();
    await expect(
      page.getByRole("heading", { name: "Empréstimo registrado" }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "Empréstimo registrado com sucesso",
    );
  });
});
