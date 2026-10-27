import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type {
  ExecutarDepreciacaoPatrimonioResponse,
  ExecutarDepreciacoesEmMassaResponse,
  ListarDepreciacoesPendentesResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import { DepreciacoesService } from "./depreciacoes.service";
import {
  ExecutarDepreciacaoPatrimonioBodyDto,
  ExecutarDepreciacaoPatrimonioResponseDto,
  ExecutarDepreciacoesEmMassaBodyDto,
  ExecutarDepreciacoesEmMassaResponseDto,
  ListarDepreciacoesPendentesQueryDto,
  ListarDepreciacoesPendentesResponseDto,
  PatrimonioDepreciacaoParamsDto,
} from "./dtos";
import { DepreciacaoResponseMapper } from "./mappers";

@Controller()
export class DepreciacoesController {
  constructor(private readonly depreciacoes: DepreciacoesService) {}

  @Get("depreciacoes/pendentes")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarDepreciacoesPendentesResponseDto)
  async listarPendentes(
    @Query() query: ListarDepreciacoesPendentesQueryDto,
  ): Promise<ListarDepreciacoesPendentesResponse> {
    const resultado = await this.depreciacoes.listarPendentes(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Patrimônios pendentes de depreciação listados com sucesso.",
      dados: resultado.items.map(DepreciacaoResponseMapper.paraPendente),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
      resumo: {
        totalElegiveis: resultado.total,
        totalNoValorResidual: resultado.totalNoValorResidual,
      },
    };
  }

  @Post("depreciacoes")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(ExecutarDepreciacoesEmMassaResponseDto)
  async executarEmMassa(
    @Body() body: ExecutarDepreciacoesEmMassaBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<ExecutarDepreciacoesEmMassaResponse> {
    const dados = await this.depreciacoes.executarEmMassa(
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Depreciações executadas com sucesso.",
      dados,
    };
  }

  @Post("patrimonios/:patrimonioId/depreciacoes")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(ExecutarDepreciacaoPatrimonioResponseDto)
  async executarIndividual(
    @Param() params: PatrimonioDepreciacaoParamsDto,
    @Body() body: ExecutarDepreciacaoPatrimonioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<ExecutarDepreciacaoPatrimonioResponse> {
    const dados = await this.depreciacoes.executarIndividual(
      params.patrimonioId,
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem:
        dados.resultado === "DEPRECIADO"
          ? "Depreciação executada com sucesso."
          : "O patrimônio não é elegível para depreciação.",
      dados,
    };
  }
}
