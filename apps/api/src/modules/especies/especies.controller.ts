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
  AlterarEspecieResponse,
  ConsultarEspecieResponse,
  CriarEspecieResponse,
  ListarEspeciesResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  AlterarEspecieBodyDto,
  AlterarEspecieResponseDto,
  ConsultarEspecieResponseDto,
  CriarEspecieBodyDto,
  CriarEspecieResponseDto,
  EspecieParamsDto,
  ListarEspeciesQueryDto,
  ListarEspeciesResponseDto,
} from "./dtos";
import { EspecieResponseMapper } from "./mappers";
import { EspeciesService } from "./especies.service";

@Controller("especies")
export class EspeciesController {
  constructor(private readonly especiesService: EspeciesService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarEspeciesResponseDto)
  async listar(
    @Query() query: ListarEspeciesQueryDto,
  ): Promise<ListarEspeciesResponse> {
    const resultado = await this.especiesService.listar(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Espécies listadas com sucesso.",
      dados: resultado.items.map(EspecieResponseMapper.paraResumo),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":especieId")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ConsultarEspecieResponseDto)
  async consultar(
    @Param() params: EspecieParamsDto,
  ): Promise<ConsultarEspecieResponse> {
    const especie = await this.especiesService.consultar(params.especieId);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Espécie encontrada com sucesso.",
      dados: EspecieResponseMapper.paraDetalhe(especie),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarEspecieResponseDto)
  async criar(
    @Body() body: CriarEspecieBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarEspecieResponse> {
    const especie = await this.especiesService.criar(
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Espécie criada com sucesso.",
      dados: EspecieResponseMapper.paraDetalhe(especie),
    };
  }

  @Patch(":especieId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarEspecieResponseDto)
  async alterar(
    @Param() params: EspecieParamsDto,
    @Body() body: AlterarEspecieBodyDto,
  ): Promise<AlterarEspecieResponse> {
    const especie = await this.especiesService.alterar(params.especieId, body);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Espécie alterada com sucesso.",
      dados: EspecieResponseMapper.paraDetalhe(especie),
    };
  }
}
