import {
  ConsultarPatrimonioResponseSchema,
  CriarPatrimonioBodySchema,
  CriarPatrimonioResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  PatrimonioParamsSchema,
  SubstituirNumeroPatrimonialBodySchema,
  SubstituirNumeroPatrimonialResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class CriarPatrimonioBodyDto extends createZodDto(
  CriarPatrimonioBodySchema,
) {}

export class CriarPatrimonioResponseDto extends createZodDto(
  CriarPatrimonioResponseSchema,
) {}

export class PatrimonioParamsDto extends createZodDto(PatrimonioParamsSchema) {}
export class ListarPatrimoniosQueryDto extends createZodDto(
  ListarPatrimoniosQuerySchema,
) {}
export class ListarPatrimoniosResponseDto extends createZodDto(
  ListarPatrimoniosResponseSchema,
) {}
export class ConsultarPatrimonioResponseDto extends createZodDto(
  ConsultarPatrimonioResponseSchema,
) {}
export class SubstituirNumeroPatrimonialBodyDto extends createZodDto(
  SubstituirNumeroPatrimonialBodySchema,
) {}
export class SubstituirNumeroPatrimonialResponseDto extends createZodDto(
  SubstituirNumeroPatrimonialResponseSchema,
) {}
