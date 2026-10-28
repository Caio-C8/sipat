import { describe, expect, it } from "vitest";
import { appRoutes, mobileRoutes } from "./routes";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<unknown>>;
  }
}

const routeModules = import.meta.glob("../../app/**/*.{ts,tsx}");

function routePathFromModule(modulePath: string): string | null {
  const appRelativePath = modulePath
    .replace(/^\.\.\/\.\.\/app\//, "")
    .split("/")
    .filter((segment: string) => !/^\(.+\)$/.test(segment))
    .join("/");

  if (
    !/\.(?:ts|tsx)$/.test(appRelativePath) ||
    /(?:^|\/)[_+][^/]+\.(?:ts|tsx)$/.test(appRelativePath) ||
    /\.test\.(?:ts|tsx)$/.test(appRelativePath)
  ) {
    return null;
  }

  const withoutExtension = appRelativePath.replace(/\.(?:ts|tsx)$/, "");
  const withoutIndex = withoutExtension.replace(/(?:^|\/)index$/, "");
  return withoutIndex ? `/${withoutIndex}` : "/";
}

describe("catálogo de rotas mobile", () => {
  it("mantém os aliases a partir do catálogo único", () => {
    expect(appRoutes).toEqual({
      check: "/check",
      home: "/",
      patrimonioDetail: "/bens/[patrimonioId]",
      patrimonios: "/bens",
      login: "/login",
      resetPassword: "/redefinir-senha",
      passwordUpdated: "/senha-atualizada",
    });
  });

  it("descreve todas as rotas realmente criadas, sem entradas extras", () => {
    const implementedRoutes = Object.keys(routeModules)
      .map(routePathFromModule)
      .filter((path): path is string => path !== null)
      .sort();
    const catalogRoutes = mobileRoutes.map((route) => route.path).sort();

    expect(catalogRoutes).toEqual(implementedRoutes);
  });

  it("informa acesso, perfis e estado de cada rota", () => {
    for (const route of mobileRoutes) {
      expect(route.title).not.toHaveLength(0);
      expect(route.access).toBeTruthy();
      expect(route.state).toBeTruthy();
      expect(Array.isArray(route.profiles)).toBe(true);
    }
  });
});
