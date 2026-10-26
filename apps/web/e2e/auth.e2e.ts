import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./support/test";

const activeIdentity = {
  id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
  nome: "Maria da Silva",
  email: "maria@example.com",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: false,
};

const pendingIdentity = {
  id: "dcebc286-aa55-4a36-9f2e-f8f885d2126c",
  nome: "João Diretor",
  email: "joao@example.com",
  perfil: "DIRETOR_PATRIMONIO",
  trocaSenhaObrigatoria: true,
};

function loginResponse(
  identity: typeof activeIdentity | typeof pendingIdentity,
) {
  return {
    status: 200,
    sucesso: true,
    mensagem: "Autenticação realizada com sucesso.",
    dados: identity,
  };
}

test.describe("Autenticação Web", () => {
  test("exibe credenciais inválidas e preserva o e-mail", async ({
    page,
    apiMock,
  }) => {
    apiMock.expectPost("/auth/login", ({ body, headers }) => {
      expect(body).toEqual({
        email: "maria@example.com",
        senha: "incorreta",
      });
      expect(headers["x-sipat-csrf"]).toBe("1");

      return {
        status: 401,
        body: {
          status: 401,
          sucesso: false,
          codigo: "CREDENCIAIS_INVALIDAS",
          mensagem: "Credenciais inválidas.",
          erros: [],
          requisicaoId: "e2e-request",
        },
      };
    });

    await page.goto("/login");
    await page.getByLabel("E-mail institucional").fill("maria@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("incorreta");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
    await expect(page.getByLabel("E-mail institucional")).toHaveValue(
      "maria@example.com",
    );
  });

  test("leva a sessão comum ao dashboard protegido e encerra a sessão", async ({
    page,
    apiMock,
  }) => {
    apiMock.expectPost("/auth/login", () => ({
      headers: {
        "Set-Cookie": "sipat_session=active; Path=/; HttpOnly; SameSite=Strict",
      },
      body: loginResponse(activeIdentity),
    }));
    apiMock.expectPost("/auth/logout", ({ headers }) => {
      expect(headers["x-sipat-csrf"]).toBe("1");
      return {
        status: 204,
        headers: {
          "Set-Cookie":
            "sipat_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
        },
      };
    });

    await page.goto("/login");
    await page.getByLabel("E-mail institucional").fill("maria@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha inicial");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Bem-vindo, Maria da Silva!" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("conclui o primeiro acesso com rotação da sessão", async ({
    page,
    apiMock,
  }) => {
    apiMock.expectPost("/auth/login", () => ({
      headers: {
        "Set-Cookie":
          "sipat_session=pending; Path=/; HttpOnly; SameSite=Strict",
      },
      body: loginResponse(pendingIdentity),
    }));
    apiMock.expectPost(
      "/auth/concluir-primeiro-acesso",
      ({ body, headers }) => {
        expect(headers["x-sipat-csrf"]).toBe("1");
        expect(body).toEqual({
          novaSenha: "uma nova senha segura",
          confirmacaoNovaSenha: "uma nova senha segura",
        });

        return {
          status: 204,
          headers: {
            "Set-Cookie":
              "sipat_session=active; Path=/; HttpOnly; SameSite=Strict",
          },
        };
      },
    );

    await page.goto("/login");
    await page.getByLabel("E-mail institucional").fill("joao@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha inicial");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/redefinir-senha$/);
    await expect(page.getByText("Olá, João Diretor.")).toBeVisible();

    await page
      .getByLabel("Nova senha *", { exact: true })
      .fill("uma nova senha segura");
    await page
      .getByLabel("Confirmar nova senha *")
      .fill("uma nova senha segura");
    await page
      .getByRole("button", { name: "Salvar nova senha e continuar" })
      .click();

    await expect(page).toHaveURL(/\/senha-atualizada$/);
    await page.getByRole("link", { name: "Continuar para o SIPAT" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("aplica redirects diretos e não expõe tela protegida ao anônimo", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);

    await page.context().addCookies([
      {
        name: "sipat_session",
        value: "pending",
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/redefinir-senha$/);
  });

  test("login e primeiro acesso não possuem violações automatizáveis", async ({
    page,
  }) => {
    await page.goto("/login");
    const login = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(login.violations, JSON.stringify(login.violations, null, 2)).toEqual(
      [],
    );

    await page.context().addCookies([
      {
        name: "sipat_session",
        value: "pending",
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/redefinir-senha");
    const redefinir = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      redefinir.violations,
      JSON.stringify(redefinir.violations, null, 2),
    ).toEqual([]);
  });

  test("mantém login e dashboard utilizáveis no viewport móvel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");

    await expect(page).toHaveTitle(/^Login \| .+/);
    await expect(
      page.getByRole("heading", { name: "Acesse sua conta" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    await page.context().addCookies([
      {
        name: "sipat_session",
        value: "active",
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/dashboard");

    await expect(page).toHaveTitle(/^Visão geral \| .+/);
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
