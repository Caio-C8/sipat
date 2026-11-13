import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createDatabaseClient } from "../../../packages/database/src";

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
    const databaseUrl = process.env.MANUTENCOES_INTEGRATION_DATABASE_URL!;
    const db = createDatabaseClient(databaseUrl);
    try {
      const patrimonios = await db.patrimonio.findMany({
        select: { id: true, valorIncorporacao: true },
      });
      await Promise.all(
        patrimonios.map((bem) =>
          db.situacaoContabilPatrimonio.upsert({
            where: { patrimonioId: bem.id },
            create: {
              patrimonioId: bem.id,
              valorBrutoAtual: bem.valorIncorporacao,
              depreciacaoAcumuladaAtual: "0",
            },
            update: {},
          }),
        ),
      );
    } finally {
      await db.$disconnect();
    }
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
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(
      page.getByRole("heading", { name: "Novo pedido de manutenção" }),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/manutencoes-nova-vazia-1920.png",
      fullPage: true,
    });
    await page
      .getByRole("combobox", { name: "Comissão responsável" })
      .selectOption(fixture.comissaoId);
    const abrirSeletor = page.getByRole("button", { name: "Adicionar bens" });
    await abrirSeletor.click();
    await page.screenshot({
      path: "test-results/manutencoes-seletor-1920.png",
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "Adicionar bens ao pedido" }),
    ).toBeHidden();
    await expect(abrirSeletor).toBeFocused();
    await abrirSeletor.click();
    for (const bem of fixture.bens) {
      await page
        .getByRole("checkbox", { name: new RegExp(bem.numero) })
        .check();
    }
    await page.getByRole("button", { name: "Confirmar seleção" }).click();
    await page
      .getByRole("button", { name: `Configurar ${fixture.bens[0]!.numero}` })
      .click();
    await page
      .getByRole("combobox", { name: "Fornecedor / prestador" })
      .selectOption(fixture.fornecedorId);
    await page
      .getByRole("textbox", { name: "Problema identificado" })
      .fill("Falha no equipamento");
    await page.getByRole("button", { name: "Salvar atendimento" }).click();
    await page.screenshot({
      path: "test-results/manutencoes-nova-itens-1920.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: `Configurar ${fixture.bens[1]!.numero}` })
      .click();
    await page
      .getByRole("combobox", { name: "Tipo de manutenção" })
      .selectOption("PREVENTIVA");
    await page.getByRole("button", { name: "Salvar atendimento" }).click();
    let criado: { dados: { id: string } } | null = null;
    await page.route(
      "**/api/backend/manutencoes",
      async (route) => {
        if (route.request().method() !== "POST") {
          await route.continue();
          return;
        }
        const resposta = await route.fetch();
        expect(resposta.status()).toBe(201);
        criado = await resposta.json();
        await route.abort("connectionfailed");
      },
      { times: 1 },
    );
    await page.getByRole("button", { name: "Criar pedido" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Não foi possível confirmar o resultado" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Criar pedido" }).click();
    await expect(
      page.getByRole("status").filter({
        hasText:
          "Esta operação já havia sido concluída. Nenhuma nova alteração foi feita.",
      }),
    ).toBeVisible();
    const pedidoId = (criado as unknown as { dados: { id: string } }).dados.id;
    await page.goto(`/manutencoes/${pedidoId}`);
    await expect(page.getByText("0 de 2 retornados")).toBeVisible();
    await page.screenshot({
      path: "test-results/manutencoes-detalhe-1920.png",
      fullPage: true,
    });

    const item = page.getByRole("row").filter({
      hasText: fixture.bens[0]!.numero,
    });
    await item.getByRole("button", { name: "Orçamento" }).click();
    await page
      .getByRole("textbox", { name: "Descrição do orçamento" })
      .fill("Peça nova");
    await page.getByRole("textbox", { name: "Valor orçado" }).fill("20.00");
    await page.getByRole("button", { name: "Salvar orçamento" }).click();
    await expect(item).toContainText("1 versão");

    const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
    await page.getByLabel("Arquivo PDF (até 10 MiB)").first().setInputFiles({
      name: "pedido.pdf",
      mimeType: "application/pdf",
      buffer: pdf,
    });
    await page.getByRole("button", { name: "Anexar PDF" }).first().click();
    const linkPdf = page
      .getByRole("link", { name: /Documento de manutenção\.pdf/ })
      .first();
    await expect(linkPdf).toBeVisible();
    const respostaPdf = await page.request.get(
      (await linkPdf.getAttribute("href")) ?? "",
    );
    expect(respostaPdf.status()).toBe(200);
    expect(respostaPdf.headers()["content-type"]).toContain("application/pdf");
    await item.getByRole("button", { name: "Retorno" }).click();
    await page.screenshot({
      path: "test-results/manutencoes-retorno-modal-1920.png",
      fullPage: true,
    });
    await page.getByRole("textbox", { name: "Valor realizado" }).fill("20.00");
    await page
      .getByRole("textbox", { name: "Serviço realizado" })
      .fill("Peça substituída");
    await page.getByRole("button", { name: "Confirmar retorno" }).click();
    await expect(page.getByText("1 de 2 retornados")).toBeVisible();
    await page.screenshot({
      path: "test-results/manutencoes-parcial-1920.png",
      fullPage: true,
    });
    await expect(item.getByText("Retornado")).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: fixture.bens[1]!.numero }),
    ).toContainText("Em manutenção");

    await page.goto(`/manutencoes?busca=${fixture.bens[0]!.numero}`);
    await expect(page.getByRole("table")).toContainText(pedidoId);
    for (const width of [1920, 1536, 900]) {
      await page.setViewportSize({ width, height: 1080 });
      await page.screenshot({
        path: `test-results/manutencoes-lista-${width}.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/manutencoes-real-mobile.png",
      fullPage: true,
    });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await expect(
      page.getByRole("heading", { name: "Manutenção", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/manutencoes-lista-390-zoom-200.png",
      fullPage: true,
    });
  });

  test("executa o ciclo completo como administrador", async ({ page }) => {
    const fixtureBase = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "test-results/manutencoes-real-fixture.json",
        ),
        "utf8",
      ),
    ) as Fixture;
    const databaseUrl = process.env.MANUTENCOES_INTEGRATION_DATABASE_URL!;
    const db = createDatabaseClient(databaseUrl);
    const tag = randomUUID();
    let fixture: Fixture;
    try {
      const patrimonios = await db.patrimonio.findMany({
        select: { id: true, valorIncorporacao: true },
      });
      await Promise.all(
        patrimonios.map((bem) =>
          db.situacaoContabilPatrimonio.upsert({
            where: { patrimonioId: bem.id },
            create: {
              patrimonioId: bem.id,
              valorBrutoAtual: bem.valorIncorporacao,
              depreciacaoAcumuladaAtual: "0",
            },
            update: {},
          }),
        ),
      );
      const referencia = await db.patrimonio.findUniqueOrThrow({
        where: { id: fixtureBase.bens[0]!.id },
        select: { especieId: true, setorAtualId: true },
      });
      const usuario = await db.usuario.create({
        data: {
          nome: "Administrador Web teste",
          email: `${tag}@example.test`,
          senha: "hash-de-teste",
          perfil: "ADMINISTRADOR",
          trocaSenhaObrigatoria: false,
        },
      });
      const token = Buffer.from(
        randomUUID().replace(/-/g, "").repeat(2).slice(0, 64),
        "hex",
      ).toString("base64url");
      await db.sessaoUsuario.create({
        data: {
          usuarioId: usuario.id,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiraAt: new Date(Date.now() + 3_600_000),
        },
      });
      const bens = await Promise.all(
        [1, 2].map(async (indice) => {
          const bem = await db.patrimonio.create({
            data: {
              numeroPatrimonio: `${Date.now()}9${indice}`,
              tipoNumeroPatrimonial: "OFICIAL",
              descricao: `Equipamento administrador ${indice}`,
              dataTombamento: new Date("2025-01-01T00:00:00.000Z"),
              valorIncorporacao: "1000",
              depreciavel: false,
              especieId: referencia.especieId,
              setorAtualId: referencia.setorAtualId,
              createdById: usuario.id,
              situacaoContabil: {
                create: {
                  valorBrutoAtual: "1000",
                  depreciacaoAcumuladaAtual: "0",
                },
              },
            },
          });
          return { id: bem.id, numero: bem.numeroPatrimonio };
        }),
      );
      fixture = { ...fixtureBase, token, bens };
    } finally {
      await db.$disconnect();
    }

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
    await page
      .getByRole("combobox", { name: "Comissão responsável" })
      .selectOption(fixture.comissaoId);
    await page.getByRole("button", { name: "Adicionar bens" }).click();
    for (const bem of fixture.bens) {
      await page
        .getByRole("checkbox", { name: new RegExp(bem.numero) })
        .check();
    }
    await page.getByRole("button", { name: "Confirmar seleção" }).click();
    const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
    await page.getByLabel("Selecionar PDF").setInputFiles({
      name: "pedido-administrador.pdf",
      mimeType: "application/pdf",
      buffer: pdf,
    });
    await page.route(
      "**/api/backend/manutencoes/*/documentos",
      (route) => route.abort("connectionfailed"),
      { times: 1 },
    );
    await page.getByRole("button", { name: "Criar pedido" }).click();
    await expect(
      page.getByRole("status").filter({
        hasText: "O pedido foi criado, mas o PDF não teve envio confirmado",
      }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Abrir pedido criado" }).click();
    await expect(page).toHaveURL(/\/manutencoes\/[0-9a-f-]+$/);
    await expect(page.getByText("0 de 2 retornados")).toBeVisible();
    await page.getByLabel("Arquivo PDF (até 10 MiB)").first().setInputFiles({
      name: "pedido-administrador.pdf",
      mimeType: "application/pdf",
      buffer: pdf,
    });
    await page.getByRole("button", { name: "Anexar PDF" }).first().click();
    await expect(
      page.getByRole("link", { name: /Documento de manutenção\.pdf/ }),
    ).toBeVisible();

    for (const [indice, bem] of fixture.bens.entries()) {
      const item = page.getByRole("row").filter({ hasText: bem.numero });
      await item.getByRole("button", { name: "Orçamento" }).click();
      await page
        .getByRole("textbox", { name: "Descrição do orçamento" })
        .fill(`Serviço administrador ${indice + 1}`);
      await page
        .getByRole("textbox", { name: "Valor orçado" })
        .fill(`${30 + indice}.00`);
      await page.getByRole("button", { name: "Salvar orçamento" }).click();
      await item.getByRole("button", { name: "Retorno" }).click();
      await page
        .getByRole("textbox", { name: "Valor realizado" })
        .fill(`${30 + indice}.00`);
      await page
        .getByRole("textbox", { name: "Serviço realizado" })
        .fill(`Serviço concluído ${indice + 1}`);
      await page.getByRole("button", { name: "Confirmar retorno" }).click();
      await expect(
        page.getByText(`${indice + 1} de 2 retornados`),
      ).toBeVisible();
    }
    await expect(page.getByText("Concluída").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Documento de manutenção\.pdf/ }),
    ).toBeVisible();
  });
});
