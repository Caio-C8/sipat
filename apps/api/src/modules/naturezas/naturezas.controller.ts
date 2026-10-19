import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type {
  AlterarNaturezaResponse,
  ConsultarNaturezaResponse,
  CriarNaturezaResponse,
  ListarNaturezasResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  AlterarNaturezaBodyDto,
  AlterarNaturezaResponseDto,
  ConsultarNaturezaResponseDto,
  CriarNaturezaBodyDto,
  CriarNaturezaResponseDto,
  ListarNaturezasQueryDto,
  ListarNaturezasResponseDto,
  NaturezaParamsDto,
} from "./dtos";
import { NaturezaResponseMapper } from "./mappers";
import { NaturezasService } from "./naturezas.service";

@Controller("naturezas")
export class NaturezasController {
  constructor(private readonly naturezasService: NaturezasService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ListarNaturezasResponseDto)
  async listar(
    @Query() query: ListarNaturezasQueryDto,
  ): Promise<ListarNaturezasResponse> {
    const resultado = await this.naturezasService.listar(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Naturezas listadas com sucesso.",
      dados: resultado.items.map(NaturezaResponseMapper.paraResumo),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":naturezaId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ConsultarNaturezaResponseDto)
  async consultar(
    @Param() params: NaturezaParamsDto,
  ): Promise<ConsultarNaturezaResponse> {
    const natureza = await this.naturezasService.consultar(params.naturezaId);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Natureza encontrada com sucesso.",
      dados: NaturezaResponseMapper.paraDetalhe(natureza),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarNaturezaResponseDto)
  async criar(
    @Body() body: CriarNaturezaBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarNaturezaResponse> {
    const natureza = await this.naturezasService.criar(
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Natureza criada com sucesso.",
      dados: NaturezaResponseMapper.paraDetalhe(natureza),
    };
  }

  @Patch(":naturezaId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarNaturezaResponseDto)
  async alterar(
    @Param() params: NaturezaParamsDto,
    @Body() body: AlterarNaturezaBodyDto,
  ): Promise<AlterarNaturezaResponse> {
    const natureza = await this.naturezasService.alterar(
      params.naturezaId,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Natureza alterada com sucesso.",
      dados: NaturezaResponseMapper.paraDetalhe(natureza),
    };
  }
}
