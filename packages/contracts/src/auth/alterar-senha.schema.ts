import * as z from "zod";
import { SenhaLoginSchema } from "./login.schema";
import { SenhaSchema } from "./senha.schema";

export const AlterarSenhaBodySchema = z
  .strictObject({
    senhaAtual: SenhaLoginSchema,
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

export type AlterarSenhaBodyInput = z.input<typeof AlterarSenhaBodySchema>;
export type AlterarSenhaBody = z.output<typeof AlterarSenhaBodySchema>;
