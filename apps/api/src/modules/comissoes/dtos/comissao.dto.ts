import {
  AdicionarMembroComissaoBodySchema,
  AdicionarMembroComissaoResponseSchema,
  AlterarComissaoBodySchema,
  AlterarComissaoResponseSchema,
  AlterarMembroComissaoBodySchema,
  AlterarMembroComissaoResponseSchema,
  ComissaoParamsSchema,
  ConsultarComissaoResponseSchema,
  CriarComissaoBodySchema,
  CriarComissaoResponseSchema,
  ListarComissoesQuerySchema,
  ListarComissoesResponseSchema,
  MembroComissaoParamsSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class ComissaoParamsDto extends createZodDto(ComissaoParamsSchema) {}
export class MembroComissaoParamsDto extends createZodDto(
  MembroComissaoParamsSchema,
) {}
export class ListarComissoesQueryDto extends createZodDto(
  ListarComissoesQuerySchema,
) {}
export class CriarComissaoBodyDto extends createZodDto(
  CriarComissaoBodySchema,
) {}
export class AlterarComissaoBodyDto extends createZodDto(
  AlterarComissaoBodySchema,
) {}
export class AdicionarMembroComissaoBodyDto extends createZodDto(
  AdicionarMembroComissaoBodySchema,
) {}
export class AlterarMembroComissaoBodyDto extends createZodDto(
  AlterarMembroComissaoBodySchema,
) {}

export class ListarComissoesResponseDto extends createZodDto(
  ListarComissoesResponseSchema,
) {}
export class CriarComissaoResponseDto extends createZodDto(
  CriarComissaoResponseSchema,
) {}
export class ConsultarComissaoResponseDto extends createZodDto(
  ConsultarComissaoResponseSchema,
) {}
export class AlterarComissaoResponseDto extends createZodDto(
  AlterarComissaoResponseSchema,
) {}
export class AdicionarMembroComissaoResponseDto extends createZodDto(
  AdicionarMembroComissaoResponseSchema,
) {}
export class AlterarMembroComissaoResponseDto extends createZodDto(
  AlterarMembroComissaoResponseSchema,
) {}
