import {
  AlterarSenhaBodySchema,
  AuthMeResponseSchema,
  ConcluirPrimeiroAcessoBodySchema,
  LoginBodySchema,
  LoginResponseSchema,
  MobileConcluirPrimeiroAcessoResponseSchema,
  MobileLoginBodySchema,
  MobileLoginResponseSchema,
  MobileMeResponseSchema,
  MobileRefreshResponseSchema,
  RedefinirSenhaBodySchema,
  SolicitarRedefinicaoSenhaBodySchema,
  SolicitarRedefinicaoSenhaResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class LoginBodyDto extends createZodDto(LoginBodySchema) {}
export class AlterarSenhaBodyDto extends createZodDto(AlterarSenhaBodySchema) {}
export class ConcluirPrimeiroAcessoBodyDto extends createZodDto(
  ConcluirPrimeiroAcessoBodySchema,
) {}
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}
export class AuthMeResponseDto extends createZodDto(AuthMeResponseSchema) {}
export class SolicitarRedefinicaoSenhaBodyDto extends createZodDto(
  SolicitarRedefinicaoSenhaBodySchema,
) {}
export class SolicitarRedefinicaoSenhaResponseDto extends createZodDto(
  SolicitarRedefinicaoSenhaResponseSchema,
) {}
export class RedefinirSenhaBodyDto extends createZodDto(
  RedefinirSenhaBodySchema,
) {}
export class MobileLoginBodyDto extends createZodDto(MobileLoginBodySchema) {}
export class MobileLoginResponseDto extends createZodDto(
  MobileLoginResponseSchema,
) {}
export class MobileRefreshResponseDto extends createZodDto(
  MobileRefreshResponseSchema,
) {}
export class MobileMeResponseDto extends createZodDto(MobileMeResponseSchema) {}
export class MobileConcluirPrimeiroAcessoResponseDto extends createZodDto(
  MobileConcluirPrimeiroAcessoResponseSchema,
) {}
