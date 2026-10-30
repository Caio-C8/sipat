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
  test("abre a solicitação pelo login e exibe a confirmação neutra", async ({
    page,
    apiMock,
  }) => {
    apiMock.expectPost("/auth/esqueceu-senha", ({ body, headers }) => {
      expect(body).toEqual({ email: "maria@example.com" });
      expect(headers["x-sipat-csrf"]).toBe("1");
      expect(headers.origin).toBe(new URL(page.url()).origin);

      return {
        status: 202,
        body: {
          status: 202,
          sucesso: true,
          mensagem:
            "Se houver uma conta elegível, enviaremos as instruções para redefinir a senha.",
        },
      };
    });

    await page.goto("/login");
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expect(page).toHaveURL(/\/esqueci-senha$/);
    await expect(page).toHaveTitle(/^Esqueci minha senha \| .+/);

    await page.getByLabel("E-mail institucional").fill("  MARIA@EXAMPLE.COM  ");
    await page.getByRole("button", { name: "Enviar instruções" }).click();

    await expect(
      page.getByRole("heading", { name: "Verifique seu e-mail" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Se houver uma conta elegível, enviaremos as instruções para redefinir a senha.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(/não confirma se uma conta existe/i),
    ).toBeVisible();
  });

  test("trata rate limit da solicitação sem revelar a conta", async ({
    page,
    apiMock,
  }) => {
    apiMock.expectPost("/auth/esqueceu-senha", () => ({
      status: 429,
      body: {
        status: 429,
        sucesso: false,
        codigo: "MUITAS_REQUISICOES",
        mensagem: "Muitas requisições.",
        erros: [],
        requisicaoId: "e2e-request",
      },
    }));

    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail institucional").fill("maria@example.com");
    await page.getByRole("button", { name: "Enviar instruções" }).click();

    await expect(
      page.getByRole("alert").getByText(/Muitas tentativas/),
    ).toBeVisible();
    await expect(page.getByLabel("E-mail institucional")).toHaveValue(
      "maria@example.com",
    );
  });

  test("remove o fragmento, redefine uma única vez e substitui o histórico", async ({
    page,
    apiMock,
  }) => {
    const token = "A".repeat(43);
    const novaSenha = "uma nova senha segura 1!";

    apiMock.expectPost("/auth/redefinir-senha", ({ body, headers }) => {
      expect(headers["x-sipat-csrf"]).toBe("1");
      expect(headers.origin).toBe(new URL(page.url()).origin);
      expect(body).toEqual({
        token,
        novaSenha,
        confirmacaoNovaSenha: novaSenha,
      });

      return { status: 204 };
    });

    await page.goto("/login");
    await page.goto(`/recuperar-senha#token=${token}`);
    await expect(page).toHaveURL(/\/recuperar-senha$/);
    await expect(page).toHaveTitle(/^Recuperar senha \| .+/);
    await expect(
      page.getByLabel("Nova senha *", { exact: true }),
    ).toBeFocused();

    await page.getByLabel("Nova senha *", { exact: true }).fill(novaSenha);
    await page.getByLabel("Confirmar nova senha *").fill(novaSenha);
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page).toHaveURL(/\/recuperacao-concluida$/);
    await expect(page).toHaveTitle(/^Recuperação concluída \| .+/);
    await expect(
      page.getByRole("link", { name: "Voltar ao app" }),
    ).toHaveAttribute("href", "sipat://login?origem=recuperacao-senha");
    await expect(
      page.getByRole("link", { name: "Ir para o login Web" }),
    ).toHaveAttribute("href", "/login");
    expect(page.url()).not.toContain(token);
    expect(page.url()).not.toContain(novaSenha);

    await page.goBack();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel("Nova senha *", { exact: true })).toHaveCount(
      0,
    );
  });

  test("não chama a API sem token válido e unifica a falha pública do token", async ({
    page,
    apiMock,
  }) => {
    await page.goto("/recuperar-senha#token=invalido");
    await expect(page).toHaveURL(/\/recuperar-senha$/);
    await expect(
      page.getByRole("region", { name: "Acesso ao SIPAT" }).getByRole("alert"),
    ).toContainText(
      "Este link de recuperação é inválido, expirou ou já foi utilizado.",
    );

    const token = "A".repeat(43);
    apiMock.expectPost("/auth/redefinir-senha", () => ({
      status: 401,
      body: {
        status: 401,
        sucesso: false,
        codigo: "TOKEN_REDEFINICAO_INVALIDO",
        mensagem: "Token de redefinição inválido.",
        erros: [],
        requisicaoId: "e2e-request",
      },
    }));

    await page.goto("/login");
    await page.goto(`/recuperar-senha#token=${token}`);
    await page
      .getByLabel("Nova senha *", { exact: true })
      .fill("uma nova senha segura 1!");
    await page
      .getByLabel("Confirmar nova senha *")
      .fill("uma nova senha segura 1!");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(
      page.getByRole("region", { name: "Acesso ao SIPAT" }).getByRole("alert"),
    ).toContainText(
      "Este link de recuperação é inválido, expirou ou já foi utilizado.",
    );
    await expect(page.getByLabel("Nova senha *", { exact: true })).toHaveCount(
      0,
    );
  });

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
    apiMock.expectPost("/auth/logout", async ({ headers }) => {
      expect(headers["x-sipat-csrf"]).toBe("1");
      await new Promise((resolve) => setTimeout(resolve, 150));
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
    const resumo = page.getByRole("region", { name: "Resumo dos bens" });
    await expect(resumo.getByText("32")).toBeVisible();
    await expect(resumo.getByText("28")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Cadastrar bem.*Em breve/ }),
    ).toBeDisabled();
    await expect(
      page.getByText(
        "Dados ainda não disponíveis — integração não implementada",
      ),
    ).toHaveCount(3);

    await page.getByRole("button", { name: /Menu do usuário/ }).click();
    const logout = page.getByRole("menuitem");
    await logout.click();
    await expect(logout).toBeDisabled();
    await expect(logout).toHaveText("Saindo...");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("filtra a navegação por perfil e não cria links para rotas futuras", async ({
    page,
  }) => {
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

    const navigation = page.getByRole("navigation", {
      name: "Navegação principal",
    });
    await expect(
      navigation.getByText("Usuários", { exact: true }),
    ).toBeVisible();
    await expect(
      navigation.getByText("Cadastrar patrimônio", { exact: true }),
    ).toHaveCount(0);
    await expect(
      navigation.getByText("Manutenção", { exact: true }),
    ).toBeVisible();
    await expect(navigation.getByRole("link")).toHaveCount(4);
    await expect(
      navigation.getByRole("link", { name: "Movimentações", exact: true }),
    ).toHaveAttribute("href", "/movimentacoes");
    await expect(
      navigation.getByRole("link", { name: "Manutenção", exact: true }),
    ).toHaveAttribute("href", "/manutencoes");
    await expect(
      navigation.getByRole("link", { name: "Reavaliação", exact: true }),
    ).toHaveAttribute("href", "/reavaliacoes");
    await expect(
      navigation.getByRole("link", { name: "Início" }),
    ).toHaveAttribute("aria-current", "page");

    await page.context().addCookies([
      {
        name: "sipat_session",
        value: "director",
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.reload();

    await expect(
      navigation.getByText("Cadastrar patrimônio", { exact: true }),
    ).toBeVisible();
    await expect(navigation.getByText("Usuários", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      navigation.getByText("Manutenção", { exact: true }),
    ).toBeVisible();
    await expect(
      navigation.getByRole("link", { name: "Reavaliação", exact: true }),
    ).toHaveAttribute("href", "/reavaliacoes");
  });

  test("expõe os estados deliberadamente vazios do shell e restaura o foco", async ({
    page,
  }) => {
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

    await expect(
      page.getByRole("navigation", { name: "Localização atual" }),
    ).toContainText("Visão geral");
    await expect(
      page.getByLabel("Pesquisa ainda não implementada"),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: /ajuda/i })).toHaveCount(0);

    const notifications = page.getByRole("button", { name: "Notificações" });
    await notifications.click();
    const panel = page.getByRole("region", { name: "Notificações" });
    await expect(
      panel.getByRole("heading", { name: "Pendências recentes" }),
    ).toBeVisible();
    await expect(
      panel.getByRole("heading", { name: "Últimas operações" }),
    ).toBeVisible();
    await expect(panel.getByText("Não implementado")).toHaveCount(2);
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(notifications).toBeFocused();

    const dashboard = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      dashboard.violations,
      JSON.stringify(dashboard.violations, null, 2),
    ).toEqual([]);
  });

  test("distingue zero, loading e indisponibilidade no dashboard", async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: "sipat_session",
        value: "active",
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
      {
        name: "sipat_dashboard_scenario",
        value: "zero",
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/dashboard");
    await expect(page.getByText("Nenhum patrimônio cadastrado.")).toBeVisible();
    await expect(
      page.getByText("Não foi possível carregar os dados patrimoniais."),
    ).toHaveCount(0);

    await page.context().addCookies([
      {
        name: "sipat_dashboard_scenario",
        value: "slow",
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    const slowNavigation = page.goto("/dashboard");
    await expect(
      page.getByRole("main", { name: "Carregando visão geral" }),
    ).toBeVisible();
    await slowNavigation;

    await page.context().addCookies([
      {
        name: "sipat_dashboard_scenario",
        value: "error",
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);
    await page.goto("/dashboard");
    await expect(
      page.getByRole("alert").filter({
        hasText: "Não foi possível carregar os dados patrimoniais.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Resumo dos bens" }).getByText("—"),
    ).toHaveCount(4);
  });

  test("mantém a falha de logout perceptível dentro do menu do usuário", async ({
    page,
    apiMock,
  }) => {
    apiMock.expectPost("/auth/logout", () => ({
      status: 500,
      body: {
        status: 500,
        sucesso: false,
        codigo: "ERRO_INTERNO",
        mensagem: "Falha controlada no teste.",
        erros: [],
        requisicaoId: "e2e-request",
      },
    }));
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
    await page.getByRole("button", { name: /Menu do usuário/ }).click();
    await page.getByRole("menuitem", { name: "Sair", exact: true }).click();

    await expect(
      page
        .getByRole("alert")
        .getByText("Não foi possível encerrar a sessão. Tente novamente."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);
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
          novaSenha: "uma nova senha segura 1!",
          confirmacaoNovaSenha: "uma nova senha segura 1!",
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
      .fill("uma nova senha segura 1!");
    await page
      .getByLabel("Confirmar nova senha *")
      .fill("uma nova senha segura 1!");
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

  test("autenticação e recuperação não possuem violações automatizáveis", async ({
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

    await page.goto("/esqueci-senha");
    const solicitarRecuperacao = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      solicitarRecuperacao.violations,
      JSON.stringify(solicitarRecuperacao.violations, null, 2),
    ).toEqual([]);

    await page.goto("/recuperar-senha");
    const recuperarSenha = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      recuperarSenha.violations,
      JSON.stringify(recuperarSenha.violations, null, 2),
    ).toEqual([]);

    await page.goto("/recuperacao-concluida");
    const recuperacaoConcluida = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      recuperacaoConcluida.violations,
      JSON.stringify(recuperacaoConcluida.violations, null, 2),
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
    await expect(
      page.getByRole("button", { name: "Menu", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(
      page.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Menu", exact: true }),
    ).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
