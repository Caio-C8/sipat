import * as z from "zod";
import {
  EmailUsuarioSchema,
  NomeUsuarioSchema,
  PerfilUsuarioSchema,
  SenhaInicialUsuarioSchema,
} from "./usuario-fields.schema";

export const CriarUsuarioSchema = z.strictObject({
  nome: NomeUsuarioSchema,
  email: EmailUsuarioSchema,
  senha: SenhaInicialUsuarioSchema,
  perfil: PerfilUsuarioSchema,
});

export type CriarUsuarioInput = z.input<typeof CriarUsuarioSchema>;
export type CriarUsuarioData = z.output<typeof CriarUsuarioSchema>;
