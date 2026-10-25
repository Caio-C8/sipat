import {
  ConsultarInventarioResponseSchema,
  CriarInventarioBodySchema,
  CriarInventarioResponseSchema,
  InventarioParamsSchema,
  ListarInventariosQuerySchema,
  ListarInventariosResponseSchema,
  ListarItensInventarioQuerySchema,
  ListarItensInventarioResponseSchema,
  ListarSetoresInventarioQuerySchema,
  ListarSetoresInventarioResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class InventarioParamsDto extends createZodDto(InventarioParamsSchema) {}
export class CriarInventarioBodyDto extends createZodDto(
  CriarInventarioBodySchema,
) {}
export class ListarInventariosQueryDto extends createZodDto(
  ListarInventariosQuerySchema,
) {}
export class ListarSetoresInventarioQueryDto extends createZodDto(
  ListarSetoresInventarioQuerySchema,
) {}
export class ListarItensInventarioQueryDto extends createZodDto(
  ListarItensInventarioQuerySchema,
) {}
export class CriarInventarioResponseDto extends createZodDto(
  CriarInventarioResponseSchema,
) {}
export class ConsultarInventarioResponseDto extends createZodDto(
  ConsultarInventarioResponseSchema,
) {}
export class ListarInventariosResponseDto extends createZodDto(
  ListarInventariosResponseSchema,
) {}
export class ListarSetoresInventarioResponseDto extends createZodDto(
  ListarSetoresInventarioResponseSchema,
) {}
export class ListarItensInventarioResponseDto extends createZodDto(
  ListarItensInventarioResponseSchema,
) {}
