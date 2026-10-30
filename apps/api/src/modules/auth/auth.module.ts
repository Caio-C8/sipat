import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "../../common/database/database.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MobileAuthController } from "./mobile-auth.controller";
import { AuthRepository } from "./auth.repository";
import { CapacidadeArgon2 } from "./capacidade-argon2";
import { AutenticacaoGuard } from "./guards/autenticacao.guard";
import { AutorizacaoGuard } from "./guards/autorizacao.guard";
import { CsrfGuard } from "./guards/csrf.guard";
import { SessaoRepository } from "./sessao.repository";
import { SenhaHasher } from "../../common/security/senha-hasher";
import { DespachanteEmailAuth } from "./despachante-email";
import { PORTA_EMAIL_AUTH } from "./email.types";
import { SmtpEmailAdapter } from "./smtp-email.adapter";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController, MobileAuthController],
  providers: [
    SessaoRepository,
    AuthRepository,
    AuthService,
    SenhaHasher,
    CapacidadeArgon2,
    DespachanteEmailAuth,
    { provide: PORTA_EMAIL_AUTH, useClass: SmtpEmailAdapter },
    { provide: APP_GUARD, useClass: AutenticacaoGuard },
    { provide: APP_GUARD, useClass: AutorizacaoGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  exports: [AuthService, SenhaHasher],
})
export class AuthModule {}
