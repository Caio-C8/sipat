import * as z from "zod";
import { PaginacaoQuerySchema } from "../common";
import { PerfilUsuarioSchema } from "./usuario-fields.schema";

const AtivoQuerySchema = z.stringbool({
  truthy: ["true", "1"],
  falsy: ["false", "0"],
  case: "insensitive",
  error: "O filtro de situação deve ser true, false, 1 ou 0.",
});

export const ListarUsuariosQuerySchema = PaginacaoQuerySchema.extend({
  busca: z
    .string()
    .trim()
    .min(1, { error: "A busca não pode ser vazia." })
    .max(150, { error: "A busca deve possuir no máximo 150 caracteres." })
    .optional(),
  perfil: PerfilUsuarioSchema.optional(),
  ativo: AtivoQuerySchema.optional(),
});

export type ListarUsuariosQueryInput = z.input<
  typeof ListarUsuariosQuerySchema
>;
export type ListarUsuariosQueryData = z.output<
  typeof ListarUsuariosQuerySchema
>;
