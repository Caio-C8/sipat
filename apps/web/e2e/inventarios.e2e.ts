import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./support/test";

const PENDENTE_ID = "10000000-0000-4000-8000-000000000001";
const ANDAMENTO_ID = "10000000-0000-4000-8000-000000000002";
const COMISSAO_ID = "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab";
const progresso = {
  totalSetores: 2,
  setoresPendentes: 2,
  setoresEmAndamento: 0,
  setoresConcluidos: 0,
  totalItens: 2,
  itensPendentes: 2,
  itensVerificados: 0,
  corretos: 0,
  divergencias: 0,
  naoLocalizados: 0,
  correcoesPendentes: 0,
  correcoesCorrigidas: 0,
};
const detalhePendente = {
  id: PENDENTE_ID,
  nome: "Inventário anual revisado",
  descricao: "Conferência patrimonial anual.",
  observacao: null,
  status: "PENDENTE",
  dataInicio: null,
  dataFim: null,
  iniciadoPorId: null,
  finalizadoPorId: null,
  createdById: "dcebc286-aa55-4a36-9f2e-f8f885d2126c",
  comissao: { id: COMISSAO_ID, nome: "Comissão patrimonial vigente" },
  progresso,
  createdAt: "2026-11-16T12:00:00.000Z",
  updatedAt: "2026-11-16T13:00:00.000Z",
} as const;
const detalheFinalizado = {
  ...detalhePendente,
  id: ANDAMENTO_ID,
  nome: "Inventário em conclusão",
  status: "FINALIZADO",
  dataInicio: "2026-11-15",
  dataFim: "2026-11-16",
  iniciadoPorId: detalhePendente.createdById,
  finalizadoPorId: detalhePendente.createdById,
  progresso: {
    ...progresso,
    setoresPendentes: 0,
    setoresConcluidos: 2,
    itensPendentes: 0,
    itensVerificados: 2,
    corretos: 1,
    divergencias: 1,
    correcoesPendentes: 1,
  },
} as const;

async function autenticar(
  page: import("@playwright/test").Page,
  baseURL: string,
  perfil: "active" | "director",
) {
  await page.context().addCookies([
    {
      name: "sipat_session",
      value: perfil,
      url: baseURL,
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
}

test("Diretor abre modais roteáveis, edita e confirma a finalização", async ({
  page,
  baseURL,
  apiMock,
}) => {
  if (!baseURL) throw new Error("baseURL necessária");
  await autenticar(page, baseURL, "director");
  apiMock.expectGet(
    "/reavaliacoes/opcoes/comissoes",
    () => ({
      body: {
        status: 200,
        sucesso: true,
        mensagem: "Comissões consultadas.",
        dados: [
          {
            id: COMISSAO_ID,
            nome: "Comissão patrimonial vigente",
            dataVigenciaInicio: "2026-01-01",
            dataVigenciaFim: "2026-12-31",
          },
        ],
        meta: { total: 1, pagina: 1, limite: 50, ultimaPagina: 1 },
      },
    }),
    5,
  );
  apiMock.expectPatch(`/inventarios/${PENDENTE_ID}`, () => ({
    body: {
      status: 200,
      sucesso: true,
      mensagem: "Inventário atualizado.",
      dados: detalhePendente,
    },
  }));
  apiMock.expectPost(`/inventarios/${ANDAMENTO_ID}/finalizar`, () => ({
    body: {
      status: 200,
      sucesso: true,
      mensagem: "Inventário finalizado.",
      dados: detalheFinalizado,
    },
  }));
  await page.goto("/inventarios");
  await expect(page).toHaveTitle("Inventários | SIPAT");

  await page.getByRole("link", { name: "Abrir inventário" }).click();
  await expect(page).toHaveURL(/\/inventarios\/novo$/);
  await expect(
    page.getByRole("dialog", { name: "Abrir inventário" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(page).toHaveURL(/\/inventarios$/);

  await page.goto(`/inventarios/${PENDENTE_ID}`);
  await page.getByRole("link", { name: "Editar dados" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/inventarios/${PENDENTE_ID}/editar$`),
  );
  await expect(
    page.getByRole("dialog", { name: "Editar inventário" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(page).toHaveURL(new RegExp(`/inventarios/${PENDENTE_ID}$`));

  await page.goto("/inventarios");

  await page.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/inventarios/${PENDENTE_ID}/editar$`),
  );
  const dialog = page.getByRole("dialog", { name: "Editar inventário" });
  await dialog
    .getByLabel("Nome do inventário")
    .fill("Inventário anual revisado");
  await dialog.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page).toHaveURL(new RegExp(`/inventarios/${PENDENTE_ID}$`));
  await expect(
    page.getByText("Inventário atualizado com sucesso."),
  ).toBeVisible();

  await page.goto(`/inventarios/${ANDAMENTO_ID}`);
  await page.getByRole("button", { name: "Finalizar inventário" }).click();
  await expect(page.getByText("1 correções pendentes")).toBeVisible();
  await page
    .getByText("Confirmo a finalização com correções pendentes.")
    .click();
  await page
    .getByRole("button", { name: "Finalizar inventário" })
    .last()
    .click();
  await expect(
    page.getByText("Inventário finalizado com sucesso."),
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  const acessibilidade = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    acessibilidade.violations,
    JSON.stringify(acessibilidade.violations, null, 2),
  ).toEqual([]);
});

test("Administrador consulta sem receber ações patrimoniais", async ({
  page,
  baseURL,
}) => {
  if (!baseURL) throw new Error("baseURL necessária");
  await autenticar(page, baseURL, "active");
  await page.goto("/inventarios");
  await expect(
    page.getByRole("heading", { name: "Inventários" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir inventário" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Editar" })).toHaveCount(0);

  await page.goto(`/inventarios/${PENDENTE_ID}/editar`);
  await expect(
    page.getByRole("heading", { name: "Acesso não permitido" }),
  ).toBeVisible();
});
