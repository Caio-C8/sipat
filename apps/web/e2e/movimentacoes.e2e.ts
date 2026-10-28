import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./support/test";
import type { ApiMock } from "./support/api-mock";
import fixture from "./support/movimentacoes-fixtures.json";
const paginada = (
  dados: unknown[],
  total = dados.length,
  pagina = 1,
  limite = 20,
) => ({
  status: 200,
  sucesso: true,
  mensagem: "Consulta realizada.",
  dados,
  meta: {
    total,
    pagina,
    limite,
    ultimaPagina: Math.max(1, Math.ceil(total / limite)),
  },
});
async function sessao(
  page: Page,
  baseURL: string | undefined,
  value = "director",
) {
  if (!baseURL) throw new Error("baseURL necessária");
  await page.context().addCookies([
    {
      name: "sipat_session",
      value,
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
}
function auxiliares(api: ApiMock, contexto = "REGISTRO") {
  api.expectGet("/movimentacoes/opcoes/setores", ({ url }) => {
    expect(url.searchParams.get("contexto")).toBe(contexto);
    return {
      body: paginada(
        fixture.setores.filter((s) => contexto === "FILTRO" || s.ativo),
      ),
    };
  });
  api.expectGet("/movimentacoes/opcoes/comissoes", ({ url }) => {
    expect(url.searchParams.get("contexto")).toBe(contexto);
    return {
      body: paginada(
        fixture.comissoes.filter((_, i) => contexto === "FILTRO" || i === 0),
      ),
    };
  });
}
async function preencher(page: Page, api: ApiMock, quantidade = 1) {
  auxiliares(api);
  api.expectGet("/patrimonios", () => ({ body: paginada(fixture.bens) }));
  await page.goto("/movimentacoes/nova");
  for (let i = 1; i <= quantidade; i++)
    await page
      .getByRole("checkbox", {
        name: `Selecionar patrimônio ${i}`,
        exact: true,
      })
      .check();
  await page
    .getByRole("button", { name: "Definir destinos", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Comissão vigente", exact: true })
    .selectOption(fixture.comissoes[0]!.id);
  await page.getByLabel("Motivo da movimentação").fill("Mudança de sala");
  await page
    .getByRole("combobox", { name: "Destino para todos", exact: true })
    .selectOption(fixture.setores[1]!.id);
  await page
    .getByRole("button", { name: "Aplicar a todos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Revisar movimentação", exact: true })
    .click();
}
test.describe("Movimentações integradas — mocks estritos", () => {
  test("consulta para ambos os perfis, filtros históricos e detalhe de correção nulo", async ({
    page,
    baseURL,
    apiMock,
  }) => {
    await sessao(page, baseURL, "active");
    auxiliares(apiMock, "FILTRO");
    await page.goto("/movimentacoes");
    await expect(page).toHaveTitle("Movimentações | SIPAT");
    await expect(
      page.getByRole("link", { name: "Nova movimentação", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("combobox", { name: "Setor de origem", exact: true }),
    ).toContainText("Arquivo histórico (inativo)");
    await expect(
      page.getByRole("combobox", { name: "Comissão", exact: true }),
    ).toContainText("Comissão histórica");
    await expect(page.getByRole("table")).toContainText(
      "Correção de inventário",
    );
    await page
      .getByRole("combobox", { name: "Comissão", exact: true })
      .selectOption(fixture.comissoes[0]!.id);
    await page.getByLabel("De", { exact: true }).fill("2026-10-28");
    await page.getByLabel("Até", { exact: true }).fill("2026-10-28");
    auxiliares(apiMock, "FILTRO");
    await page
      .getByRole("button", { name: "Aplicar filtros", exact: true })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`comissaoId=${fixture.comissoes[0]!.id}`),
    );
    expect(new URL(page.url()).searchParams.get("dataInicio")).toBe(
      "2026-10-28",
    );
    expect(new URL(page.url()).searchParams.get("dataFim")).toBe("2026-10-28");
    await page
      .getByRole("link", { name: "Detalhes da transferência do patrimônio 1" })
      .last()
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Detalhes da movimentação",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Motivo não informado neste registro histórico."),
    ).toBeVisible();
    await expect(
      page.getByText(
        `Inventário: ${fixture.correcao.correcaoInventario.inventarioId}`,
      ),
    ).toBeVisible();
    await page.goto("/movimentacoes/nova");
    await expect(
      page.getByRole("heading", { name: "Acesso não permitido" }),
    ).toBeVisible();
  });
  test("dez únicos, impedimentos visuais, comissão/motivo e etapas preservadas", async ({
    page,
    baseURL,
    apiMock,
  }) => {
    await sessao(page, baseURL);
    auxiliares(apiMock);
    apiMock.expectGet("/patrimonios", () => ({ body: paginada(fixture.bens) }));
    await page.goto("/movimentacoes/nova");
    for (const i of [13, 14, 15])
      await expect(
        page.getByRole("checkbox", {
          name: `Selecionar patrimônio ${i}`,
          exact: true,
        }),
      ).toBeDisabled();
    for (let i = 1; i <= 10; i++)
      await page
        .getByRole("checkbox", {
          name: `Selecionar patrimônio ${i}`,
          exact: true,
        })
        .check();
    await expect(
      page.getByRole("checkbox", {
        name: "Selecionar patrimônio 11",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(page.getByText("10 de 10 selecionados")).toBeVisible();
    await page
      .getByRole("button", { name: "Definir destinos", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Comissão vigente", exact: true })
      .selectOption(fixture.comissoes[0]!.id);
    await page.getByLabel("Motivo da movimentação").fill("Mudança de sala");
    await page
      .getByRole("combobox", { name: "Destino para todos", exact: true })
      .selectOption(fixture.setores[1]!.id);
    await page
      .getByRole("button", { name: "Aplicar a todos", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Destino do patrimônio 2", exact: true })
      .selectOption(fixture.setores[2]!.id);
    await page
      .getByRole("button", { name: "Voltar aos bens", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Definir destinos", exact: true })
      .click();
    await expect(page.getByLabel("Motivo da movimentação")).toHaveValue(
      "Mudança de sala",
    );
    await expect(
      page.getByRole("combobox", {
        name: "Destino do patrimônio 2",
        exact: true,
      }),
    ).toHaveValue(fixture.setores[2]!.id);
    await page
      .getByRole("button", { name: "Revisar movimentação", exact: true })
      .click();
    apiMock.expectPost("/movimentacoes", async ({ body, headers }) => {
      const pedido = body as { itens: unknown[] };
      expect(pedido.itens).toHaveLength(10);
      expect(headers["x-sipat-csrf"]).toBe("1");
      expect(body).not.toHaveProperty("dataTransferencia");
      await new Promise((r) => setTimeout(r, 150));
      return {
        status: 201,
        body: {
          status: 201,
          sucesso: true,
          mensagem: "Confirmadas.",
          dados: fixture.bens.slice(0, 10).map((b, i) => ({
            ...fixture.detalhe,
            id: `00000000-0000-4000-8000-${String(100 + i).padStart(12, "0")}`,
            patrimonio: {
              id: b.id,
              numeroPatrimonio: b.numeroPatrimonio,
              tipoNumeroPatrimonial: b.tipoNumeroPatrimonial,
              descricao: b.descricao,
            },
          })),
        },
      };
    });
    await page
      .getByRole("button", { name: "Confirmar movimentação", exact: true })
      .dblclick();
    await expect(
      page.getByRole("heading", { name: "Movimentação confirmada" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Ver transferência do patrimônio/ }),
    ).toHaveCount(10);
  });
  test("seleção permanece entre páginas e pesquisas sem repetir patrimônio", async ({
    page,
    baseURL,
    apiMock,
  }) => {
    await sessao(page, baseURL);
    auxiliares(apiMock);
    apiMock.expectGet("/patrimonios", () => ({
      body: paginada([fixture.bens[0]], 21),
    }));
    await page.goto("/movimentacoes/nova");
    await page
      .getByRole("checkbox", { name: "Selecionar patrimônio 1", exact: true })
      .check();
    apiMock.expectGet("/patrimonios", ({ url }) => {
      expect(url.searchParams.get("pagina")).toBe("2");
      return { body: paginada([fixture.bens[1]], 21, 2) };
    });
    await page.getByRole("button", { name: "Mais bens" }).click();
    await page
      .getByRole("checkbox", { name: "Selecionar patrimônio 2", exact: true })
      .check();
    apiMock.expectGet("/patrimonios", ({ url }) => {
      expect(url.searchParams.get("busca")).toBe("Mesa");
      return { body: paginada([fixture.bens[0]]) };
    });
    await page.getByLabel("Buscar patrimônios").fill("Mesa");
    await page.getByRole("button", { name: "Pesquisar bens" }).click();
    await expect(
      page.getByRole("checkbox", {
        name: "Selecionar patrimônio 1",
        exact: true,
      }),
    ).toBeChecked();
    await expect(page.getByText("2 de 10 selecionados")).toBeVisible();
  });
  test("erro por item preserva formulário e exige revisão explícita da nova origem", async ({
    page,
    baseURL,
    apiMock,
  }) => {
    await sessao(page, baseURL);
    await preencher(page, apiMock);
    apiMock.expectPost("/movimentacoes", () => ({
      status: 409,
      body: {
        status: 409,
        sucesso: false,
        codigo: "MOVIMENTACAO_IMPEDIDA",
        mensagem: "Revise os itens.",
        erros: [
          {
            campo: "itens.0.setorOrigemEsperadoId",
            codigo: "ORIGEM_ALTERADA",
            mensagem: "O setor mudou. Atualize e revise.",
          },
        ],
        requisicaoId: "mov-conflito",
      },
    }));
    await page
      .getByRole("button", { name: "Confirmar movimentação", exact: true })
      .click();
    await expect(page.getByLabel("Revise a confirmação")).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Confirmar movimentação", exact: true }),
    ).toBeDisabled();
    apiMock.expectGet(`/patrimonios/${fixture.bens[0]!.id}`, () => ({
      body: {
        status: 200,
        sucesso: true,
        mensagem: "Atualizado",
        dados: {
          ...fixture.bens[0],
          setorAtual: {
            ...fixture.bens[0]!.setorAtual,
            id: fixture.setores[2]!.id,
            nome: "Secretaria",
          },
          dataTombamento: "2026-01-01",
          tipoIncorporacao: "AQUISICAO",
          valorIncorporacao: "100",
          processoCompra: null,
          situacaoContabil: {
            valorBrutoAtual: "100",
            depreciacaoAcumuladaAtual: "0",
          },
          parametroDepreciacaoAtual: null,
          createdAt: "2026-10-28T12:00:00.000Z",
          updatedAt: null,
        },
      },
    }));
    await page
      .getByRole("button", {
        name: "Atualizar e revisar origem do patrimônio 1",
      })
      .click();
    await expect(
      page.getByText(/Origem atualizada para Secretaria/),
    ).toBeVisible();
    await expect(page.getByLabel("Motivo da movimentação")).toHaveValue(
      "Mudança de sala",
    );
  });
  test("resultado desconhecido conserva payload/chave mesmo após recarregar", async ({
    page,
    baseURL,
    apiMock,
  }) => {
    await sessao(page, baseURL);
    await preencher(page, apiMock);
    let original: unknown;
    apiMock.expectPost("/movimentacoes", ({ body }) => {
      original = body;
      return {
        status: 503,
        body: {
          status: 503,
          sucesso: false,
          codigo: "SERVICO_INDISPONIVEL",
          mensagem: "Resposta indisponível.",
          erros: [],
          requisicaoId: "mov-503",
        },
      };
    });
    await page
      .getByRole("button", { name: "Confirmar movimentação", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Resultado ainda não confirmado" }),
    ).toBeVisible();
    apiMock.expectPost("/movimentacoes", ({ body }) => {
      expect(body).toEqual(original);
      return {
        status: 401,
        body: {
          status: 401,
          sucesso: false,
          codigo: "NAO_AUTENTICADO",
          mensagem: "Sessão expirada.",
          erros: [],
          requisicaoId: "mov-401",
        },
      };
    });
    await page
      .getByRole("button", { name: "Recuperar confirmação", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Resultado ainda não confirmado" }),
    ).toBeVisible();
    auxiliares(apiMock);
    apiMock.expectGet("/patrimonios", () => ({ body: paginada(fixture.bens) }));
    await page.reload();
    apiMock.expectPost("/movimentacoes", ({ body }) => {
      expect(body).toEqual(original);
      return {
        status: 201,
        body: {
          status: 201,
          sucesso: true,
          mensagem: "Recuperada",
          dados: [fixture.detalhe],
        },
      };
    });
    await page
      .getByRole("button", { name: "Recuperar confirmação", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Movimentação confirmada" }),
    ).toBeVisible();
  });
  test("erro de consulta é diferente de vazio, anônimo e primeiro acesso", async ({
    page,
    baseURL,
    apiMock,
  }) => {
    await sessao(page, baseURL);
    auxiliares(apiMock, "FILTRO");
    await page
      .context()
      .addCookies([
        { name: "sipat_movimentacao_scenario", value: "error", url: baseURL! },
      ]);
    await page.goto("/movimentacoes");
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Consulta temporariamente indisponível" }),
    ).toContainText("Consulta temporariamente indisponível");
    await expect(page.getByText(/Nenhuma movimentação encontrada/)).toHaveCount(
      0,
    );
    await page.context().clearCookies();
    await page.goto("/movimentacoes");
    await expect(page).toHaveURL(/\/login$/);
    await sessao(page, baseURL, "pending");
    await page.goto("/movimentacoes");
    await expect(page).toHaveURL(/\/redefinir-senha$/);
  });
  test("teclado, foco, axe, conteúdo longo e resoluções estreita/intermediária/ampla", async ({
    page,
    baseURL,
    apiMock,
  }) => {
    await sessao(page, baseURL);
    await preencher(page, apiMock);
    await expect(
      page.getByRole("heading", {
        name: "Etapa 3: Revisar e confirmar",
        exact: true,
      }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Alterar destinos" }).click();
    await page
      .getByLabel("Motivo da movimentação")
      .fill("Motivo longo ".repeat(120));
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [390, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1080 });
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations).toEqual([]);
      await page.screenshot({
        path: `test-results/movimentacoes-destinos-${width}.png`,
        fullPage: true,
      });
    }
    await page.locator("body").evaluate((el) => {
      el.style.zoom = "2";
    });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.getByLabel("Motivo da movimentação").focus();
    await page.keyboard.press("Tab");
  });
});
