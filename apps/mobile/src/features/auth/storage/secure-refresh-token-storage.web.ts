import type { RefreshTokenStorage } from "./refresh-token-storage";

// O preview Web não persiste Bearer. Testes podem injetar um adapter controlado.
export const refreshTokenStorage: RefreshTokenStorage = {
  async read() {
    return null;
  },
  async write() {
    throw new Error(
      "A autenticação Bearer persistida não está disponível no navegador.",
    );
  },
  async remove() {},
};
