import type { Page } from "@playwright/test";

export async function selecionarOpcaoComponente(
  page: Page,
  campo: string,
  opcao: string,
) {
  await page.getByRole("combobox", { name: campo, exact: true }).click();
  await page.getByRole("option", { name: opcao, exact: true }).click();
}
