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
  AlterarSetorResponse,
  AlterarSituacaoSetorResponse,
  ConsultarSetorResponse,
  CriarSetorResponse,
  ListarSetoresResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  AlterarSetorBodyDto,
  AlterarSetorResponseDto,
  AlterarSituacaoSetorBodyDto,
  AlterarSituacaoSetorResponseDto,
  ConsultarSetorResponseDto,
  CriarSetorBodyDto,
  CriarSetorResponseDto,
  ListarSetoresQueryDto,
  ListarSetoresResponseDto,
  SetorParamsDto,
} from "./dtos";
import { SetorResponseMapper } from "./mappers";
import { SetoresService } from "./setores.service";

@Controller("setores")
export class SetoresController {
  constructor(private readonly setoresService: SetoresService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarSetoresResponseDto)
  async listar(
    @Query() query: ListarSetoresQueryDto,
  ): Promise<ListarSetoresResponse> {
    const resultado = await this.setoresService.listar(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Setores listados com sucesso.",
      dados: resultado.items.map(SetorResponseMapper.paraResumo),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":setorId")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ConsultarSetorResponseDto)
  async consultar(
    @Param() params: SetorParamsDto,
  ): Promise<ConsultarSetorResponse> {
    const setor = await this.setoresService.consultar(params.setorId);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Setor encontrado com sucesso.",
      dados: SetorResponseMapper.paraDetalhe(setor),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarSetorResponseDto)
  async criar(
    @Body() body: CriarSetorBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarSetorResponse> {
    const setor = await this.setoresService.criar(
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Setor criado com sucesso.",
      dados: SetorResponseMapper.paraDetalhe(setor),
    };
  }

  @Patch(":setorId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarSetorResponseDto)
  async alterar(
    @Param() params: SetorParamsDto,
    @Body() body: AlterarSetorBodyDto,
  ): Promise<AlterarSetorResponse> {
    const setor = await this.setoresService.alterar(params.setorId, body);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Setor alterado com sucesso.",
      dados: SetorResponseMapper.paraDetalhe(setor),
    };
  }

  @Patch(":setorId/situacao")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarSituacaoSetorResponseDto)
  async alterarSituacao(
    @Param() params: SetorParamsDto,
    @Body() body: AlterarSituacaoSetorBodyDto,
  ): Promise<AlterarSituacaoSetorResponse> {
    const setor = await this.setoresService.alterarSituacao(
      params.setorId,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: body.ativo
        ? "Setor ativado com sucesso."
        : "Setor inativado com sucesso.",
      dados: SetorResponseMapper.paraDetalhe(setor),
    };
  }
}
