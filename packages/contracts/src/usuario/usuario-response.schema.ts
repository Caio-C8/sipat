import * as z from "zod";
import {
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";
import { PerfilUsuarioSchema } from "./usuario-fields.schema";

const DateTimeUtcResponseSchema = z.iso.datetime({ precision: 3 });

export const UsuarioResumoSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().min(1).max(100),
  email: z.email().max(150),
  perfil: PerfilUsuarioSchema,
  ativo: z.boolean(),
  createdAt: DateTimeUtcResponseSchema,
  updatedAt: DateTimeUtcResponseSchema.nullable(),
});

export const UsuarioDetalheSchema = UsuarioResumoSchema.extend({
  createdById: z.uuid().nullable(),
});

export const ListarUsuariosResponseSchema =
  criarRespostaSucessoPaginadaSchema(UsuarioResumoSchema);
export const CriarUsuarioResponseSchema =
  criarRespostaSucessoSchema(UsuarioDetalheSchema);
export const ConsultarUsuarioResponseSchema =
  criarRespostaSucessoSchema(UsuarioDetalheSchema);
export const AlterarUsuarioResponseSchema =
  criarRespostaSucessoSchema(UsuarioDetalheSchema);
export const AlterarSituacaoUsuarioResponseSchema =
  criarRespostaSucessoSchema(UsuarioDetalheSchema);

export type UsuarioResumo = z.output<typeof UsuarioResumoSchema>;
export type UsuarioDetalhe = z.output<typeof UsuarioDetalheSchema>;
export type ListarUsuariosResponse = z.output<
  typeof ListarUsuariosResponseSchema
>;
export type CriarUsuarioResponse = z.output<typeof CriarUsuarioResponseSchema>;
export type ConsultarUsuarioResponse = z.output<
  typeof ConsultarUsuarioResponseSchema
>;
export type AlterarUsuarioResponse = z.output<
  typeof AlterarUsuarioResponseSchema
>;
export type AlterarSituacaoUsuarioResponse = z.output<
  typeof AlterarSituacaoUsuarioResponseSchema
>;
