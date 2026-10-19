import {
  AlterarEspecieResponseSchema,
  AlterarEspecieSchema,
  ConsultarEspecieResponseSchema,
  CriarEspecieResponseSchema,
  CriarEspecieSchema,
  EspecieParamsSchema,
  ListarEspeciesQuerySchema,
  ListarEspeciesResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class EspecieParamsDto extends createZodDto(EspecieParamsSchema) {}
export class ListarEspeciesQueryDto extends createZodDto(
  ListarEspeciesQuerySchema,
) {}
export class CriarEspecieBodyDto extends createZodDto(CriarEspecieSchema) {}
export class AlterarEspecieBodyDto extends createZodDto(AlterarEspecieSchema) {}

export class ListarEspeciesResponseDto extends createZodDto(
  ListarEspeciesResponseSchema,
) {}
export class CriarEspecieResponseDto extends createZodDto(
  CriarEspecieResponseSchema,
) {}
export class ConsultarEspecieResponseDto extends createZodDto(
  ConsultarEspecieResponseSchema,
) {}
export class AlterarEspecieResponseDto extends createZodDto(
  AlterarEspecieResponseSchema,
) {}
