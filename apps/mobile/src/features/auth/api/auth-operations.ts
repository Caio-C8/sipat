import {
  MobileConcluirPrimeiroAcessoBodySchema,
  MobileConcluirPrimeiroAcessoResponseSchema,
  MobileLoginBodySchema,
  MobileLoginResponseSchema,
  MobileMeResponseSchema,
  MobileRefreshResponseSchema,
  type MobileConcluirPrimeiroAcessoBody,
  type MobileLoginBody,
  type MobileLoginResponse,
  type MobileRefreshResponse,
  type MobileMeResponse,
  type MobileConcluirPrimeiroAcessoResponse,
} from "@repo/contracts";
import { apiRequest } from "../../../lib/api/api-client";

export function createAuthOperations(baseUrl: string) {
  return {
    async login(body: MobileLoginBody) {
      const validBody = MobileLoginBodySchema.parse(body);
      const response = await apiRequest<MobileLoginResponse>({
        baseUrl,
        path: "/auth/mobile/login",
        method: "POST",
        body: validBody,
        responseSchema: MobileLoginResponseSchema,
      });
      return response.dados;
    },
    async refresh(refreshToken: string) {
      const response = await apiRequest<MobileRefreshResponse>({
        baseUrl,
        path: "/auth/mobile/refresh",
        method: "POST",
        token: refreshToken,
        responseSchema: MobileRefreshResponseSchema,
      });
      return response.dados;
    },
    async me(accessToken: string) {
      const response = await apiRequest<MobileMeResponse>({
        baseUrl,
        path: "/auth/mobile/me",
        method: "GET",
        token: accessToken,
        responseSchema: MobileMeResponseSchema,
      });
      return response.dados;
    },
    async completeFirstAccess(
      accessToken: string,
      body: MobileConcluirPrimeiroAcessoBody,
    ) {
      const validBody = MobileConcluirPrimeiroAcessoBodySchema.parse(body);
      const response = await apiRequest<MobileConcluirPrimeiroAcessoResponse>({
        baseUrl,
        path: "/auth/mobile/concluir-primeiro-acesso",
        method: "POST",
        token: accessToken,
        body: validBody,
        responseSchema: MobileConcluirPrimeiroAcessoResponseSchema,
      });
      return response.dados;
    },
    async logout(refreshToken: string) {
      await apiRequest({
        baseUrl,
        path: "/auth/mobile/logout",
        method: "POST",
        token: refreshToken,
      });
    },
  };
}

export type AuthOperations = ReturnType<typeof createAuthOperations>;
