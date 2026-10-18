import {
  AlterarSenhaBodySchema,
  AuthMeResponseSchema,
  LoginBodySchema,
  LoginResponseSchema,
} from "@repo/contracts";
import { createZodDto } from "nestjs-zod";

export class LoginBodyDto extends createZodDto(LoginBodySchema) {}
export class AlterarSenhaBodyDto extends createZodDto(AlterarSenhaBodySchema) {}
export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}
export class AuthMeResponseDto extends createZodDto(AuthMeResponseSchema) {}
