import {
  AlterarFornecedorResponseSchema,
  AlterarFornecedorSchema,
  AlterarSituacaoFornecedorResponseSchema,
  AlterarSituacaoFornecedorSchema,
  ConsultarFornecedorResponseSchema,
  CriarFornecedorResponseSchema,
  CriarFornecedorSchema,
  FornecedorParamsSchema,
  ListarFornecedoresQuerySchema,
  ListarFornecedoresResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class FornecedorParamsDto extends createZodDto(FornecedorParamsSchema) {}
export class ListarFornecedoresQueryDto extends createZodDto(
  ListarFornecedoresQuerySchema,
) {}
export class CriarFornecedorBodyDto extends createZodDto(
  CriarFornecedorSchema,
) {}
export class AlterarFornecedorBodyDto extends createZodDto(
  AlterarFornecedorSchema,
) {}
export class AlterarSituacaoFornecedorBodyDto extends createZodDto(
  AlterarSituacaoFornecedorSchema,
) {}

export class ListarFornecedoresResponseDto extends createZodDto(
  ListarFornecedoresResponseSchema,
) {}
export class CriarFornecedorResponseDto extends createZodDto(
  CriarFornecedorResponseSchema,
) {}
export class ConsultarFornecedorResponseDto extends createZodDto(
  ConsultarFornecedorResponseSchema,
) {}
export class AlterarFornecedorResponseDto extends createZodDto(
  AlterarFornecedorResponseSchema,
) {}
export class AlterarSituacaoFornecedorResponseDto extends createZodDto(
  AlterarSituacaoFornecedorResponseSchema,
) {}
