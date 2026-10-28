import type { PerfilUsuario } from "@repo/contracts";

export type MobileRouteAccess =
  "anonymous" | "authenticated" | "first-access" | "development";

export type MobileRouteState = "implemented" | "shell";

export type MobileRouteCatalogItem = Readonly<{
  path: `/${string}` | "/";
  title: string;
  description: string;
  access: MobileRouteAccess;
  profiles: readonly PerfilUsuario[];
  state: MobileRouteState;
}>;

const ALL_PROFILES = [
  "ADMINISTRADOR",
  "DIRETOR_PATRIMONIO",
] as const satisfies readonly PerfilUsuario[];

export const mobileRouteCatalog = {
  home: {
    path: "/",
    title: "Início",
    description: "Home autenticada integrada por perfil.",
    access: "authenticated",
    profiles: ALL_PROFILES,
    state: "implemented",
  },
  patrimonios: {
    path: "/bens",
    title: "Bens",
    description: "Listagem, busca, filtros e paginação de patrimônios.",
    access: "authenticated",
    profiles: ALL_PROFILES,
    state: "implemented",
  },
  patrimonioDetail: {
    path: "/bens/[patrimonioId]",
    title: "Detalhe do bem",
    description: "Dados e valores atuais de um patrimônio.",
    access: "authenticated",
    profiles: ALL_PROFILES,
    state: "implemented",
  },
  login: {
    path: "/login",
    title: "Login",
    description: "Entrada para usuários autorizados.",
    access: "anonymous",
    profiles: ALL_PROFILES,
    state: "implemented",
  },
  resetPassword: {
    path: "/redefinir-senha",
    title: "Primeiro acesso",
    description: "Troca obrigatória da senha inicial.",
    access: "first-access",
    profiles: ALL_PROFILES,
    state: "implemented",
  },
  passwordUpdated: {
    path: "/senha-atualizada",
    title: "Senha atualizada",
    description: "Confirmação da conclusão do primeiro acesso.",
    access: "authenticated",
    profiles: ALL_PROFILES,
    state: "implemented",
  },
  check: {
    path: "/check",
    title: "Verificações",
    description: "Runtime, configuração pública e conexão com a API.",
    access: "development",
    profiles: [],
    state: "implemented",
  },
} as const satisfies Record<string, MobileRouteCatalogItem>;

export const mobileRoutes = Object.values(mobileRouteCatalog);

export const appRoutes = {
  check: mobileRouteCatalog.check.path,
  home: mobileRouteCatalog.home.path,
  patrimonios: mobileRouteCatalog.patrimonios.path,
  patrimonioDetail: mobileRouteCatalog.patrimonioDetail.path,
  login: mobileRouteCatalog.login.path,
  resetPassword: mobileRouteCatalog.resetPassword.path,
  passwordUpdated: mobileRouteCatalog.passwordUpdated.path,
} as const;
