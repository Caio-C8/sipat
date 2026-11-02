import {
  BaixarPatrimonioResponseSchema,
  ConsultarBaixaPatrimonioResponseSchema,
  ListarOpcoesComissoesBaixaQuerySchema,
  ListarOpcoesComissoesBaixaResponseSchema,
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
export class ListarOpcoesComissoesBaixaQueryDto extends createZodDto(
  ListarOpcoesComissoesBaixaQuerySchema,
) {}
export class ListarOpcoesComissoesBaixaResponseDto extends createZodDto(
  ListarOpcoesComissoesBaixaResponseSchema,
) {}
