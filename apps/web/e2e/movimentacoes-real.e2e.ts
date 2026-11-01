import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
type Fixture = {
  cookieDiretor: string;
  cookieAdmin: string;
  comissaoId: string;
  setores: { id: string; nome: string }[];
  bens: { id: string; numeroPatrimonio: string }[];
};
const real = Boolean(process.env.MOVIMENTACOES_INTEGRATION_DATABASE_URL);
test.describe("Web → API → PostgreSQL isolado", () => {
  test.skip(
    !real,
    "Exige o banco isolado e playwright.movimentacoes-real.config.ts.",
  );
  test.describe.configure({ mode: "serial" });
  let f: Fixture;
  test.beforeAll(() => {
    f = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "test-results/movimentacoes-real-fixture.json",
        ),
        "utf8",
      ),
    );
  });
  async function autenticar(page: Page, admin = false) {
    const token = (admin ? f.cookieAdmin : f.cookieDiretor).split("=")[1]!;
    await page.context().addCookies([
      {
        name: "sipat_session",
        value: token,
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
  }
  async function selecionar(page: Page, numeros: number[], destino = 1) {
    await page.goto("/movimentacoes/nova");
    for (const numero of numeros)
      await page
        .getByRole("checkbox", {
          name: `Selecionar patrimônio ${numero}`,
          exact: true,
        })
        .check();
    await page
      .getByRole("button", { name: "Definir destinos", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Comissão vigente", exact: true })
      .selectOption(f.comissaoId);
    await page
      .getByLabel("Motivo da movimentação")
      .fill("Transferência de integração real");
    await page
      .getByRole("combobox", { name: "Destino para todos", exact: true })
      .selectOption(f.setores[destino]!.id);
    await page
      .getByRole("button", { name: "Aplicar a todos", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Revisar movimentação", exact: true })
      .click();
  }
  test("diretor confirma, consulta detalhe e lista usando banco real", async ({
    page,
  }) => {
    await autenticar(page);
    await selecionar(page, [1]);
    await page
      .getByRole("button", { name: "Confirmar movimentação", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Movimentação confirmada" }),
    ).toBeVisible();
    await page
      .getByRole("link", {
        name: "Ver transferência do patrimônio 1",
        exact: true,
      })
      .click();
    await expect(
      page.getByText("Transferência de integração real"),
    ).toBeVisible();
    await page.getByRole("link", { name: "Voltar às movimentações" }).click();
    await expect(page.getByRole("table")).toContainText("Mesa de teste 1");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: "test-results/movimentacoes-real-consulta.png",
      fullPage: true,
    });
  });
  test("perda da resposta preserva a chave e informa o conflito sem duplicar", async ({
    page,
  }) => {
    await autenticar(page);
    await selecionar(page, [12]);
    let gravado: { dados: { id: string; dataTransferencia: string }[] } | null =
      null;
    await page.route(
      "**/api/backend/movimentacoes",
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        const resposta = await route.fetch();
        expect(resposta.status()).toBe(201);
        gravado = await resposta.json();
        await route.abort("connectionfailed");
      },
      { times: 1 },
    );
    await page
      .getByRole("button", { name: "Confirmar movimentação", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Resultado ainda não confirmado" }),
    ).toBeVisible();
    await page.reload();
    await page
      .getByRole("button", { name: "Recuperar confirmação", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({
        hasText:
          "Esta operação já havia sido concluída. Nenhuma nova alteração foi feita.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Consultar movimentações" }),
    ).toBeVisible();
    const original = gravado as unknown as {
      dados: { id: string; dataTransferencia: string }[];
    };
    const lista = await (
      await page.request.get(
        `/api/backend/movimentacoes?patrimonioId=${f.bens[11]!.id}`,
      )
    ).json();
    expect(lista.meta.total).toBe(1);
    expect(lista.dados[0].id).toBe(original.dados[0]!.id);
    expect(lista.dados[0].dataTransferencia).toBe(
      original.dados[0]!.dataTransferencia,
    );
  });
  test("dez bens são persistidos juntos e os controles indisponíveis permanecem bloqueados", async ({
    page,
  }) => {
    await autenticar(page);
    await selecionar(page, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    await page
      .getByRole("button", { name: "Confirmar movimentação", exact: true })
      .dblclick();
    await expect(
      page.getByRole("heading", { name: "Movimentação confirmada" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Ver transferência do patrimônio/ }),
    ).toHaveCount(10);
    const lista = await (
      await page.request.get("/api/backend/movimentacoes")
    ).json();
    expect(lista.meta.total).toBe(12);
    await page.goto("/movimentacoes/nova");
    await expect(
      page.getByRole("checkbox", {
        name: "Selecionar patrimônio 13",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      page.getByRole("checkbox", {
        name: "Selecionar patrimônio 14",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      page.getByRole("checkbox", {
        name: "Selecionar patrimônio 15",
        exact: true,
      }),
    ).toBeDisabled();
  });
  test("administrador consulta, não recebe criação e API recusa chamada direta", async ({
    page,
  }) => {
    await autenticar(page, true);
    await page.goto("/movimentacoes");
    await expect(page.getByRole("table")).toContainText("Mesa de teste");
    await expect(
      page.getByRole("link", { name: "Nova movimentação", exact: true }),
    ).toHaveCount(0);
    const resposta = await page.request.post("/api/backend/movimentacoes", {
      headers: { Origin: "http://localhost:3100", "X-SIPAT-CSRF": "1" },
      data: {},
    });
    expect(resposta.status()).toBe(403);
    await page.goto("/movimentacoes/nova");
    await expect(
      page.getByRole("heading", { name: "Acesso não permitido" }),
    ).toBeVisible();
  });
  test("inventário criado durante preenchimento impede todos e preserva motivo e destinos", async ({
    page,
  }) => {
    await autenticar(page);
    await selecionar(page, [2, 3], 2);
    const criar = await page.request.post("/api/backend/inventarios", {
      headers: { Origin: "http://localhost:3100", "X-SIPAT-CSRF": "1" },
      data: {
        chaveIdempotencia: randomUUID(),
        nome: "Inventário criado no intervalo",
        comissaoId: f.comissaoId,
      },
    });
    expect(criar.status()).toBe(201);
    await page
      .getByRole("button", { name: "Confirmar movimentação", exact: true })
      .click();
    await expect(page.getByLabel("Revise a confirmação")).toBeFocused();
    await expect(
      page.getByText(/conferência pendente ou em andamento/).first(),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Alterar destinos", exact: true })
      .click();
    await expect(page.getByLabel("Motivo da movimentação")).toHaveValue(
      "Transferência de integração real",
    );
    await expect(
      page.getByRole("combobox", {
        name: "Destino do patrimônio 2",
        exact: true,
      }),
    ).toHaveValue(f.setores[2]!.id);
    const lista = await (
      await page.request.get("/api/backend/movimentacoes")
    ).json();
    expect(lista.meta.total).toBe(12);
  });
});
