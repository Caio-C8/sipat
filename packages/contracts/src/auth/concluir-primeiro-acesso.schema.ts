import * as z from "zod";
import { SenhaSchema } from "./senha.schema";

export const ConcluirPrimeiroAcessoBodySchema = z
  .strictObject({
    novaSenha: SenhaSchema,
    confirmacaoNovaSenha: SenhaSchema,
  })
  .refine(
    ({ novaSenha, confirmacaoNovaSenha }) => novaSenha === confirmacaoNovaSenha,
    {
      error: "A confirmação da nova senha não corresponde à nova senha.",
      path: ["confirmacaoNovaSenha"],
    },
  );

export type ConcluirPrimeiroAcessoBodyInput = z.input<
  typeof ConcluirPrimeiroAcessoBodySchema
>;
export type ConcluirPrimeiroAcessoBody = z.output<
  typeof ConcluirPrimeiroAcessoBodySchema
>;
