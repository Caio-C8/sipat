import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { ZodSerializerDto } from "nestjs-zod";
import type {
  CriarEmprestimoResponse,
  RegistrarDevolucaoEmprestimoResponse,
  ConsultarEmprestimoResponse,
  ListarEmprestimosResponse,
  ListarOpcoesPatrimoniosEmprestimoResponse,
  ListarOpcoesComissoesEmprestimoResponse,
} from "@repo/contracts";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { EmprestimosService } from "./emprestimos.service";
import {
  CriarEmprestimoBodyDto,
  RegistrarDevolucaoEmprestimoBodyDto,
  EmprestimoParamsDto,
  ListarEmprestimosQueryDto,
  ListarOpcoesPatrimoniosEmprestimoQueryDto,
  ListarOpcoesComissoesEmprestimoQueryDto,
  CriarEmprestimoResponseDto,
  RegistrarDevolucaoEmprestimoResponseDto,
  ConsultarEmprestimoResponseDto,
  ListarEmprestimosResponseDto,
  ListarOpcoesPatrimoniosEmprestimoResponseDto,
  ListarOpcoesComissoesEmprestimoResponseDto,
} from "./dtos";

@Controller("emprestimos")
export class EmprestimosController {
  constructor(private readonly emprestimos: EmprestimosService) {}

  @Get()
  @PerfisPermitidos("DIRETOR_PATRIMONIO", "ADMINISTRADOR")
  @ZodSerializerDto(ListarEmprestimosResponseDto)
  async listar(
    @Query() query: ListarEmprestimosQueryDto,
  ): Promise<ListarEmprestimosResponse> {
    const { items, ...meta } = await this.emprestimos.listar(query);
    return {
      status: 200,
      sucesso: true,
      mensagem: "Empréstimos listados.",
      dados: items,
      meta,
    };
  }
  @Get("opcoes/patrimonios")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarOpcoesPatrimoniosEmprestimoResponseDto)
  async patrimonios(
    @Query() query: ListarOpcoesPatrimoniosEmprestimoQueryDto,
  ): Promise<ListarOpcoesPatrimoniosEmprestimoResponse> {
    const { items, ...meta } = await this.emprestimos.listarPatrimonios(query);
    return {
      status: 200,
      sucesso: true,
      mensagem: "Bens elegíveis listados.",
      dados: items,
      meta,
    };
  }
  @Get("opcoes/comissoes")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarOpcoesComissoesEmprestimoResponseDto)
  async comissoes(
    @Query() query: ListarOpcoesComissoesEmprestimoQueryDto,
  ): Promise<ListarOpcoesComissoesEmprestimoResponse> {
    const { items, ...meta } = await this.emprestimos.listarComissoes(query);
    return {
      status: 200,
      sucesso: true,
      mensagem: "Comissões vigentes listadas.",
      dados: items,
      meta,
    };
  }
  @Get(":emprestimoId")
  @PerfisPermitidos("DIRETOR_PATRIMONIO", "ADMINISTRADOR")
  @ZodSerializerDto(ConsultarEmprestimoResponseDto)
  async consultar(
    @Param() params: EmprestimoParamsDto,
  ): Promise<ConsultarEmprestimoResponse> {
    return {
      status: 200,
      sucesso: true,
      mensagem: "Empréstimo encontrado.",
      dados: await this.emprestimos.consultar(params.emprestimoId),
    };
  }
  @Post()
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(CriarEmprestimoResponseDto)
  criar(
    @Body() body: CriarEmprestimoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarEmprestimoResponse> {
    return this.emprestimos.criar(body, request.identidadeAutenticada!);
  }
  @Post(":emprestimoId/devolucoes")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(RegistrarDevolucaoEmprestimoResponseDto)
  devolver(
    @Param() params: EmprestimoParamsDto,
    @Body() body: RegistrarDevolucaoEmprestimoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<RegistrarDevolucaoEmprestimoResponse> {
    return this.emprestimos.devolver(
      params.emprestimoId,
      body,
      request.identidadeAutenticada!,
    );
  }
}
