import {
  BuscaGlobalQuerySchema,
  BuscaGlobalResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class BuscaGlobalQueryDto extends createZodDto(BuscaGlobalQuerySchema) {}
export class BuscaGlobalResponseDto extends createZodDto(
  BuscaGlobalResponseSchema,
) {}
