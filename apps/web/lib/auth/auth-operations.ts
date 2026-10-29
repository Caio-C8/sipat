import {
  AuthMeResponseSchema,
  CABECALHO_CSRF,
  ConcluirPrimeiroAcessoBodySchema,
  LoginBodySchema,
  LoginResponseSchema,
  RedefinirSenhaBodySchema,
  SolicitarRedefinicaoSenhaBodySchema,
  SolicitarRedefinicaoSenhaResponseSchema,
  VALOR_CABECALHO_CSRF,
  type ConcluirPrimeiroAcessoBody,
  type IdentidadeAutenticada,
  type LoginBody,
  type RedefinirSenhaBody,
  type SolicitarRedefinicaoSenhaBody,
  type SolicitarRedefinicaoSenhaResponse,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";

const csrfHeaders = {
  [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF,
} as const;

export function criarOperacoesAuth(apiClient: ApiClient) {
  return {
    async login(body: LoginBody): Promise<IdentidadeAutenticada> {
      const bodyValidado = LoginBodySchema.parse(body);
      const response = await apiClient.request({
        path: "/auth/login",
        method: "POST",
        headers: csrfHeaders,
        body: bodyValidado,
        responseSchema: LoginResponseSchema,
      });

      return response.dados;
    },

    async consultarIdentidade(cookie?: string): Promise<IdentidadeAutenticada> {
      const response = await apiClient.request({
        path: "/auth/me",
        method: "GET",
        cache: "no-store",
        headers: cookie ? { Cookie: cookie } : undefined,
        responseSchema: AuthMeResponseSchema,
      });

      return response.dados;
    },

    async concluirPrimeiroAcesso(
      body: ConcluirPrimeiroAcessoBody,
    ): Promise<void> {
      const bodyValidado = ConcluirPrimeiroAcessoBodySchema.parse(body);

      await apiClient.request({
        path: "/auth/concluir-primeiro-acesso",
        method: "POST",
        headers: csrfHeaders,
        body: bodyValidado,
      });
    },

    async solicitarRedefinicaoSenha(
      body: SolicitarRedefinicaoSenhaBody,
    ): Promise<SolicitarRedefinicaoSenhaResponse> {
      const bodyValidado = SolicitarRedefinicaoSenhaBodySchema.parse(body);

      return apiClient.request({
        path: "/auth/esqueceu-senha",
        method: "POST",
        headers: csrfHeaders,
        body: bodyValidado,
        responseSchema: SolicitarRedefinicaoSenhaResponseSchema,
      });
    },

    async redefinirSenha(body: RedefinirSenhaBody): Promise<void> {
      const bodyValidado = RedefinirSenhaBodySchema.parse(body);

      await apiClient.request({
        path: "/auth/redefinir-senha",
        method: "POST",
        headers: csrfHeaders,
        body: bodyValidado,
      });
    },

    async logout(): Promise<void> {
      await apiClient.request({
        path: "/auth/logout",
        method: "POST",
        headers: csrfHeaders,
      });
    },
  };
}
