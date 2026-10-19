import {
  AlterarSetorResponseSchema,
  AlterarSetorSchema,
  AlterarSituacaoSetorResponseSchema,
  AlterarSituacaoSetorSchema,
  ConsultarSetorResponseSchema,
  CriarSetorResponseSchema,
  CriarSetorSchema,
  ListarSetoresQuerySchema,
  ListarSetoresResponseSchema,
  SetorParamsSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class SetorParamsDto extends createZodDto(SetorParamsSchema) {}
export class ListarSetoresQueryDto extends createZodDto(
  ListarSetoresQuerySchema,
) {}
export class CriarSetorBodyDto extends createZodDto(CriarSetorSchema) {}
export class AlterarSetorBodyDto extends createZodDto(AlterarSetorSchema) {}
export class AlterarSituacaoSetorBodyDto extends createZodDto(
  AlterarSituacaoSetorSchema,
) {}

export class ListarSetoresResponseDto extends createZodDto(
  ListarSetoresResponseSchema,
) {}
export class CriarSetorResponseDto extends createZodDto(
  CriarSetorResponseSchema,
) {}
export class ConsultarSetorResponseDto extends createZodDto(
  ConsultarSetorResponseSchema,
) {}
export class AlterarSetorResponseDto extends createZodDto(
  AlterarSetorResponseSchema,
) {}
export class AlterarSituacaoSetorResponseDto extends createZodDto(
  AlterarSituacaoSetorResponseSchema,
) {}
