import { createZodDto } from "nestjs-zod";
import {
  CriarMovimentacaoBodySchema,
  MovimentacaoParamsSchema,
  ListarMovimentacoesQuerySchema,
  ListarOpcoesMovimentacaoQuerySchema,
  CriarMovimentacaoResponseSchema,
  ConsultarMovimentacaoResponseSchema,
  ListarMovimentacoesResponseSchema,
  ListarSetoresMovimentacaoResponseSchema,
  ListarComissoesMovimentacaoResponseSchema,
} from "@repo/contracts";
export class CriarMovimentacaoBodyDto extends createZodDto(
  CriarMovimentacaoBodySchema,
) {}
export class MovimentacaoParamsDto extends createZodDto(
  MovimentacaoParamsSchema,
) {}
export class ListarMovimentacoesQueryDto extends createZodDto(
  ListarMovimentacoesQuerySchema,
) {}
export class ListarOpcoesMovimentacaoQueryDto extends createZodDto(
  ListarOpcoesMovimentacaoQuerySchema,
) {}
export class CriarMovimentacaoResponseDto extends createZodDto(
  CriarMovimentacaoResponseSchema,
) {}
export class ConsultarMovimentacaoResponseDto extends createZodDto(
  ConsultarMovimentacaoResponseSchema,
) {}
export class ListarMovimentacoesResponseDto extends createZodDto(
  ListarMovimentacoesResponseSchema,
) {}
export class ListarSetoresMovimentacaoResponseDto extends createZodDto(
  ListarSetoresMovimentacaoResponseSchema,
) {}
export class ListarComissoesMovimentacaoResponseDto extends createZodDto(
  ListarComissoesMovimentacaoResponseSchema,
) {}
