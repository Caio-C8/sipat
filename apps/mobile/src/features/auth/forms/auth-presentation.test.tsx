import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FirstAccessForm } from "./first-access-form";
import { LoginForm } from "./login-form";
import { PasswordUpdated } from "./password-updated";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("expo-router", () => ({
  useRouter: () => ({ replace: vi.fn() }),
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
  it("mantém a recuperação visível e realmente desabilitada no login", () => {
    const markup = renderToStaticMarkup(<LoginForm />);

    expect(markup).toContain("Bem-vindo ao SIPAT");
    expect(markup).toContain("Acesse sua conta");
    expect(markup).toContain("Esqueci minha senha");
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).not.toContain("href=");
  });

  it("usa a identidade real no primeiro acesso e preserva as orientações", () => {
    const markup = renderToStaticMarkup(<FirstAccessForm />);

    expect(markup).toContain(
      "Olá, Ana Souza. Falta só esta etapa para entrar.",
    );
    expect(markup).toContain("Troca obrigatória da senha inicial");
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
