import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MobileLoginBodySchema,
  MobileLoginResponseSchema,
  MobileRefreshResponseSchema,
} from "../mobile-auth.schema";

const token = "A".repeat(43);
const credenciais = {
  accessToken: token,
  refreshToken: token,
  accessTokenExpiraEm: "2026-10-27T12:10:00.000Z",
  sessaoExpiraEm: "2026-10-27T20:00:00.000Z",
};

describe("contratos de autenticação mobile", () => {
  it("mantém o login estrito e aceita credenciais opacas válidas", () => {
    assert.equal(
      MobileLoginBodySchema.safeParse({
        email: "usuario@example.com",
        senha: "senha",
        dispositivo: "não contratado",
      }).success,
      false,
    );
    assert.equal(
      MobileLoginResponseSchema.safeParse({
        status: 200,
        sucesso: true,
        mensagem: "Autenticação realizada com sucesso.",
        dados: {
          identidade: {
            id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
            nome: "Maria",
            email: "maria@example.com",
            perfil: "ADMINISTRADOR",
            trocaSenhaObrigatoria: false,
          },
          credenciais,
        },
      }).success,
      true,
    );
  });

  it("rejeita token fora do formato e campos extras no refresh", () => {
    assert.equal(
      MobileRefreshResponseSchema.safeParse({
        status: 200,
        sucesso: true,
        mensagem: "Sessão renovada com sucesso.",
        dados: { ...credenciais, accessToken: "curto", usuarioId: "x" },
      }).success,
      false,
    );
  });
});
