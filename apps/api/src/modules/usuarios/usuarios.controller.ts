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
  AlterarSituacaoUsuarioResponse,
  AlterarUsuarioResponse,
  ConsultarUsuarioResponse,
  CriarUsuarioResponse,
  ListarUsuariosResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { RequisicaoAutenticada } from "../auth/auth.types";
import { PerfisPermitidos } from "../auth/decorators/perfis-permitidos.decorator";
import {
  AlterarSituacaoUsuarioBodyDto,
  AlterarSituacaoUsuarioResponseDto,
  AlterarUsuarioBodyDto,
  AlterarUsuarioResponseDto,
  ConsultarUsuarioResponseDto,
  CriarUsuarioBodyDto,
  CriarUsuarioResponseDto,
  ListarUsuariosQueryDto,
  ListarUsuariosResponseDto,
  UsuarioParamsDto,
} from "./dtos";
import { UsuarioResponseMapper } from "./mappers";
import { UsuariosService } from "./usuarios.service";

@Controller("usuarios")
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ListarUsuariosResponseDto)
  async listar(
    @Query() query: ListarUsuariosQueryDto,
  ): Promise<ListarUsuariosResponse> {
    const resultado = await this.usuariosService.listar(query);

    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Usuários listados com sucesso.",
      dados: resultado.items.map(UsuarioResponseMapper.paraResumo),
      meta: {
        total: resultado.total,
        pagina: resultado.pagina,
        ultimaPagina: resultado.ultimaPagina,
        limite: resultado.limite,
      },
    };
  }

  @Get(":usuarioId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(ConsultarUsuarioResponseDto)
  async consultar(
    @Param() params: UsuarioParamsDto,
  ): Promise<ConsultarUsuarioResponse> {
    const usuario = await this.usuariosService.consultar(params.usuarioId);

    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Usuário encontrado com sucesso.",
      dados: UsuarioResponseMapper.paraDetalhe(usuario),
    };
  }

  @Post()
  @PerfisPermitidos("ADMINISTRADOR")
  @HttpCode(HttpStatus.CREATED)
  @ZodSerializerDto(CriarUsuarioResponseDto)
  async criar(
    @Body() body: CriarUsuarioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<CriarUsuarioResponse> {
    const usuario = await this.usuariosService.criar(
      body,
      request.identidadeAutenticada!,
    );

    return {
      status: HttpStatus.CREATED,
      sucesso: true,
      mensagem: "Usuário criado com sucesso.",
      dados: UsuarioResponseMapper.paraDetalhe(usuario),
    };
  }

  @Patch(":usuarioId")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarUsuarioResponseDto)
  async alterar(
    @Param() params: UsuarioParamsDto,
    @Body() body: AlterarUsuarioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<AlterarUsuarioResponse> {
    const usuario = await this.usuariosService.alterar(
      params.usuarioId,
      body,
      request.identidadeAutenticada!,
    );

    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Usuário alterado com sucesso.",
      dados: UsuarioResponseMapper.paraDetalhe(usuario),
    };
  }

  @Patch(":usuarioId/situacao")
  @PerfisPermitidos("ADMINISTRADOR")
  @ZodSerializerDto(AlterarSituacaoUsuarioResponseDto)
  async alterarSituacao(
    @Param() params: UsuarioParamsDto,
    @Body() body: AlterarSituacaoUsuarioBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<AlterarSituacaoUsuarioResponse> {
    const usuario = await this.usuariosService.alterarSituacao(
      params.usuarioId,
      body,
      request.identidadeAutenticada!,
    );

    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: body.ativo
        ? "Usuário ativado com sucesso."
        : "Usuário inativado com sucesso.",
      dados: UsuarioResponseMapper.paraDetalhe(usuario),
    };
  }
}
