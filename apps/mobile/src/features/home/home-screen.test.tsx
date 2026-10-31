import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api/api-error";
import type { InventariosHome } from "./api/home-operations";
import { HomeContent } from "./home-screen";
import type { HomeDashboardState } from "./use-home-dashboard";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("expo-router", () => ({
  useRouter: vi.fn(),
}));

vi.mock("../auth/session/session-context", () => ({
  useSession: vi.fn(),
}));

vi.mock("./use-home-dashboard", () => ({
  homeErrorMessage: (error: ApiError) => {
    if (error.status === 403)
      return "Seu perfil não tem permissão para consultar este bloco.";
    if (error.status === 401)
      return "Sua sessão expirou. Aguarde o redirecionamento para entrar novamente.";
    if (error.kind === "timeout")
      return "A consulta demorou mais que o esperado.";
    if (error.kind === "network")
      return "Sem conexão. Verifique sua internet e tente novamente.";
    return "Não foi possível carregar este bloco.";
  },
  useHomeDashboard: vi.fn(),
}));

const inventory = {
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Inventário 2026",
  status: "FINALIZADO",
  dataInicio: "2026-09-01",
  dataFim: "2026-09-27",
  iniciadoPorId: "22222222-2222-4222-8222-222222222222",
  finalizadoPorId: "33333333-3333-4333-8333-333333333333",
  comissao: {
    id: "44444444-4444-4444-8444-444444444444",
    nome: "Comissão anual",
  },
  progresso: {
    totalSetores: 4,
    setoresPendentes: 0,
    setoresEmAndamento: 0,
    setoresConcluidos: 4,
    totalItens: 20,
    itensPendentes: 0,
    itensVerificados: 20,
    corretos: 17,
    divergencias: 3,
    naoLocalizados: 0,
    correcoesPendentes: 1,
    correcoesCorrigidas: 2,
  },
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-27T12:00:00.000Z",
} as const;

const inventories = {
  total: 7,
  pendentes: 2,
  emAndamento: 1,
  finalizados: 4,
  maisRecente: inventory,
  emAndamentoMaisRecente: {
    ...inventory,
    id: "55555555-5555-4555-8555-555555555555",
    nome: "Inventário atual",
    status: "EM_ANDAMENTO",
    dataFim: null,
    finalizadoPorId: null,
    progresso: {
      ...inventory.progresso,
      setoresPendentes: 1,
      setoresEmAndamento: 1,
      setoresConcluidos: 2,
      itensPendentes: 5,
      itensVerificados: 15,
      corretos: 12,
    },
  },
  finalizadoMaisRecente: inventory,
} as unknown as InventariosHome;

const successState: HomeDashboardState = {
  setores: { status: "success", data: 4 },
  patrimonios: { status: "success", data: 128 },
  inventarios: { status: "success", data: inventories },
};

const actions = {
  onOpenInventories: vi.fn(),
  onOpenInventory: vi.fn(),
  onRefresh: vi.fn(),
  onRetry: vi.fn(),
};

describe("HomeContent", () => {
  it("apresenta totais e os três estados ao Administrador sem ação mutável", () => {
    const markup = renderToStaticMarkup(
      <HomeContent
        {...actions}
        name="Ana Silva"
        profile="ADMINISTRADOR"
        state={successState}
      />,
    );

    expect(markup).toContain("Olá, Ana Silva");
    expect(markup).toContain("Gestão patrimonial");
    expect(markup).toContain("Setores cadastrados");
    expect(markup).toContain(">4<");
    expect(markup).toContain("Bens cadastrados");
    expect(markup).toContain(">128<");
    expect(markup).toContain("Pendentes");
    expect(markup).toContain("Em andamento");
    expect(markup).toContain("Finalizados");
    expect(markup).toContain('aria-label="Abrir Inventário atual"');
    expect(markup).not.toContain("Iniciar conferência");
    expect(markup).toContain('aria-label="Ver inventários"');
    expect(markup).toContain("Gerar relatório");
    expect(markup).toContain("Atualizar dados");
  });

  it("prioriza progresso e última conferência para o Diretor", () => {
    const markup = renderToStaticMarkup(
      <HomeContent
        {...actions}
        name="Paulo Caixeta"
        profile="DIRETOR_PATRIMONIO"
        state={{ ...successState, setores: null }}
      />,
    );

    expect(markup).toContain("Fazer inventário");
    expect(markup).toContain("Iniciar conferência");
    expect(markup).toContain('aria-label="Iniciar conferência"');
    expect(markup.match(/aria-disabled="true"/g)).toHaveLength(1);
    expect(markup).toContain("Inventário atual");
    expect(markup).toContain("15 de");
    expect(markup).toContain("20 bens conferidos");
    expect(markup).toContain("75% concluído");
    expect(markup).toContain("Última conferência");
    expect(markup).toContain("Finalizado em 27/09/2026");
    expect(markup).not.toContain("Setores cadastrados");
  });

  it("modela vazio sem transformar ausência em zero", () => {
    const empty: InventariosHome = {
      total: 0,
      pendentes: 0,
      emAndamento: 0,
      finalizados: 0,
      maisRecente: null,
      emAndamentoMaisRecente: null,
      finalizadoMaisRecente: null,
    };
    const markup = renderToStaticMarkup(
      <HomeContent
        {...actions}
        name="Paulo"
        profile="DIRETOR_PATRIMONIO"
        state={{
          setores: null,
          patrimonios: { status: "success", data: 0 },
          inventarios: { status: "success", data: empty },
        }}
      />,
    );

    expect(markup).toContain("Nenhum inventário em andamento");
    expect(markup).toContain("Nenhuma conferência finalizada");
  });

  it("mantém blocos válidos quando setores falha com 403", () => {
    const markup = renderToStaticMarkup(
      <HomeContent
        {...actions}
        name="Ana"
        profile="ADMINISTRADOR"
        state={{
          ...successState,
          setores: {
            status: "error",
            error: new ApiError("http", 403),
          },
        }}
      />,
    );

    expect(markup).toContain("não tem permissão");
    expect(markup).toContain("Tentar novamente");
    expect(markup).toContain("Bens cadastrados");
    expect(markup).toContain(">128<");
    expect(markup).not.toContain("HTTP 403");
  });

  it.each([
    [new ApiError("http", 401), "Sua sessão expirou"],
    [new ApiError("timeout"), "demorou mais que o esperado"],
    [new ApiError("network"), "Verifique sua internet"],
  ])("explica falhas sem exibir zero enganoso", (error, message) => {
    const markup = renderToStaticMarkup(
      <HomeContent
        {...actions}
        name="Ana"
        profile="ADMINISTRADOR"
        state={{
          ...successState,
          patrimonios: { status: "error", error },
        }}
      />,
    );

    expect(markup).toContain(message);
    expect(markup).not.toContain("Total do patrimônio</");
  });
});
