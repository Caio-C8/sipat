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
import { ZodSerializerDto } from "nestjs-zod";
import type {
  CriarReavaliacaoResponse,
  ConsultarReavaliacaoResponse,
  ListarOpcoesComissaoReavaliacaoResponse,
  ListarReavaliacoesResponse,
  PreviaReavaliacaoResponse,
} from "@repo/contracts";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import {
  CriarReavaliacaoBodyDto,
  CriarReavaliacaoResponseDto,
  ConsultarReavaliacaoResponseDto,
  ListarOpcoesComissaoReavaliacaoQueryDto,
  ListarOpcoesComissaoReavaliacaoResponseDto,
  ListarReavaliacoesQueryDto,
  ListarReavaliacoesResponseDto,
  PreviaReavaliacaoBodyDto,
  PreviaReavaliacaoResponseDto,
  ReavaliacaoParamsDto,
} from "./dtos";
import { ReavaliacoesService } from "./reavaliacoes.service";

@Controller("reavaliacoes")
export class ReavaliacoesController {
  constructor(private readonly reavaliacoes: ReavaliacoesService) {}

  @Get()
  @PerfisPermitidos("DIRETOR_PATRIMONIO", "ADMINISTRADOR")
  @ZodSerializerDto(ListarReavaliacoesResponseDto)
  async listar(
    @Query() query: ListarReavaliacoesQueryDto,
  ): Promise<ListarReavaliacoesResponse> {
    const { items, ...meta } = await this.reavaliacoes.listar(query);
    return {
      status: 200,
      sucesso: true,
      mensagem: "Reavaliações listadas.",
      dados: items,
      meta,
    };
  }

  @Get("opcoes/comissoes")
  @PerfisPermitidos("DIRETOR_PATRIMONIO", "ADMINISTRADOR")
  @ZodSerializerDto(ListarOpcoesComissaoReavaliacaoResponseDto)
  async listarComissoes(
    @Query() query: ListarOpcoesComissaoReavaliacaoQueryDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<ListarOpcoesComissaoReavaliacaoResponse> {
    const { items, ...meta } = await this.reavaliacoes.listarComissoes(
      query,
      request.identidadeAutenticada!,
    );
    return {
      status: 200,
      sucesso: true,
      mensagem: "Comissões listadas.",
      dados: items,
      meta,
    };
  }

  @Get(":reavaliacaoId")
  @PerfisPermitidos("DIRETOR_PATRIMONIO", "ADMINISTRADOR")
  @ZodSerializerDto(ConsultarReavaliacaoResponseDto)
  async consultar(
    @Param() params: ReavaliacaoParamsDto,
  ): Promise<ConsultarReavaliacaoResponse> {
    return {
      status: 200,
      sucesso: true,
      mensagem: "Reavaliação encontrada.",
      dados: await this.reavaliacoes.consultar(params.reavaliacaoId),
    };
  }

  @Post("previa")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(PreviaReavaliacaoResponseDto)
  async previa(
    @Body() body: PreviaReavaliacaoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<PreviaReavaliacaoResponse> {
    return {
      status: 200,
      sucesso: true,
      mensagem: "Prévia calculada.",
      dados: await this.reavaliacoes.previa(
        body,
        request.identidadeAutenticada!,
      ),
    };
  }

  @Post()
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarReavaliacaoResponseDto)
  async criar(
    @Body() body: CriarReavaliacaoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarReavaliacaoResponse> {
    return {
      status: 201,
      sucesso: true,
      mensagem: "Reavaliações registradas.",
      dados: await this.reavaliacoes.criar(
        body,
        request.identidadeAutenticada!,
      ),
    };
  }
}
