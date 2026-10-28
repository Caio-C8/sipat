import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { ZodSerializerDto } from "nestjs-zod";
import type {
  CriarMovimentacaoResponse,
  ConsultarMovimentacaoResponse,
  ListarMovimentacoesResponse,
  ListarSetoresMovimentacaoResponse,
  ListarComissoesMovimentacaoResponse,
} from "@repo/contracts";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { ComissaoResponseMapper } from "../comissoes/mappers/comissao-response.mapper";
import { MovimentacoesService } from "./movimentacoes.service";
import { MovimentacaoResponseMapper } from "./mappers/movimentacao-response.mapper";
import {
  CriarMovimentacaoBodyDto,
  MovimentacaoParamsDto,
  ListarMovimentacoesQueryDto,
  ListarOpcoesMovimentacaoQueryDto,
  CriarMovimentacaoResponseDto,
  ConsultarMovimentacaoResponseDto,
  ListarMovimentacoesResponseDto,
  ListarSetoresMovimentacaoResponseDto,
  ListarComissoesMovimentacaoResponseDto,
} from "./dtos";
@Controller("movimentacoes")
export class MovimentacoesController {
  constructor(private readonly movimentacoes: MovimentacoesService) {}
  @Get()
  @PerfisPermitidos("DIRETOR_PATRIMONIO", "ADMINISTRADOR")
  @ZodSerializerDto(ListarMovimentacoesResponseDto)
  async listar(
    @Query() query: ListarMovimentacoesQueryDto,
  ): Promise<ListarMovimentacoesResponse> {
    const { items, ...meta } = await this.movimentacoes.listar(query);
    return {
      status: 200,
      sucesso: true,
      mensagem: "Movimentações listadas.",
      dados: items.map((item) => MovimentacaoResponseMapper.paraResumo(item)),
      meta,
    };
  }
  @Get("opcoes/setores")
  @PerfisPermitidos("DIRETOR_PATRIMONIO", "ADMINISTRADOR")
  @ZodSerializerDto(ListarSetoresMovimentacaoResponseDto)
  async listarSetores(
    @Query() query: ListarOpcoesMovimentacaoQueryDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<ListarSetoresMovimentacaoResponse> {
    const { items, ...meta } = await this.movimentacoes.listarSetores(
      query,
      request.identidadeAutenticada!,
    );
    return {
      status: 200,
      sucesso: true,
      mensagem: "Setores listados.",
      dados: items.map(({ responsavel, ...setor }) => ({
        ...setor,
        responsavelAtual: responsavel,
      })),
      meta,
    };
  }
  @Get("opcoes/comissoes")
  @PerfisPermitidos("DIRETOR_PATRIMONIO", "ADMINISTRADOR")
  @ZodSerializerDto(ListarComissoesMovimentacaoResponseDto)
  async listarComissoes(
    @Query() query: ListarOpcoesMovimentacaoQueryDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<ListarComissoesMovimentacaoResponse> {
    const { items, ...meta } = await this.movimentacoes.listarComissoes(
      query,
      request.identidadeAutenticada!,
    );
    return {
      status: 200,
      sucesso: true,
      mensagem: "Comissões listadas.",
      dados: items.map((item) => ComissaoResponseMapper.paraResumo(item)),
      meta,
    };
  }
  @Get(":movimentacaoId")
  @PerfisPermitidos("DIRETOR_PATRIMONIO", "ADMINISTRADOR")
  @ZodSerializerDto(ConsultarMovimentacaoResponseDto)
  async consultar(
    @Param() params: MovimentacaoParamsDto,
  ): Promise<ConsultarMovimentacaoResponse> {
    return {
      status: 200,
      sucesso: true,
      mensagem: "Movimentação encontrada.",
      dados: MovimentacaoResponseMapper.paraDetalhe(
        await this.movimentacoes.consultar(params.movimentacaoId),
      ),
    };
  }
  @Post()
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(CriarMovimentacaoResponseDto)
  async criar(
    @Body() body: CriarMovimentacaoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarMovimentacaoResponse> {
    const items = await this.movimentacoes.criar(
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: 201,
      sucesso: true,
      mensagem: "Transferências confirmadas.",
      dados: items.map((item) => MovimentacaoResponseMapper.paraDetalhe(item)),
    };
  }
}
