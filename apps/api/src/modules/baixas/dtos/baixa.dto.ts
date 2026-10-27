import {
  BaixarPatrimonioResponseSchema,
  ConsultarBaixaPatrimonioResponseSchema,
  PatrimonioParamsSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class BaixaPatrimonioParamsDto extends createZodDto(
  PatrimonioParamsSchema,
) {}
export class BaixarPatrimonioResponseDto extends createZodDto(
  BaixarPatrimonioResponseSchema,
) {}
export class ConsultarBaixaPatrimonioResponseDto extends createZodDto(
  ConsultarBaixaPatrimonioResponseSchema,
) {}
