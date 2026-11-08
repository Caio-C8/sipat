import {
  ConsultarPatrimonioResponseSchema,
  DashboardPatrimonialResponseSchema,
  CriarPatrimonioBodySchema,
  CriarPatrimonioResponseSchema,
  ListarPatrimoniosQuerySchema,
  ListarPatrimoniosResponseSchema,
  PatrimonioParamsSchema,
  SubstituirNumeroPatrimonialBodySchema,
  SubstituirNumeroPatrimonialResponseSchema,
  ConfirmarDisponibilidadeUsoBodySchema,
  ConfirmarDisponibilidadeUsoResponseSchema,
} from "@repo/contracts";
import type { CriarPatrimonioBodyData } from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

type CriarPatrimonioBodyDtoData = Pick<
  CriarPatrimonioBodyData,
  keyof CriarPatrimonioBodyData
>;

const CriarPatrimonioBodyDtoSchema = CriarPatrimonioBodySchema.transform(
  (dados): CriarPatrimonioBodyDtoData => dados,
);

export class CriarPatrimonioBodyDto extends createZodDto(
  CriarPatrimonioBodyDtoSchema,
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

export class DashboardPatrimonialResponseDto extends createZodDto(
  DashboardPatrimonialResponseSchema,
) {}
export class ConfirmarDisponibilidadeUsoBodyDto extends createZodDto(
  ConfirmarDisponibilidadeUsoBodySchema,
) {}
export class ConfirmarDisponibilidadeUsoResponseDto extends createZodDto(
  ConfirmarDisponibilidadeUsoResponseSchema,
) {}
