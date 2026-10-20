import {
  AlterarProcessoCompraBodySchema,
  AlterarProcessoCompraResponseSchema,
  ConsultarProcessoCompraResponseSchema,
  CriarProcessoCompraResponseSchema,
  ListarProcessosCompraQuerySchema,
  ListarProcessosCompraResponseSchema,
  ProcessoCompraParamsSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class ProcessoCompraParamsDto extends createZodDto(
  ProcessoCompraParamsSchema,
) {}
export class ListarProcessosCompraQueryDto extends createZodDto(
  ListarProcessosCompraQuerySchema,
) {}
export class AlterarProcessoCompraBodyDto extends createZodDto(
  AlterarProcessoCompraBodySchema,
) {}
export class ListarProcessosCompraResponseDto extends createZodDto(
  ListarProcessosCompraResponseSchema,
) {}
export class CriarProcessoCompraResponseDto extends createZodDto(
  CriarProcessoCompraResponseSchema,
) {}
export class ConsultarProcessoCompraResponseDto extends createZodDto(
  ConsultarProcessoCompraResponseSchema,
) {}
export class AlterarProcessoCompraResponseDto extends createZodDto(
  AlterarProcessoCompraResponseSchema,
) {}
