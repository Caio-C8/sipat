import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AppEnvironment,
  AuthMeResponse,
  LoginResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import type { EnvironmentVariables } from "../../environment";
import { AuthService } from "./auth.service";
import type { RequisicaoAutenticada } from "./auth.types";
import { PerfisPermitidos } from "./decorators/perfis-permitidos.decorator";
import { Publica } from "./decorators/publica.decorator";
import {
  AlterarSenhaBodyDto,
  AuthMeResponseDto,
  LoginBodyDto,
  LoginResponseDto,
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
