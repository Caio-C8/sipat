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
  AlterarResponsavelResponse,
  AlterarSituacaoResponsavelResponse,
  ConsultarResponsavelResponse,
  CriarResponsavelResponse,
  ListarResponsaveisResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  AlterarResponsavelBodyDto,
  AlterarResponsavelResponseDto,
  AlterarSituacaoResponsavelBodyDto,
  AlterarSituacaoResponsavelResponseDto,
  ConsultarResponsavelResponseDto,
  CriarResponsavelBodyDto,
  CriarResponsavelResponseDto,
  ListarResponsaveisQueryDto,
  ListarResponsaveisResponseDto,
  ResponsavelParamsDto,
} from "./dtos";
import { ResponsavelResponseMapper } from "./mappers";
import { ResponsaveisService } from "./responsaveis.service";

@Controller("responsaveis")
export class ResponsaveisController {
  constructor(private readonly responsaveisService: ResponsaveisService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ListarResponsaveisResponseDto)
  async listar(
    @Query() query: ListarResponsaveisQueryDto,
  ): Promise<ListarResponsaveisResponse> {
    const resultado = await this.responsaveisService.listar(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Responsáveis listados com sucesso.",
      dados: resultado.items.map(ResponsavelResponseMapper.paraResumo),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":responsavelId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ConsultarResponsavelResponseDto)
  async consultar(
    @Param() params: ResponsavelParamsDto,
  ): Promise<ConsultarResponsavelResponse> {
    const responsavel = await this.responsaveisService.consultar(
      params.responsavelId,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Responsável encontrado com sucesso.",
      dados: ResponsavelResponseMapper.paraDetalhe(responsavel),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarResponsavelResponseDto)
  async criar(
    @Body() body: CriarResponsavelBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarResponsavelResponse> {
    const responsavel = await this.responsaveisService.criar(
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Responsável criado com sucesso.",
      dados: ResponsavelResponseMapper.paraDetalhe(responsavel),
    };
  }

  @Patch(":responsavelId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarResponsavelResponseDto)
  async alterar(
    @Param() params: ResponsavelParamsDto,
    @Body() body: AlterarResponsavelBodyDto,
  ): Promise<AlterarResponsavelResponse> {
    const responsavel = await this.responsaveisService.alterar(
      params.responsavelId,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Responsável alterado com sucesso.",
      dados: ResponsavelResponseMapper.paraDetalhe(responsavel),
    };
  }

  @Patch(":responsavelId/situacao")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarSituacaoResponsavelResponseDto)
  async alterarSituacao(
    @Param() params: ResponsavelParamsDto,
    @Body() body: AlterarSituacaoResponsavelBodyDto,
  ): Promise<AlterarSituacaoResponsavelResponse> {
    const responsavel = await this.responsaveisService.alterarSituacao(
      params.responsavelId,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: body.ativo
        ? "Responsável ativado com sucesso."
        : "Responsável inativado com sucesso.",
      dados: ResponsavelResponseMapper.paraDetalhe(responsavel),
    };
  }
}
