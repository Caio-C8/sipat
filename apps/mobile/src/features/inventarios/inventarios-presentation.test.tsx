import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SetorInventarioScreen } from "./setor-inventario-screen";

const scenario = vi.hoisted(() => ({
  profile: "DIRETOR_PATRIMONIO" as "DIRETOR_PATRIMONIO" | "ADMINISTRADOR",
  status: "PENDENTE" as "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO",
}));

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("../auth/session/session-context", () => ({
  useSession: () => ({
    manager: {},
    state: {
      status: "authenticated",
      identity: { perfil: scenario.profile },
    },
  }),
}));

vi.mock("./use-inventarios", () => ({
  inventarioErrorMessage: () => "Falha de teste.",
  useSetorInventarioDetail: () => {
    const started = scenario.status !== "PENDENTE";
    const completed = scenario.status === "CONCLUIDO";
    const setor = {
      id: "22222222-2222-4222-8222-222222222222",
      status: scenario.status,
      setor: {
        id: "33333333-3333-4333-8333-333333333333",
        nome: "Gabinete 01",
      },
      dataInicio: started ? "2026-10-29T12:00:00.000Z" : null,
      dataFim: completed ? "2026-10-29T13:00:00.000Z" : null,
      iniciadoPorId: started ? "44444444-4444-4444-8444-444444444444" : null,
      concluidoPorId: completed ? "44444444-4444-4444-8444-444444444444" : null,
      progresso: {
        totalItens: 4,
        itensPendentes: completed ? 0 : 2,
        itensVerificados: completed ? 4 : 2,
        corretos: completed ? 3 : 1,
        divergencias: completed ? 1 : 1,
        naoLocalizados: 0,
      },
    };
    return {
      state: {
        status: "success",
        data: {
          inventario: {
            nome: "Inventário 2026",
          },
          setor,
          setorEmAndamento: scenario.status === "EM_ANDAMENTO" ? setor : null,
        },
      },
      reload: vi.fn(),
      start: vi.fn(),
      starting: false,
      mutationError: null,
    };
  },
}));

function render() {
  return renderToStaticMarkup(
    <SetorInventarioScreen
      inventarioId="11111111-1111-4111-8111-111111111111"
      setorInventarioId="22222222-2222-4222-8222-222222222222"
      validIds
    />,
  );
}

describe("apresentação do setor de inventário", () => {
  it("oferece iniciar apenas para Diretor em setor pendente", () => {
    scenario.profile = "DIRETOR_PATRIMONIO";
    scenario.status = "PENDENTE";
    const markup = render();

    expect(markup).toContain("Iniciar conferência");
    expect(markup).not.toContain("Retomar conferência");
  });

  it("oferece retomar sem apresentar novo início em setor em andamento", () => {
    scenario.profile = "DIRETOR_PATRIMONIO";
    scenario.status = "EM_ANDAMENTO";
    const markup = render();

    expect(markup).toContain("Retomar conferência");
    expect(markup).not.toContain("Confirmar início");
  });

  it("mantém setor concluído somente leitura", () => {
    scenario.profile = "DIRETOR_PATRIMONIO";
    scenario.status = "CONCLUIDO";
    const markup = render();

    expect(markup).toContain("Conferência concluída");
    expect(markup).not.toContain("Iniciar conferência");
    expect(markup).not.toContain("Retomar conferência");
  });

  it("não monta controles mutáveis para Administrador", () => {
    scenario.profile = "ADMINISTRADOR";
    scenario.status = "PENDENTE";
    const markup = render();

    expect(markup).toContain("Resumo somente leitura");
    expect(markup).not.toContain("Iniciar conferência");
    expect(markup).not.toContain("Retomar conferência");
  });
});
