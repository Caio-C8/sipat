import {
  AlterarResponsavelResponseSchema,
  AlterarResponsavelSchema,
  AlterarSituacaoResponsavelResponseSchema,
  AlterarSituacaoResponsavelSchema,
  ConsultarResponsavelResponseSchema,
  CriarResponsavelResponseSchema,
  CriarResponsavelSchema,
  ListarResponsaveisQuerySchema,
  ListarResponsaveisResponseSchema,
  ResponsavelParamsSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class ResponsavelParamsDto extends createZodDto(
  ResponsavelParamsSchema,
) {}
export class ListarResponsaveisQueryDto extends createZodDto(
  ListarResponsaveisQuerySchema,
) {}
export class CriarResponsavelBodyDto extends createZodDto(
  CriarResponsavelSchema,
) {}
export class AlterarResponsavelBodyDto extends createZodDto(
  AlterarResponsavelSchema,
) {}
export class AlterarSituacaoResponsavelBodyDto extends createZodDto(
  AlterarSituacaoResponsavelSchema,
) {}

export class ListarResponsaveisResponseDto extends createZodDto(
  ListarResponsaveisResponseSchema,
) {}
export class CriarResponsavelResponseDto extends createZodDto(
  CriarResponsavelResponseSchema,
) {}
export class ConsultarResponsavelResponseDto extends createZodDto(
  ConsultarResponsavelResponseSchema,
) {}
export class AlterarResponsavelResponseDto extends createZodDto(
  AlterarResponsavelResponseSchema,
) {}
export class AlterarSituacaoResponsavelResponseDto extends createZodDto(
  AlterarSituacaoResponsavelResponseSchema,
) {}
