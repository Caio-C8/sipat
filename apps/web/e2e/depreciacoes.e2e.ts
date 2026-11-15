import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./support/test";

test("seleciona competências pela URL sem criar uma central de notificações", async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw new Error("baseURL necessária");
  await page.context().addCookies([
    {
      name: "sipat_session",
      value: "director",
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);

  await page.goto("/depreciacao");
  await expect(page).toHaveURL(/competencia=2026-10/);
  await expect(page).toHaveTitle("Depreciação | SIPAT");
  const seletor = page.getByRole("combobox", { name: "Competência" });
  await expect(seletor).toContainText("Outubro de 2026 — 1 pendente(s)");
  await expect(page.getByText("Notebook para depreciação")).toBeVisible();
  await expect(
    page.getByText(
      "Os valores são calculados automaticamente com base nos parâmetros cadastrados para cada patrimônio.",
    ),
  ).toBeVisible();
  await expect(page.getByText(/\b(?:API|URL)\b/)).toHaveCount(0);

  await expect(async () => {
    await seletor.selectOption("2026-11");
    await expect(page).toHaveURL(/competencia=2026-11/, { timeout: 2_000 });
  }).toPass({ timeout: 10_000 });
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "dependem de uma competência anterior" }),
  ).toContainText("Outubro de 2026");
  await expect(
    page.getByText("Não há bens pendentes para esta competência."),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Notificações" })).toHaveCount(
    0,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Depreciação", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page).toHaveTitle("Depreciação | SIPAT");

  const acessibilidade = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    acessibilidade.violations,
    JSON.stringify(acessibilidade.violations, null, 2),
  ).toEqual([]);
});
