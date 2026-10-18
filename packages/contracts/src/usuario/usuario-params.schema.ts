import * as z from "zod";

export const UsuarioParamsSchema = z.strictObject({
  usuarioId: z.uuid({
    error: "O identificador do usuário deve ser um UUID válido.",
  }),
});

export type UsuarioParamsInput = z.input<typeof UsuarioParamsSchema>;
export type UsuarioParamsData = z.output<typeof UsuarioParamsSchema>;
