import { Controller, Get, HttpStatus, Query } from "@nestjs/common";
import type { BuscaGlobalResponse } from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import { BuscaService } from "./busca.service";
import { BuscaGlobalQueryDto, BuscaGlobalResponseDto } from "./dtos";

@Controller("busca")
export class BuscaController {
  constructor(private readonly busca: BuscaService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(BuscaGlobalResponseDto)
  async buscar(
    @Query() query: BuscaGlobalQueryDto,
  ): Promise<BuscaGlobalResponse> {
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Busca concluída com sucesso.",
      dados: await this.busca.buscar(query.termo, query.limite),
    };
  }
}
