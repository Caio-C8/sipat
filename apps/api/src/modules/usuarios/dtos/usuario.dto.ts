import {
  AlterarSituacaoUsuarioResponseSchema,
  AlterarSituacaoUsuarioSchema,
  AlterarUsuarioResponseSchema,
  AlterarUsuarioSchema,
  ConsultarUsuarioResponseSchema,
  CriarUsuarioResponseSchema,
  CriarUsuarioSchema,
  ListarUsuariosQuerySchema,
  ListarUsuariosResponseSchema,
  UsuarioParamsSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class UsuarioParamsDto extends createZodDto(UsuarioParamsSchema) {}
export class ListarUsuariosQueryDto extends createZodDto(
  ListarUsuariosQuerySchema,
) {}
export class CriarUsuarioBodyDto extends createZodDto(CriarUsuarioSchema) {}
export class AlterarUsuarioBodyDto extends createZodDto(AlterarUsuarioSchema) {}
export class AlterarSituacaoUsuarioBodyDto extends createZodDto(
  AlterarSituacaoUsuarioSchema,
) {}

export class ListarUsuariosResponseDto extends createZodDto(
  ListarUsuariosResponseSchema,
) {}
export class CriarUsuarioResponseDto extends createZodDto(
  CriarUsuarioResponseSchema,
) {}
export class ConsultarUsuarioResponseDto extends createZodDto(
  ConsultarUsuarioResponseSchema,
) {}
export class AlterarUsuarioResponseDto extends createZodDto(
  AlterarUsuarioResponseSchema,
) {}
export class AlterarSituacaoUsuarioResponseDto extends createZodDto(
  AlterarSituacaoUsuarioResponseSchema,
) {}
