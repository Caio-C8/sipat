import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { DominiosBuscaGlobal } from "@repo/contracts";

const gruposVazios = DominiosBuscaGlobal.map((dominio) => ({
  dominio,
  rotulo: dominio,
  total: 0,
  truncado: false,
  verTodosDestino: null,
  itens: [],
}));

for (const sessao of ["active", "director"] as const) {
  test(`busca registros autorizados pelo teclado para a sessão ${sessao}`, async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: "sipat_session",
        value: sessao,
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.route("**/api/backend/busca?**", async (route) => {
      const url = new URL(route.request().url());
      expect(url.searchParams.get("termo")).toBe("mesa");
      await route.fulfill({
        json: {
          status: 200,
          sucesso: true,
          mensagem: "Busca concluída com sucesso.",
          dados: {
            termo: "mesa",
            grupos: gruposVazios.map((grupo) =>
              grupo.dominio === "PATRIMONIOS"
                ? {
                    ...grupo,
                    rotulo: "Patrimônios",
                    total: 7,
                    truncado: true,
                    verTodosDestino: "/patrimonios?busca=mesa",
                    itens: [
                      {
                        id: "11111111-1111-4111-8111-111111111111",
                        identificador: "123",
                        titulo: "Mesa de reunião",
                        complemento: "Mobiliário",
                        destino:
                          "/patrimonios/11111111-1111-4111-8111-111111111111",
                      },
                    ],
                  }
                : grupo,
            ),
          },
        },
      });
    });

    await page.goto("/dashboard");
    await page.keyboard.press("Control+k");
    const input = page.getByRole("textbox", { name: "Termo da busca global" });
    await expect(input).toBeFocused();
    await input.fill("mesa");
    await expect(
      page.getByRole("link", { name: /Mesa de reunião/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ver todos em Patrimônios" }),
    ).toBeVisible();
    await expect(page.getByText("USUARIOS")).toHaveCount(0);

    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      resultado.violations,
      JSON.stringify(resultado.violations, null, 2),
    ).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: /Pesquisar no SIPAT/ }),
    ).toBeFocused();
  });
}
