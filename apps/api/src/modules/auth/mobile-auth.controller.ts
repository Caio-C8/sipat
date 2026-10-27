import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  SetMetadata,
} from "@nestjs/common";
import {
  type MobileConcluirPrimeiroAcessoResponse,
  type MobileLoginResponse,
  type MobileMeResponse,
  type MobileRefreshResponse,
} from "@repo/contracts";
import { ZodSerializerDto } from "nestjs-zod";
import { AuthService } from "./auth.service";
import {
  CHAVE_PERMITE_TROCA_SENHA_OBRIGATORIA,
  CHAVE_TRANSPORTE_AUTH_MOBILE,
} from "./auth.constants";
import type { RequisicaoAutenticada } from "./auth.types";
import { PerfisPermitidos } from "./decorators/perfis-permitidos.decorator";
import { Publica } from "./decorators/publica.decorator";
import {
  ConcluirPrimeiroAcessoBodyDto,
  MobileConcluirPrimeiroAcessoResponseDto,
  MobileLoginBodyDto,
  MobileLoginResponseDto,
  MobileMeResponseDto,
  MobileRefreshResponseDto,
} from "./dtos";
import { extrairBearer } from "./token-mobile";

@Controller("auth/mobile")
export class MobileAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Publica()
  @SetMetadata(CHAVE_TRANSPORTE_AUTH_MOBILE, "public")
  @Header("Cache-Control", "no-store")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MobileLoginResponseDto)
  async login(@Body() body: MobileLoginBodyDto): Promise<MobileLoginResponse> {
    const resultado = await this.authService.loginMobile(body);
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Autenticação mobile realizada com sucesso.",
      dados: resultado,
    };
  }

  @Post("refresh")
  @Publica()
  @SetMetadata(CHAVE_TRANSPORTE_AUTH_MOBILE, "refresh")
  @Header("Cache-Control", "no-store")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MobileRefreshResponseDto)
  async refresh(
    @Req() request: RequisicaoAutenticada,
  ): Promise<MobileRefreshResponse> {
    const credenciais = await this.authService.refreshMobile(
      extrairBearer(request.headers),
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Sessão mobile renovada com sucesso.",
      dados: credenciais,
    };
  }

  @Get("me")
  @SetMetadata(CHAVE_TRANSPORTE_AUTH_MOBILE, "access")
  @SetMetadata(CHAVE_PERMITE_TROCA_SENHA_OBRIGATORIA, true)
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @ZodSerializerDto(MobileMeResponseDto)
  me(@Req() request: RequisicaoAutenticada): MobileMeResponse {
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Identidade mobile autenticada consultada com sucesso.",
      dados: request.identidadeAutenticada!,
    };
  }

  @Post("concluir-primeiro-acesso")
  @SetMetadata(CHAVE_TRANSPORTE_AUTH_MOBILE, "access")
  @SetMetadata(CHAVE_PERMITE_TROCA_SENHA_OBRIGATORIA, true)
  @PerfisPermitidos("ADMINISTRADOR", "DIRETOR_PATRIMONIO")
  @Header("Cache-Control", "no-store")
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(MobileConcluirPrimeiroAcessoResponseDto)
  async concluirPrimeiroAcesso(
    @Body() body: ConcluirPrimeiroAcessoBodyDto,
    @Req() request: RequisicaoAutenticada,
  ): Promise<MobileConcluirPrimeiroAcessoResponse> {
    const resultado = await this.authService.concluirPrimeiroAcessoMobile(
      request.identidadeAutenticada!.id,
      body,
    );
    return {
      status: HttpStatus.OK,
      sucesso: true,
      mensagem: "Primeiro acesso mobile concluído com sucesso.",
      dados: resultado,
    };
  }

  @Post("logout")
  @Publica()
  @SetMetadata(CHAVE_TRANSPORTE_AUTH_MOBILE, "refresh")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: RequisicaoAutenticada): Promise<void> {
    await this.authService.logoutMobile(extrairBearer(request.headers));
  }
}
