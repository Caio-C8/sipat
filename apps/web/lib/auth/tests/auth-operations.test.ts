import { describe, expect, it, vi } from "vitest";
import {
  AuthMeResponseSchema,
  CABECALHO_CSRF,
  LoginResponseSchema,
  SolicitarRedefinicaoSenhaResponseSchema,
  VALOR_CABECALHO_CSRF,
} from "@repo/contracts";
import type { ApiClient } from "@/lib/api/core/types";
import { criarOperacoesAuth } from "../auth-operations";

const identidade = {
  id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
  nome: "Maria da Silva",
  email: "maria@example.com",
  perfil: "ADMINISTRADOR" as const,
  trocaSenhaObrigatoria: false,
};

function clienteComResposta(response: unknown) {
  const request = vi.fn().mockResolvedValue(response);
  const apiClient = { request } as unknown as ApiClient;

  return { request, auth: criarOperacoesAuth(apiClient) };
}

describe("operações de autenticação", () => {
  it("envia login com CSRF e valida a response tipada", async () => {
    const response = {
      status: 200,
      sucesso: true,
      mensagem: "Autenticação realizada com sucesso.",
      dados: identidade,
    };
    const { auth, request } = clienteComResposta(response);

    await expect(
      auth.login({ email: "maria@example.com", senha: "senha inicial" }),
    ).resolves.toEqual(identidade);
    expect(request).toHaveBeenCalledWith({
      path: "/auth/login",
      method: "POST",
      headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
      body: { email: "maria@example.com", senha: "senha inicial" },
      responseSchema: LoginResponseSchema,
    });
  });

  it("encaminha cookie explicitamente e desabilita cache em /auth/me", async () => {
    const { auth, request } = clienteComResposta({
      status: 200,
      sucesso: true,
      mensagem: "Identidade consultada.",
      dados: identidade,
    });

    await expect(
      auth.consultarIdentidade("sipat_session=segredo"),
    ).resolves.toEqual(identidade);
    expect(request).toHaveBeenCalledWith({
      path: "/auth/me",
      method: "GET",
      cache: "no-store",
      headers: { Cookie: "sipat_session=segredo" },
      responseSchema: AuthMeResponseSchema,
    });
  });

  it("envia conclusão e logout como mutações sem contrato de body na resposta", async () => {
    const { auth, request } = clienteComResposta(undefined);
    const novaSenha = "uma nova senha segura 1!";

    await auth.concluirPrimeiroAcesso({
      novaSenha,
      confirmacaoNovaSenha: novaSenha,
    });
    await auth.logout();

    expect(request).toHaveBeenNthCalledWith(1, {
      path: "/auth/concluir-primeiro-acesso",
      method: "POST",
      headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
      body: { novaSenha, confirmacaoNovaSenha: novaSenha },
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: "/auth/logout",
      method: "POST",
      headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
    });
  });

  it("solicita recuperação com response neutra e conclui sem esperar body", async () => {
    const respostaNeutra = {
      status: 202,
      sucesso: true,
      mensagem:
        "Se houver uma conta elegível, enviaremos as instruções para redefinir a senha.",
    } as const;
    const request = vi
      .fn()
      .mockResolvedValueOnce(respostaNeutra)
      .mockResolvedValueOnce(undefined);
    const auth = criarOperacoesAuth({ request } as unknown as ApiClient);
    const token = "A".repeat(43);
    const novaSenha = "uma nova senha segura 1!";

    await expect(
      auth.solicitarRedefinicaoSenha({ email: "  MARIA@EXAMPLE.COM  " }),
    ).resolves.toEqual(respostaNeutra);
    await auth.redefinirSenha({
      token,
      novaSenha,
      confirmacaoNovaSenha: novaSenha,
    });

    expect(request).toHaveBeenNthCalledWith(1, {
      path: "/auth/esqueceu-senha",
      method: "POST",
      headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
      body: { email: "maria@example.com" },
      responseSchema: SolicitarRedefinicaoSenhaResponseSchema,
    });
    expect(request).toHaveBeenNthCalledWith(2, {
      path: "/auth/redefinir-senha",
      method: "POST",
      headers: { [CABECALHO_CSRF]: VALOR_CABECALHO_CSRF },
      body: { token, novaSenha, confirmacaoNovaSenha: novaSenha },
    });
  });
});
