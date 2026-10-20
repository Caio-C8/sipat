import {
  AlterarAnexoNotaFiscalResponseSchema,
  AlterarNotaFiscalBodySchema,
  AlterarNotaFiscalResponseSchema,
  ConsultarNotaFiscalResponseSchema,
  CriarNotaFiscalResponseSchema,
  ListarNotasFiscaisQuerySchema,
  ListarNotasFiscaisResponseSchema,
  NotaFiscalParamsSchema,
  RemoverAnexoNotaFiscalResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class NotaFiscalParamsDto extends createZodDto(NotaFiscalParamsSchema) {}
export class ListarNotasFiscaisQueryDto extends createZodDto(
  ListarNotasFiscaisQuerySchema,
) {}
export class AlterarNotaFiscalBodyDto extends createZodDto(
  AlterarNotaFiscalBodySchema,
) {}
export class ListarNotasFiscaisResponseDto extends createZodDto(
  ListarNotasFiscaisResponseSchema,
) {}
export class CriarNotaFiscalResponseDto extends createZodDto(
  CriarNotaFiscalResponseSchema,
) {}
export class ConsultarNotaFiscalResponseDto extends createZodDto(
  ConsultarNotaFiscalResponseSchema,
) {}
export class AlterarNotaFiscalResponseDto extends createZodDto(
  AlterarNotaFiscalResponseSchema,
) {}
export class AlterarAnexoNotaFiscalResponseDto extends createZodDto(
  AlterarAnexoNotaFiscalResponseSchema,
) {}
export class RemoverAnexoNotaFiscalResponseDto extends createZodDto(
  RemoverAnexoNotaFiscalResponseSchema,
) {}
