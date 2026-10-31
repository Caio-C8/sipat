import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../lib/api/api-error";
import {
  CreatePatrimonioScreen,
  RestrictedCreatePatrimonio,
  createPatrimonioCatalogErrorMessage,
  createPatrimonioErrorMessage,
} from "./create-patrimonio-screen";

const authorizedRequest = vi.fn();

vi.mock("@react-native-vector-icons/lucide", () => ({
  Lucide: ({ name }: { name: string }) => <span data-icon={name} />,
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("../../../config/public-app-config", () => ({
  publicAppConfig: { apiBaseUrl: "https://api.test" },
}));
vi.mock("../../auth/session/session-context", () => ({
  useSession: () => ({
    manager: { authorizedRequest },
    state: {
      status: "authenticated",
      identity: {
        id: "11111111-1111-4111-8111-111111111111",
        nome: "Ana",
        email: "ana@example.test",
        perfil: "ADMINISTRADOR",
        trocaSenhaObrigatoria: false,
      },
    },
  }),
}));

describe("cadastro restrito", () => {
  it("é informativo e não apresenta formulário", () => {
    const markup = renderToStaticMarkup(
      <RestrictedCreatePatrimonio onConsult={vi.fn()} />,
    );
    expect(markup).toContain("Cadastro restrito");
    expect(markup).toContain("Somente o Diretor de Patrimônio");
    expect(markup).toContain("Consultar bens");
    expect(markup).not.toContain("Descrição *");
  });

  it("aplica o gate antes de instanciar catálogos", () => {
    authorizedRequest.mockClear();
    const markup = renderToStaticMarkup(<CreatePatrimonioScreen />);
    expect(markup).toContain("Cadastro restrito");
    expect(markup).not.toContain("Carregando opções");
    expect(authorizedRequest).not.toHaveBeenCalled();
  });

  it.each([
    [new ApiError("timeout"), "demorou"],
    [new ApiError("network"), "Sem conexão"],
    [new ApiError("invalid-response"), "Não foi possível confirmar"],
    [new ApiError("http", 401), "sessão expirou"],
    [new ApiError("http", 403), "não tem permissão"],
    [new ApiError("http", 409, "NUMERO_SERIE_JA_EXISTENTE"), "número de série"],
    [new ApiError("http", 400, "SETOR_INATIVO"), "foi inativado"],
  ])("distingue erros recuperáveis e de autorização", (error, message) => {
    expect(createPatrimonioErrorMessage(error)).toContain(message);
  });

  it.each([
    ["species", "as espécies"],
    ["sectors", "os setores"],
    ["processes", "os processos de compra"],
  ] as const)(
    "não apresenta falha de consulta a %s como falta de permissão para cadastrar",
    (catalog, label) => {
      const message = createPatrimonioCatalogErrorMessage(
        catalog,
        new ApiError("http", 403),
      );
      expect(message).toContain(`consultar ${label}`);
      expect(message).not.toContain("cadastrar patrimônios");
    },
  );
});
