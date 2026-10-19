import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import type { CriarPatrimonioResponse } from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import { CriarPatrimonioBodyDto, CriarPatrimonioResponseDto } from "./dtos";
import { PatrimonioResponseMapper } from "./mappers";
import { PatrimoniosService } from "./patrimonios.service";

@Controller("patrimonios")
export class PatrimoniosController {
  constructor(private readonly patrimoniosService: PatrimoniosService) {}

  @Post()
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarPatrimonioResponseDto)
  async criar(
    @Body() body: CriarPatrimonioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarPatrimonioResponse> {
    const patrimonio = await this.patrimoniosService.criar(
      body,
      request.identidadeAutenticada!,
    );

    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Patrimônio criado com sucesso.",
      dados: PatrimonioResponseMapper.paraDetalhe(patrimonio),
    };
  }
}
