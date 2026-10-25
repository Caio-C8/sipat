import * as z from "zod";

export const PERFIS_USUARIO = ["ADMINISTRADOR", "DIRETOR_PATRIMONIO"] as const;

export const PerfilUsuarioSchema = z.enum(PERFIS_USUARIO);

export const IdentidadeAutenticadaSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().trim().min(1).max(100),
  email: z.email().max(150),
  perfil: PerfilUsuarioSchema,
  trocaSenhaObrigatoria: z.boolean(),
});

export const CABECALHO_CSRF = "X-SIPAT-CSRF";
export const VALOR_CABECALHO_CSRF = "1";

export type PerfilUsuarioInput = z.input<typeof PerfilUsuarioSchema>;
export type PerfilUsuario = z.output<typeof PerfilUsuarioSchema>;
export type IdentidadeAutenticadaInput = z.input<
  typeof IdentidadeAutenticadaSchema
>;
export type IdentidadeAutenticada = z.output<
  typeof IdentidadeAutenticadaSchema
>;
