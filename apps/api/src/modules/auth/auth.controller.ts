import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  SetMetadata,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  MENSAGEM_SOLICITACAO_REDEFINICAO_SENHA,
  type SolicitarRedefinicaoSenhaResponse,
  type AppEnvironment,
  type AuthMeResponse,
  type LoginResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { EnvironmentVariables } from "../../environment";
import { AuthService } from "./auth.service";
import {
  CHAVE_ISENTA_CSRF_SOLICITACAO_PUBLICA,
  CHAVE_PERMITE_TROCA_SENHA_OBRIGATORIA,
} from "./auth.constants";
import type { RequisicaoAutenticada } from "./auth.types";
import { PerfisPermitidos } from "./decorators/perfis-permitidos.decorator";
import { Publica } from "./decorators/publica.decorator";
import {
  AlterarSenhaBodyDto,
  AuthMeResponseDto,
  ConcluirPrimeiroAcessoBodyDto,
  LoginBodyDto,
  LoginResponseDto,
  RedefinirSenhaBodyDto,
  SolicitarRedefinicaoSenhaBodyDto,
  SolicitarRedefinicaoSenhaResponseDto,
} from "./dtos";
import {
  extrairTokenSessao,
  obterNomeCookieSessao,
  obterOpcoesCriacaoCookieSessao,
  obterOpcoesExpiracaoCookieSessao,
} from "./token-sessao";

interface RespostaComCookie {
  cookie(
    nome: string,
    valor: string,
    opcoes: ReturnType<typeof obterOpcoesCriacaoCookieSessao>,
  ): void;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Post("login")
  @Publica()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(LoginResponseDto)
  async login(
    @Body() body: LoginBodyDto,
    @Res({ passthrough: true }) response: RespostaComCookie,
  ): Promise<LoginResponse> {
    const resultado = await this.authService.login(body);
    const ambiente = this.obterAmbiente();

    response.cookie(
      obterNomeCookieSessao(ambiente),
      resultado.token,
      obterOpcoesCriacaoCookieSessao(ambiente),
    );

    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Autenticação realizada com sucesso.",
      dados: resultado.identidade,
    };
  }

  @Get("me")
  @SetMetadata(CHAVE_PERMITE_TROCA_SENHA_OBRIGATORIA, true)
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(AuthMeResponseDto)
  me(@Req() request: RequisicaoAutenticada): AuthMeResponse {
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Identidade autenticada consultada com sucesso.",
      dados: request.identidadeAutenticada!,
    };
  }

  @Post("concluir-primeiro-acesso")
  @SetMetadata(CHAVE_PERMITE_TROCA_SENHA_OBRIGATORIA, true)
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.NO_CONTENT)
  async concluirPrimeiroAcesso(
    @Body() body: ConcluirPrimeiroAcessoBodyDto,
    @Req() request: RequisicaoAutenticada,
    @Res({ passthrough: true }) response: RespostaComCookie,
  ): Promise<void> {
    const resultado = await this.authService.concluirPrimeiroAcesso(
      request.identidadeAutenticada!.id,
      body,
    );
    const ambiente = this.obterAmbiente();

    response.cookie(
      obterNomeCookieSessao(ambiente),
      resultado.token,
      obterOpcoesCriacaoCookieSessao(ambiente),
    );
  }

  @Post("alterar-senha")
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @HttpCode(HttpStatus.NO_CONTENT)
  async alterarSenha(
    @Body() body: AlterarSenhaBodyDto,
    @Req() request: RequisicaoAutenticada,
    @Res({ passthrough: true }) response: RespostaComCookie,
  ): Promise<void> {
    await this.authService.alterarSenha(
      request.identidadeAutenticada!.id,
      body,
    );

    const ambiente = this.obterAmbiente();
    response.cookie(
      obterNomeCookieSessao(ambiente),
      "",
      obterOpcoesExpiracaoCookieSessao(ambiente),
    );
  }

  @Post("esqueceu-senha")
  @Publica()
  @SetMetadata(CHAVE_ISENTA_CSRF_SOLICITACAO_PUBLICA, true)
  @HttpCode(HttpStatus.ACCEPTED)
  @ZodSerializerDto(SolicitarRedefinicaoSenhaResponseDto)
  async solicitarRedefinicaoSenha(
    @Body() body: SolicitarRedefinicaoSenhaBodyDto,
  ): Promise<SolicitarRedefinicaoSenhaResponse> {
    await this.authService.solicitarRedefinicaoSenha(body);

    return {
      status: HttpStatus.ACCEPTED,
      sucesso: true,
      mensagem: MENSAGEM_SOLICITACAO_REDEFINICAO_SENHA,
    };
  }

  @Post("redefinir-senha")
  @Publica()
  @HttpCode(HttpStatus.NO_CONTENT)
  async redefinirSenha(@Body() body: RedefinirSenhaBodyDto): Promise<void> {
    await this.authService.redefinirSenha(body);
  }

  @Post("logout")
  @Publica()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: RequisicaoAutenticada,
    @Res({ passthrough: true }) response: RespostaComCookie,
  ): Promise<void> {
    const ambiente = this.obterAmbiente();
    const token = extrairTokenSessao(request.cookies, ambiente);

    await this.authService.logout(token);
    response.cookie(
      obterNomeCookieSessao(ambiente),
      "",
      obterOpcoesExpiracaoCookieSessao(ambiente),
    );
  }

  private obterAmbiente(): AppEnvironment {
    return this.config.getOrThrow("APP_ENV", {
      infer: true,
    }) as AppEnvironment;
  }
}
