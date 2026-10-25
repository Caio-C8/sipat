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
  ConsultarInventarioResponse,
  CriarInventarioResponse,
  ListarInventariosResponse,
  ListarItensInventarioResponse,
  ListarSetoresInventarioResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  ConsultarInventarioResponseDto,
  CriarInventarioBodyDto,
  CriarInventarioResponseDto,
  InventarioParamsDto,
  ListarInventariosQueryDto,
  ListarInventariosResponseDto,
  ListarItensInventarioQueryDto,
  ListarItensInventarioResponseDto,
  ListarSetoresInventarioQueryDto,
  ListarSetoresInventarioResponseDto,
} from "./dtos";
import { InventarioResponseMapper } from "./mappers";
import { InventariosService } from "./inventarios.service";

@Controller("inventarios")
export class InventariosController {
  constructor(private readonly inventarios: InventariosService) {}

  @Get()
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarInventariosResponseDto)
  async listar(
    @Query() query: ListarInventariosQueryDto,
  ): Promise<ListarInventariosResponse> {
    const resultado = await this.inventarios.listar(query);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Inventários listados com sucesso.",
      dados: resultado.items.map((item) =>
        InventarioResponseMapper.paraResumo(item),
      ),
      meta: this.paraMeta(resultado),
    };
  }

  @Get(":inventarioId")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ConsultarInventarioResponseDto)
  async consultar(
    @Param() params: InventarioParamsDto,
  ): Promise<ConsultarInventarioResponse> {
    const inventario = await this.inventarios.consultar(params.inventarioId);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Inventário encontrado com sucesso.",
      dados: InventarioResponseMapper.paraDetalhe(inventario),
    };
  }

  @Get(":inventarioId/setores")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarSetoresInventarioResponseDto)
  async listarSetores(
    @Param() params: InventarioParamsDto,
    @Query() query: ListarSetoresInventarioQueryDto,
  ): Promise<ListarSetoresInventarioResponse> {
    const resultado = await this.inventarios.listarSetores(
      params.inventarioId,
      query,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Setores do inventário listados com sucesso.",
      dados: resultado.items.map((item) =>
        InventarioResponseMapper.paraSetor(item),
      ),
      meta: this.paraMeta(resultado),
    };
  }

  @Get(":inventarioId/itens")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @ZodSerializerDto(ListarItensInventarioResponseDto)
  async listarItens(
    @Param() params: InventarioParamsDto,
    @Query() query: ListarItensInventarioQueryDto,
  ): Promise<ListarItensInventarioResponse> {
    const resultado = await this.inventarios.listarItens(
      params.inventarioId,
      query,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Itens do inventário listados com sucesso.",
      dados: resultado.items.map((item) =>
        InventarioResponseMapper.paraItem(item),
      ),
      meta: this.paraMeta(resultado),
    };
  }

  @Post()
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarInventarioResponseDto)
  async criar(
    @Body() body: CriarInventarioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarInventarioResponse> {
    const inventario = await this.inventarios.criar(
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Inventário criado com sucesso.",
      dados: InventarioResponseMapper.paraDetalhe(inventario),
    };
  }

  private paraMeta(resultado: {
    total: number;
    pagina: number;
    ultimaPagina: number;
    limite: number;
  }) {
    return {
      total: resultado.total,
      pagina: resultado.pagina,
      ultimaPagina: resultado.ultimaPagina,
      limite: resultado.limite,
    };
  }
}
