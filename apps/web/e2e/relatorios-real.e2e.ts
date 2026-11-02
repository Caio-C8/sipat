import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const real = Boolean(process.env.RELATORIOS_INTEGRATION_DATABASE_URL);
test.describe("Relatórios Web → API → PostgreSQL → PDF", () => {
  test.skip(!real, "Exige stack e fixtures isoladas de relatórios.");
  const fixture = () =>
    JSON.parse(
      readFileSync(
        path.resolve("test-results/relatorios-real-fixture.json"),
        "utf8",
      ),
    ) as {
      tag: string;
      patrimonioId: string;
      inventarioId: string;
      emailDiretor: string;
    };
  for (const perfil of ["administrador", "diretor"]) {
    test(`nove tipos, prévia e download por ${perfil}`, async ({ page }) => {
      const f = fixture();
      await page.goto("/login");
      await page
        .getByLabel("E-mail")
        .fill(
          perfil === "administrador"
            ? process.env.SIPAT_RELATORIOS_EMAIL!
            : f.emailDiretor,
        );
      await page
        .getByLabel("Senha", { exact: true })
        .fill(process.env.SIPAT_RELATORIOS_SENHA!);
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await expect(page).toHaveURL(/dashboard/);
      const periodo = { inicio: "2026-01-01", fim: "2026-12-31" };
      const queries: Record<string, Record<string, string>> = {
        patrimonios: { busca: f.tag },
        movimentacoes: { ...periodo, patrimonioId: f.patrimonioId },
        manutencoes: {
          ...periodo,
          base: "ENVIO",
          patrimonioId: f.patrimonioId,
        },
        depreciacoes: {
          competenciaInicio: "2026-01",
          competenciaFim: "2026-02",
          patrimonioId: f.patrimonioId,
        },
        reavaliacoes: {
          ...periodo,
          base: "REGISTRO",
          patrimonioId: f.patrimonioId,
        },
        inventarios: { inventarioId: f.inventarioId },
        emprestimos: {
          ...periodo,
          base: "SAIDA",
          patrimonioId: f.patrimonioId,
        },
        baixas: { ...periodo, patrimonioId: f.patrimonioId },
        "ficha-bem": { patrimonioId: f.patrimonioId },
      };
      for (const [tipo, q] of Object.entries(queries)) {
        await page.goto(
          `/relatorios?${new URLSearchParams({ tipo, consultar: "1", ...q })}`,
        );
        await expect(
          page.getByRole("heading", { name: /Prévia —/ }),
        ).toBeVisible();
        await expect(
          page.getByRole("region", { name: "Resultados do relatório" }),
        ).toBeVisible();
        const download = page.waitForEvent("download");
        await page
          .getByRole("button", {
            name: "Gerar e baixar PDF de todos os resultados filtrados",
            exact: true,
          })
          .click();
        const file = await download;
        expect(await file.failure()).toBeNull();
        const target = test.info().outputPath(`${perfil}-${tipo}.pdf`);
        await file.saveAs(target);
        expect(readFileSync(target).subarray(0, 5).toString()).toBe("%PDF-");
        if (tipo === "patrimonios") {
          await expect(
            page.getByText("25 registros no conjunto filtrado.", {
              exact: false,
            }),
          ).toBeVisible();
          await page.getByRole("link", { name: "Próxima página" }).click();
          await expect(
            page.getByText("Página 2 de 2", { exact: false }),
          ).toBeVisible();
          await page
            .getByLabel("Busca (opcional)", { exact: true })
            .fill("filtro-sem-resultados");
          await expect(
            page.getByRole("heading", { name: /Prévia —/ }),
          ).toHaveCount(0);
          await expect(
            page.getByText("Filtros alterados.", { exact: false }),
          ).toBeVisible();
        }
      }
      await page.screenshot({
        path: test.info().outputPath(`${perfil}-ficha.png`),
        fullPage: true,
      });
    });
  }
  test("seletores reais, vazio, teclado e telas estreitas", async ({
    page,
    browser,
  }) => {
    const f = fixture();
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(process.env.SIPAT_RELATORIOS_EMAIL!);
    await page
      .getByLabel("Senha", { exact: true })
      .fill(process.env.SIPAT_RELATORIOS_SENHA!);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/relatorios");
    await page.getByLabel("Tipo de relatório").selectOption("ficha-bem");
    await page
      .getByRole("textbox", { name: "Buscar Patrimônio", exact: true })
      .fill(f.tag);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page
      .getByRole("button", { name: "Mais opções", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Selecionar Patrimônio", exact: true })
      .selectOption(f.patrimonioId);
    await page
      .getByRole("button", { name: "Consultar prévia", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: /Prévia —/ })).toBeVisible();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: test.info().outputPath(`relatorios-${width}.png`),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    // Zoom de 200% em 1280×900: viewport CSS pela metade e densidade dobrada.
    // Escalar apenas CSS zoom não altera os breakpoints como o zoom do Chrome.
    const ampliado = await browser.newContext({
      viewport: { width: 640, height: 450 },
      deviceScaleFactor: 2,
    });
    await ampliado.addCookies(await page.context().cookies());
    const zoom = await ampliado.newPage();
    await zoom.goto(page.url());
    expect(
      await zoom.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(zoom.getByRole("heading", { name: /Prévia —/ })).toBeVisible();
    await zoom.screenshot({
      path: test.info().outputPath("relatorios-zoom-200.png"),
      fullPage: true,
    });
    await ampliado.close();
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
      "BODY",
    );
    const axe = await new AxeBuilder({ page }).include("main").analyze();
    expect(axe.violations).toEqual([]);
    await page.goto(
      `/relatorios?tipo=baixas&consultar=1&inicio=2025-01-01&fim=2025-01-02&patrimonioId=${f.patrimonioId}`,
    );
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Nenhum registro corresponde aos filtros." }),
    ).toBeVisible();
    const down = page.waitForEvent("download");
    await page.getByRole("button", { name: /Gerar e baixar PDF/ }).click();
    await (await down).saveAs(test.info().outputPath("vazio.pdf"));
  });
});
