import * as z from "zod";
import {
  EmailUsuarioSchema,
  NomeUsuarioSchema,
  PerfilUsuarioSchema,
} from "./usuario-fields.schema";

export const AlterarUsuarioSchema = z
  .strictObject({
    nome: NomeUsuarioSchema.optional(),
    email: EmailUsuarioSchema.optional(),
    perfil: PerfilUsuarioSchema.optional(),
  })
  .refine(
    (usuario) => Object.values(usuario).some((valor) => valor !== undefined),
    {
      error: "Informe ao menos um campo para a atualização.",
    },
  );

export type AlterarUsuarioInput = z.input<typeof AlterarUsuarioSchema>;
export type AlterarUsuarioData = z.output<typeof AlterarUsuarioSchema>;
