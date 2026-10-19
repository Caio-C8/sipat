import {
  AlterarNaturezaResponseSchema,
  AlterarNaturezaSchema,
  ConsultarNaturezaResponseSchema,
  CriarNaturezaResponseSchema,
  CriarNaturezaSchema,
  ListarNaturezasQuerySchema,
  ListarNaturezasResponseSchema,
  NaturezaParamsSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class NaturezaParamsDto extends createZodDto(NaturezaParamsSchema) {}
export class ListarNaturezasQueryDto extends createZodDto(
  ListarNaturezasQuerySchema,
) {}
export class CriarNaturezaBodyDto extends createZodDto(CriarNaturezaSchema) {}
export class AlterarNaturezaBodyDto extends createZodDto(
  AlterarNaturezaSchema,
) {}

export class ListarNaturezasResponseDto extends createZodDto(
  ListarNaturezasResponseSchema,
) {}
export class CriarNaturezaResponseDto extends createZodDto(
  CriarNaturezaResponseSchema,
) {}
export class ConsultarNaturezaResponseDto extends createZodDto(
  ConsultarNaturezaResponseSchema,
) {}
export class AlterarNaturezaResponseDto extends createZodDto(
  AlterarNaturezaResponseSchema,
) {}
