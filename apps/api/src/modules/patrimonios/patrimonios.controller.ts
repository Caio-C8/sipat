import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Query,
  Req,
} from "@nestjs/common";
import type {
  ConsultarPatrimonioResponse,
  CriarPatrimonioResponse,
  ListarPatrimoniosResponse,
  SubstituirNumeroPatrimonialResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  ConsultarPatrimonioResponseDto,
  CriarPatrimonioBodyDto,
  CriarPatrimonioResponseDto,
  ListarPatrimoniosQueryDto,
  ListarPatrimoniosResponseDto,
  PatrimonioParamsDto,
  SubstituirNumeroPatrimonialBodyDto,
  SubstituirNumeroPatrimonialResponseDto,
} from "./dtos";
import { PatrimonioResponseMapper } from "./mappers";
import { PatrimoniosService } from "./patrimonios.service";

@Controller("patrimonios")
export class PatrimoniosController {
  constructor(private readonly patrimoniosService: PatrimoniosService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarPatrimoniosResponseDto)
  async listar(
    @Query() query: ListarPatrimoniosQueryDto,
  ): Promise<ListarPatrimoniosResponse> {
    const resultado = await this.patrimoniosService.listar(query);

    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Patrimônios listados com sucesso.",
      dados: resultado.items.map(PatrimonioResponseMapper.paraResumo),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":patrimonioId")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ConsultarPatrimonioResponseDto)
  async consultar(
    @Param() params: PatrimonioParamsDto,
  ): Promise<ConsultarPatrimonioResponse> {
    const patrimonio = await this.patrimoniosService.consultar(
      params.patrimonioId,
    );

    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Patrimônio encontrado com sucesso.",
      dados: PatrimonioResponseMapper.paraDetalhe(patrimonio),
    };
  }

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

  @Post(":patrimonioId/substituicoes-numero")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(SubstituirNumeroPatrimonialResponseDto)
  async substituirNumero(
    @Param() params: PatrimonioParamsDto,
    @Body() body: SubstituirNumeroPatrimonialBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<SubstituirNumeroPatrimonialResponse> {
    const patrimonio = await this.patrimoniosService.substituirNumero(
      params.patrimonioId,
      body,
      request.identidadeAutenticada!,
    );

    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Número patrimonial substituído com sucesso.",
      dados: PatrimonioResponseMapper.paraDetalhe(patrimonio),
    };
  }
}
