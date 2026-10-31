import { createZodDto } from "nestjs-zod";
import {
  CriarEmprestimoBodySchema,
  RegistrarDevolucaoEmprestimoBodySchema,
  EmprestimoParamsSchema,
  ListarEmprestimosQuerySchema,
  ListarOpcoesPatrimoniosEmprestimoQuerySchema,
  ListarOpcoesComissoesEmprestimoQuerySchema,
  CriarEmprestimoResponseSchema,
  RegistrarDevolucaoEmprestimoResponseSchema,
  ConsultarEmprestimoResponseSchema,
  ListarEmprestimosResponseSchema,
  ListarOpcoesPatrimoniosEmprestimoResponseSchema,
  ListarOpcoesComissoesEmprestimoResponseSchema,
} from "@repo/contracts";
export class CriarEmprestimoBodyDto extends createZodDto(
  CriarEmprestimoBodySchema,
) {}
export class RegistrarDevolucaoEmprestimoBodyDto extends createZodDto(
  RegistrarDevolucaoEmprestimoBodySchema,
) {}
export class EmprestimoParamsDto extends createZodDto(EmprestimoParamsSchema) {}
export class ListarEmprestimosQueryDto extends createZodDto(
  ListarEmprestimosQuerySchema,
) {}
export class ListarOpcoesPatrimoniosEmprestimoQueryDto extends createZodDto(
  ListarOpcoesPatrimoniosEmprestimoQuerySchema,
) {}
export class ListarOpcoesComissoesEmprestimoQueryDto extends createZodDto(
  ListarOpcoesComissoesEmprestimoQuerySchema,
) {}
export class CriarEmprestimoResponseDto extends createZodDto(
  CriarEmprestimoResponseSchema,
) {}
export class RegistrarDevolucaoEmprestimoResponseDto extends createZodDto(
  RegistrarDevolucaoEmprestimoResponseSchema,
) {}
export class ConsultarEmprestimoResponseDto extends createZodDto(
  ConsultarEmprestimoResponseSchema,
) {}
export class ListarEmprestimosResponseDto extends createZodDto(
  ListarEmprestimosResponseSchema,
) {}
export class ListarOpcoesPatrimoniosEmprestimoResponseDto extends createZodDto(
  ListarOpcoesPatrimoniosEmprestimoResponseSchema,
) {}
export class ListarOpcoesComissoesEmprestimoResponseDto extends createZodDto(
  ListarOpcoesComissoesEmprestimoResponseSchema,
) {}
