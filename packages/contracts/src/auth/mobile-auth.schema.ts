import * as z from "zod";
import { criarRespostaSucessoSchema } from "../common";
import { ConcluirPrimeiroAcessoBodySchema } from "./concluir-primeiro-acesso.schema";
import { IdentidadeAutenticadaSchema } from "./identidade-autenticada.schema";
import { LoginBodySchema } from "./login.schema";

export const TokenMobileSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "Token mobile inválido.");

export const CredenciaisMobileSchema = z.strictObject({
  accessToken: TokenMobileSchema,
  refreshToken: TokenMobileSchema,
  accessTokenExpiraEm: z.iso.datetime({ precision: 3 }),
  sessaoExpiraEm: z.iso.datetime({ precision: 3 }),
});

export const MobileLoginBodySchema = LoginBodySchema;
export const MobileConcluirPrimeiroAcessoBodySchema =
  ConcluirPrimeiroAcessoBodySchema;

export const MobileLoginResponseSchema = criarRespostaSucessoSchema(
  z.strictObject({
    identidade: IdentidadeAutenticadaSchema,
    credenciais: CredenciaisMobileSchema,
  }),
);

export const MobileRefreshResponseSchema = criarRespostaSucessoSchema(
  CredenciaisMobileSchema,
);

export const MobileMeResponseSchema = criarRespostaSucessoSchema(
  IdentidadeAutenticadaSchema,
);

export const MobileConcluirPrimeiroAcessoResponseSchema =
  MobileLoginResponseSchema;

export type MobileLoginBody = z.output<typeof MobileLoginBodySchema>;
export type CredenciaisMobile = z.output<typeof CredenciaisMobileSchema>;
export type MobileLoginResponse = z.output<typeof MobileLoginResponseSchema>;
export type MobileRefreshResponse = z.output<
  typeof MobileRefreshResponseSchema
>;
export type MobileMeResponse = z.output<typeof MobileMeResponseSchema>;
export type MobileConcluirPrimeiroAcessoBody = z.output<
  typeof MobileConcluirPrimeiroAcessoBodySchema
>;
export type MobileConcluirPrimeiroAcessoResponse = z.output<
  typeof MobileConcluirPrimeiroAcessoResponseSchema
>;
