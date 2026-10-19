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
  AlterarFornecedorResponse,
  AlterarSituacaoFornecedorResponse,
  ConsultarFornecedorResponse,
  CriarFornecedorResponse,
  ListarFornecedoresResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  AlterarFornecedorBodyDto,
  AlterarFornecedorResponseDto,
  AlterarSituacaoFornecedorBodyDto,
  AlterarSituacaoFornecedorResponseDto,
  ConsultarFornecedorResponseDto,
  CriarFornecedorBodyDto,
  CriarFornecedorResponseDto,
  FornecedorParamsDto,
  ListarFornecedoresQueryDto,
  ListarFornecedoresResponseDto,
} from "./dtos";
import { FornecedoresService } from "./fornecedores.service";
import { FornecedorResponseMapper } from "./mappers";

@Controller("fornecedores")
export class FornecedoresController {
  constructor(private readonly fornecedoresService: FornecedoresService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ListarFornecedoresResponseDto)
  async listar(
    @Query() query: ListarFornecedoresQueryDto,
  ): Promise<ListarFornecedoresResponse> {
    const resultado = await this.fornecedoresService.listar(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Fornecedores listados com sucesso.",
      dados: resultado.items.map(FornecedorResponseMapper.paraResumo),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":fornecedorId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ConsultarFornecedorResponseDto)
  async consultar(
    @Param() params: FornecedorParamsDto,
  ): Promise<ConsultarFornecedorResponse> {
    const fornecedor = await this.fornecedoresService.consultar(
      params.fornecedorId,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Fornecedor encontrado com sucesso.",
      dados: FornecedorResponseMapper.paraDetalhe(fornecedor),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarFornecedorResponseDto)
  async criar(
    @Body() body: CriarFornecedorBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarFornecedorResponse> {
    const fornecedor = await this.fornecedoresService.criar(
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Fornecedor criado com sucesso.",
      dados: FornecedorResponseMapper.paraDetalhe(fornecedor),
    };
  }

  @Patch(":fornecedorId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarFornecedorResponseDto)
  async alterar(
    @Param() params: FornecedorParamsDto,
    @Body() body: AlterarFornecedorBodyDto,
  ): Promise<AlterarFornecedorResponse> {
    const fornecedor = await this.fornecedoresService.alterar(
      params.fornecedorId,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Fornecedor alterado com sucesso.",
      dados: FornecedorResponseMapper.paraDetalhe(fornecedor),
    };
  }

  @Patch(":fornecedorId/situacao")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarSituacaoFornecedorResponseDto)
  async alterarSituacao(
    @Param() params: FornecedorParamsDto,
    @Body() body: AlterarSituacaoFornecedorBodyDto,
  ): Promise<AlterarSituacaoFornecedorResponse> {
    const fornecedor = await this.fornecedoresService.alterarSituacao(
      params.fornecedorId,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: body.ativo
        ? "Fornecedor ativado com sucesso."
        : "Fornecedor inativado com sucesso.",
      dados: FornecedorResponseMapper.paraDetalhe(fornecedor),
    };
  }
}
