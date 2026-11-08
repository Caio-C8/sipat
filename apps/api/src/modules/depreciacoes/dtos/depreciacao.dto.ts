import {
  ExecutarDepreciacaoPatrimonioBodySchema,
  ExecutarDepreciacaoPatrimonioResponseSchema,
  ExecutarDepreciacoesEmMassaBodySchema,
  ExecutarDepreciacoesEmMassaResponseSchema,
  ListarDepreciacoesPendentesQuerySchema,
  ListarDepreciacoesPendentesResponseSchema,
  PatrimonioParamsSchema,
  ListarCompetenciasDepreciacaoResponseSchema,
  ResumoPendenciasDepreciacaoResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class PatrimonioDepreciacaoParamsDto extends createZodDto(
  PatrimonioParamsSchema,
) {}
export class ListarDepreciacoesPendentesQueryDto extends createZodDto(
  ListarDepreciacoesPendentesQuerySchema,
) {}
export class ExecutarDepreciacoesEmMassaBodyDto extends createZodDto(
  ExecutarDepreciacoesEmMassaBodySchema,
) {}
export class ExecutarDepreciacaoPatrimonioBodyDto extends createZodDto(
  ExecutarDepreciacaoPatrimonioBodySchema,
) {}
export class ListarDepreciacoesPendentesResponseDto extends createZodDto(
  ListarDepreciacoesPendentesResponseSchema,
) {}
export class ExecutarDepreciacoesEmMassaResponseDto extends createZodDto(
  ExecutarDepreciacoesEmMassaResponseSchema,
) {}
export class ExecutarDepreciacaoPatrimonioResponseDto extends createZodDto(
  ExecutarDepreciacaoPatrimonioResponseSchema,
) {}
export class ListarCompetenciasDepreciacaoResponseDto extends createZodDto(
  ListarCompetenciasDepreciacaoResponseSchema,
) {}
export class ResumoPendenciasDepreciacaoResponseDto extends createZodDto(
  ResumoPendenciasDepreciacaoResponseSchema,
) {}
