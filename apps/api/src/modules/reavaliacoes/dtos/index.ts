import { createZodDto } from "nestjs-zod";
import {
  CriarReavaliacaoBodySchema,
  CriarReavaliacaoResponseSchema,
  ConsultarReavaliacaoResponseSchema,
  ListarOpcoesComissaoReavaliacaoQuerySchema,
  ListarOpcoesComissaoReavaliacaoResponseSchema,
  ListarReavaliacoesQuerySchema,
  ListarReavaliacoesResponseSchema,
  PreviaReavaliacaoBodySchema,
  PreviaReavaliacaoResponseSchema,
  ReavaliacaoParamsSchema,
} from "@repo/contracts";

export class CriarReavaliacaoBodyDto extends createZodDto(
  CriarReavaliacaoBodySchema,
) {}
export class CriarReavaliacaoResponseDto extends createZodDto(
  CriarReavaliacaoResponseSchema,
) {}
export class ConsultarReavaliacaoResponseDto extends createZodDto(
  ConsultarReavaliacaoResponseSchema,
) {}
export class ListarOpcoesComissaoReavaliacaoQueryDto extends createZodDto(
  ListarOpcoesComissaoReavaliacaoQuerySchema,
) {}
export class ListarOpcoesComissaoReavaliacaoResponseDto extends createZodDto(
  ListarOpcoesComissaoReavaliacaoResponseSchema,
) {}
export class ListarReavaliacoesQueryDto extends createZodDto(
  ListarReavaliacoesQuerySchema,
) {}
export class ListarReavaliacoesResponseDto extends createZodDto(
  ListarReavaliacoesResponseSchema,
) {}
export class PreviaReavaliacaoBodyDto extends createZodDto(
  PreviaReavaliacaoBodySchema,
) {}
export class PreviaReavaliacaoResponseDto extends createZodDto(
  PreviaReavaliacaoResponseSchema,
) {}
export class ReavaliacaoParamsDto extends createZodDto(
  ReavaliacaoParamsSchema,
) {}
