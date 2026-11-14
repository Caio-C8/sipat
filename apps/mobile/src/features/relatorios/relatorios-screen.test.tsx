import {
  LimitesRelatorios,
  titulosRelatorios,
  type CatalogoRelatoriosResponse,
} from "@repo/contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api/api-error";
import { RelatoriosContent } from "./relatorios-screen";

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("../auth/session/session-context", () => ({ useSession: vi.fn() }));
vi.mock("./use-relatorios", () => ({
  relatorioErrorMessage: (error: { kind: string; status?: number }) => {
    if (error.status === 401) return "Sua sessão expirou.";
    if (error.status === 403)
      return "Seu perfil não tem permissão para consultar relatórios.";
    if (error.kind === "timeout")
      return "A consulta demorou mais que o esperado.";
    if (error.kind === "network")
      return "Sem conexão. Verifique sua internet e tente novamente.";
    return "Não foi possível carregar os relatórios.";
  },
  useRelatoriosCatalog: vi.fn(),
}));

function catalog(): CatalogoRelatoriosResponse {
  return {
    status: 200,
    sucesso: true,
    mensagem: "Catálogo de relatórios.",
    dados: {
      tipos: Object.entries(titulosRelatorios).map(([tipo, titulo]) => ({
        tipo: tipo as keyof typeof titulosRelatorios,
        titulo,
        disponivel: tipo !== "baixas",
        motivo:
          tipo === "baixas" ? "Emissão temporariamente indisponível." : null,
        previa: tipo !== "ficha-bem",
        pdf: true,
      })),
      limites: LimitesRelatorios,
    },
  };
}

describe("RelatoriosContent", () => {
  it("renderiza somente as dez opções recebidas e suas capacidades reais", () => {
    const markup = renderToStaticMarkup(
      <RelatoriosContent
        onRetry={vi.fn()}
        state={{ status: "success", data: catalog() }}
      />,
    );

    expect(markup).toContain("10 modelos");
    for (const title of Object.values(titulosRelatorios)) {
      expect(markup).toContain(title);
    }
    expect(markup).toContain("Pendências por bem, setor e competência.");
    expect(markup).toContain("Emissão temporariamente indisponível.");
    expect(markup).toContain("Indisponível");
    expect(markup).toContain("Prévia");
    expect(markup).toContain("PDF");
  });

  it("expõe loading acessível sem desmontar a composição", () => {
    const markup = renderToStaticMarkup(
      <RelatoriosContent onRetry={vi.fn()} state={{ status: "loading" }} />,
    );

    expect(markup).toContain("Carregando catálogo de relatórios");
    expect(markup).toContain("Consultando relatórios");
    expect(markup).toContain("SIPAT · Relatórios patrimoniais");
  });

  it.each([
    [new ApiError("network"), "Verifique sua internet", true],
    [new ApiError("timeout"), "demorou mais que o esperado", true],
    [new ApiError("http", 401), "Sua sessão expirou", false],
    [new ApiError("http", 403), "não tem permissão", false],
  ])("distingue erros públicos e retry", (error, message, canRetry) => {
    const markup = renderToStaticMarkup(
      <RelatoriosContent
        onRetry={vi.fn()}
        state={{ status: "error", error }}
      />,
    );

    expect(markup).toContain(message);
    expect(markup.includes("Tentar novamente")).toBe(canRetry);
  });
});
