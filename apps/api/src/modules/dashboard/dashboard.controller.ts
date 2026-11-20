import { Controller, Get, Header, HttpStatus, Req } from "@nestjs/common";
import type { DashboardOperacionalResponse } from "@repo/contracts";
import { DashboardOperacionalResponseSchema } from "@repo/contracts";
import { createZodDto, ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import { DashboardService } from "./dashboard.service";

class DashboardOperacionalResponseDto extends createZodDto(
  DashboardOperacionalResponseSchema,
) {}

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @Header("Cache-Control", "private, no-store")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(DashboardOperacionalResponseDto)
  async consultar(
    @Req() request: RequisicaoAutenticada,
  ): Promise<DashboardOperacionalResponse> {
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Dashboard operacional consultado.",
      dados: await this.dashboard.consultar(request.identidadeAutenticada!),
    };
  }
}
