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
  ConcluirSetorInventarioResponse,
  ConsultarInventarioResponse,
  CorrigirItemInventarioResponse,
  CriarInventarioResponse,
  FinalizarInventarioResponse,
  IniciarSetorInventarioResponse,
  ListarInventariosResponse,
  ListarItensInventarioResponse,
  ListarSetoresInventarioResponse,
  VerificarItemInventarioResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  ConcluirSetorInventarioBodyDto,
  ConcluirSetorInventarioResponseDto,
  ConsultarInventarioResponseDto,
  CorrigirItemInventarioBodyDto,
  CorrigirItemInventarioResponseDto,
  CriarInventarioBodyDto,
  CriarInventarioResponseDto,
  FinalizarInventarioBodyDto,
  FinalizarInventarioResponseDto,
  IniciarSetorInventarioBodyDto,
  IniciarSetorInventarioResponseDto,
  InventarioParamsDto,
  ItemInventarioParamsDto,
  ListarInventariosQueryDto,
  ListarInventariosResponseDto,
  ListarItensInventarioQueryDto,
  ListarItensInventarioResponseDto,
  ListarSetoresInventarioQueryDto,
  ListarSetoresInventarioResponseDto,
  SetorInventarioParamsDto,
  VerificarItemInventarioBodyDto,
  VerificarItemInventarioResponseDto,
} from "./dtos";
import { InventarioResponseMapper } from "./mappers";
import { InventariosService } from "./inventarios.service";

@Controller("inventarios")
export class InventariosController {
  constructor(private readonly inventarios: InventariosService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
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
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
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
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
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
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
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

  @Post(":inventarioId/setores/:setorInventarioId/iniciar")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(IniciarSetorInventarioResponseDto)
  async iniciarSetor(
    @Param() params: SetorInventarioParamsDto,
    @Body() _body: IniciarSetorInventarioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<IniciarSetorInventarioResponse> {
    const setor = await this.inventarios.iniciarSetor(
      params.inventarioId,
      params.setorInventarioId,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Conferência do setor iniciada com sucesso.",
      dados: InventarioResponseMapper.paraSetor(setor),
    };
  }

  @Post(":inventarioId/setores/:setorInventarioId/verificacoes")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(VerificarItemInventarioResponseDto)
  async verificarItem(
    @Param() params: SetorInventarioParamsDto,
    @Body() body: VerificarItemInventarioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<VerificarItemInventarioResponse> {
    const resultado = await this.inventarios.verificarItem(
      params.inventarioId,
      params.setorInventarioId,
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem:
        resultado.tipo === "LEITURA_IDEMPOTENTE"
          ? "A leitura já havia sido registrada neste setor."
          : "Conferência registrada com sucesso.",
      dados: {
        tipo: resultado.tipo,
        item: InventarioResponseMapper.paraItem(resultado.item),
      },
    };
  }

  @Post(":inventarioId/itens/:itemInventarioId/correcoes")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(CorrigirItemInventarioResponseDto)
  async corrigirItem(
    @Param() params: ItemInventarioParamsDto,
    @Body() body: CorrigirItemInventarioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CorrigirItemInventarioResponse> {
    const item = await this.inventarios.corrigirItem(
      params.inventarioId,
      params.itemInventarioId,
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Divergência corrigida com sucesso.",
      dados: InventarioResponseMapper.paraItem(item),
    };
  }

  @Post(":inventarioId/setores/:setorInventarioId/concluir")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(ConcluirSetorInventarioResponseDto)
  async concluirSetor(
    @Param() params: SetorInventarioParamsDto,
    @Body() _body: ConcluirSetorInventarioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<ConcluirSetorInventarioResponse> {
    const setor = await this.inventarios.concluirSetor(
      params.inventarioId,
      params.setorInventarioId,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Conferência do setor concluída com sucesso.",
      dados: InventarioResponseMapper.paraSetor(setor),
    };
  }

  @Post(":inventarioId/finalizar")
  @PerfisPermitidos("DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(FinalizarInventarioResponseDto)
  async finalizar(
    @Param() params: InventarioParamsDto,
    @Body() body: FinalizarInventarioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<FinalizarInventarioResponse> {
    const inventario = await this.inventarios.finalizar(
      params.inventarioId,
      body,
      request.identidadeAutenticada!,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Inventário finalizado com sucesso.",
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
