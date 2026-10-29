import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FirstAccessForm } from "./first-access-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { LoginForm } from "./login-form";
import { PasswordUpdated } from "./password-updated";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("../../../config/public-app-config", () => ({
  publicAppConfig: { apiBaseUrl: "https://api.example.test" },
}));

vi.mock("expo-router", () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), setParams: vi.fn() }),
}));

vi.mock("../session/session-context", () => ({
  useSession: () => ({
    manager: {
      acknowledgeFirstAccessCompletion: vi.fn(),
      completeFirstAccess: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    },
    state: {
      status: "authenticated",
      identity: { nome: "Ana Souza" },
    },
  }),
}));

describe("apresentação dos formulários de autenticação", () => {
  it("mantém a recuperação visível e acionável no login", () => {
    const markup = renderToStaticMarkup(<LoginForm />);

    expect(markup).toContain("Bem-vindo ao SIPAT");
    expect(markup).toContain("Acesse sua conta");
    expect(markup).toContain("Esqueci minha senha");
    expect(markup).not.toContain('aria-disabled="true"');
  });

  it("reutiliza a composição visual no formulário público de recuperação", () => {
    const markup = renderToStaticMarkup(<ForgotPasswordForm />);

    expect(markup).toContain("Recupere sua senha");
    expect(markup).toContain("E-mail institucional");
    expect(markup).toContain("Enviar instruções");
    expect(markup).toContain("Voltar ao login");
  });

  it("usa a identidade real no primeiro acesso e preserva as orientações", () => {
    const markup = renderToStaticMarkup(<FirstAccessForm />);

    expect(markup).toContain(
      "Olá, Ana Souza. Falta só esta etapa para entrar.",
    );
    expect(markup).toContain("Troca obrigatória da senha inicial");
    expect(markup).toContain(
      "Use no mínimo 8 caracteres, com uma letra, um número e um símbolo.",
    );
    expect(markup).toContain("Salvar senha e continuar");
    expect(markup).not.toContain("Paulo");
  });

  it("reproduz a confirmação e a ação protegida de continuação", () => {
    const markup = renderToStaticMarkup(<PasswordUpdated />);

    expect(markup).toContain("Senha atualizada");
    expect(markup).toContain("Seu primeiro acesso foi concluído.");
    expect(markup).toContain("Continuar para o SIPAT");
    expect(markup).toContain('data-icon="check"');
  });
});
