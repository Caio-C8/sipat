import { createZodDto } from "nestjs-zod";
import {
  AtualizarOrcamentoManutencaoBodySchema,
  AtualizarOrcamentoManutencaoResponseSchema,
  ConsultarManutencaoResponseSchema,
  CriarManutencaoBodySchema,
  CriarManutencaoResponseSchema,
  DocumentoManutencaoParamsSchema,
  EnviarDocumentoManutencaoResponseSchema,
  ItemManutencaoParamsSchema,
  ListarComissoesManutencaoQuerySchema,
  ListarComissoesManutencaoResponseSchema,
  ListarFornecedoresManutencaoQuerySchema,
  ListarFornecedoresManutencaoResponseSchema,
  ListarManutencoesQuerySchema,
  ListarManutencoesResponseSchema,
  ManutencaoParamsSchema,
  RegistrarRetornoManutencaoBodySchema,
  RegistrarRetornoManutencaoResponseSchema,
} from "@repo/contracts";

export class CriarManutencaoBodyDto extends createZodDto(
  CriarManutencaoBodySchema,
) {}
export class AtualizarOrcamentoManutencaoBodyDto extends createZodDto(
  AtualizarOrcamentoManutencaoBodySchema,
) {}
export class RegistrarRetornoManutencaoBodyDto extends createZodDto(
  RegistrarRetornoManutencaoBodySchema,
) {}
export class ManutencaoParamsDto extends createZodDto(ManutencaoParamsSchema) {}
export class ItemManutencaoParamsDto extends createZodDto(
  ItemManutencaoParamsSchema,
) {}
export class DocumentoManutencaoParamsDto extends createZodDto(
  DocumentoManutencaoParamsSchema,
) {}
export class ListarManutencoesQueryDto extends createZodDto(
  ListarManutencoesQuerySchema,
) {}
export class ListarFornecedoresManutencaoQueryDto extends createZodDto(
  ListarFornecedoresManutencaoQuerySchema,
) {}
export class ListarComissoesManutencaoQueryDto extends createZodDto(
  ListarComissoesManutencaoQuerySchema,
) {}
export class CriarManutencaoResponseDto extends createZodDto(
  CriarManutencaoResponseSchema,
) {}
export class ConsultarManutencaoResponseDto extends createZodDto(
  ConsultarManutencaoResponseSchema,
) {}
export class ListarManutencoesResponseDto extends createZodDto(
  ListarManutencoesResponseSchema,
) {}
export class AtualizarOrcamentoManutencaoResponseDto extends createZodDto(
  AtualizarOrcamentoManutencaoResponseSchema,
) {}
export class RegistrarRetornoManutencaoResponseDto extends createZodDto(
  RegistrarRetornoManutencaoResponseSchema,
) {}
export class EnviarDocumentoManutencaoResponseDto extends createZodDto(
  EnviarDocumentoManutencaoResponseSchema,
) {}
export class ListarFornecedoresManutencaoResponseDto extends createZodDto(
  ListarFornecedoresManutencaoResponseSchema,
) {}
export class ListarComissoesManutencaoResponseDto extends createZodDto(
  ListarComissoesManutencaoResponseSchema,
) {}
