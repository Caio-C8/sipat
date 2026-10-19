import {
  CriarPatrimonioBodySchema,
  CriarPatrimonioResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class CriarPatrimonioBodyDto extends createZodDto(
  CriarPatrimonioBodySchema,
) {}

export class CriarPatrimonioResponseDto extends createZodDto(
  CriarPatrimonioResponseSchema,
) {}
