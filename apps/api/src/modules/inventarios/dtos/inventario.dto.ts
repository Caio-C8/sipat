import {
  ConcluirSetorInventarioBodySchema,
  ConcluirSetorInventarioResponseSchema,
  ConsultarInventarioResponseSchema,
  CorrigirItemInventarioResponseSchema,
  CriarInventarioBodySchema,
  CriarInventarioResponseSchema,
  FinalizarInventarioBodySchema,
  FinalizarInventarioResponseSchema,
  IniciarSetorInventarioBodySchema,
  IniciarSetorInventarioResponseSchema,
  InventarioParamsSchema,
  ItemInventarioParamsSchema,
  ListarInventariosQuerySchema,
  ListarInventariosResponseSchema,
  ListarItensInventarioQuerySchema,
  ListarItensInventarioResponseSchema,
  ListarSetoresInventarioQuerySchema,
  ListarSetoresInventarioResponseSchema,
  SetorInventarioParamsSchema,
  TextoLongoInventarioSchema,
  TipoCorrecaoItemInventarioSchema,
  VerificarItemInventarioBodySchema,
  VerificarItemInventarioResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";
import * as z from "zod";

const CorrigirItemInventarioDtoSchema = z.strictObject({
  tipoCorrecao: TipoCorrecaoItemInventarioSchema,
  observacao: TextoLongoInventarioSchema.optional(),
});

export class InventarioParamsDto extends createZodDto(InventarioParamsSchema) {}
export class SetorInventarioParamsDto extends createZodDto(
  SetorInventarioParamsSchema,
) {}
export class ItemInventarioParamsDto extends createZodDto(
  ItemInventarioParamsSchema,
) {}
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
export class IniciarSetorInventarioBodyDto extends createZodDto(
  IniciarSetorInventarioBodySchema,
) {}
export class VerificarItemInventarioBodyDto extends createZodDto(
  VerificarItemInventarioBodySchema,
) {}
export class CorrigirItemInventarioBodyDto extends createZodDto(
  CorrigirItemInventarioDtoSchema,
) {}
export class ConcluirSetorInventarioBodyDto extends createZodDto(
  ConcluirSetorInventarioBodySchema,
) {}
export class FinalizarInventarioBodyDto extends createZodDto(
  FinalizarInventarioBodySchema,
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
export class IniciarSetorInventarioResponseDto extends createZodDto(
  IniciarSetorInventarioResponseSchema,
) {}
export class VerificarItemInventarioResponseDto extends createZodDto(
  VerificarItemInventarioResponseSchema,
) {}
export class CorrigirItemInventarioResponseDto extends createZodDto(
  CorrigirItemInventarioResponseSchema,
) {}
export class ConcluirSetorInventarioResponseDto extends createZodDto(
  ConcluirSetorInventarioResponseSchema,
) {}
export class FinalizarInventarioResponseDto extends createZodDto(
  FinalizarInventarioResponseSchema,
) {}
