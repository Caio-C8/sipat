import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppTopbarView } from "./app-topbar";

vi.mock("../../../assets/brasao.png", () => ({
  default: { uri: "brasao.png" },
}));

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("../../features/auth/session/session-context", () => ({
  useSession: vi.fn(),
}));

const identity = {
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Caio Silva",
  email: "caio@example.com",
  perfil: "ADMINISTRADOR",
  trocaSenhaObrigatoria: false,
} as const;

describe("AppTopbar", () => {
  it("mantém a identificação municipal sem sessão autenticada", () => {
    const markup = renderToStaticMarkup(
      <AppTopbarView
        identity={null}
        isWide={false}
        menuOpen={false}
        onLogout={vi.fn()}
        onToggleMenu={vi.fn()}
      />,
    );

    expect(markup).toContain('role="heading"');
    expect(markup).toContain("SIPAT");
    expect(markup).toContain("Câmara Municipal de Patos de Minas");
    expect(markup).toContain(
      'aria-label="SIPAT, Câmara Municipal de Patos de Minas"',
    );
  });

  it("substitui o texto municipal pelo avatar da identidade autenticada", () => {
    const markup = renderToStaticMarkup(
      <AppTopbarView
        identity={identity}
        isWide={false}
        menuOpen={false}
        onLogout={vi.fn()}
        onToggleMenu={vi.fn()}
      />,
    );

    expect(markup).toContain("CS");
    expect(markup).toContain('aria-label="Conta de Caio Silva"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain("Câmara Municipal de Patos de Minas");
    expect(markup).not.toContain(">Sair<");
  });

  it("exibe identidade, perfil e botão Sair quando o menu está aberto", () => {
    const markup = renderToStaticMarkup(
      <AppTopbarView
        identity={identity}
        isWide={false}
        menuOpen
        onLogout={vi.fn()}
        onToggleMenu={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('aria-label="Menu da conta"');
    expect(markup).toContain("Caio Silva");
    expect(markup).toContain("Administrador");
    expect(markup).toContain(">Sair<");
    expect(markup).toContain('data-icon="log-out"');
  });
});
