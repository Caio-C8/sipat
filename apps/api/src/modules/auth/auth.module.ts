import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "../../common/database/database.module";
import { AuthService } from "./auth.service";
import { AutenticacaoGuard } from "./guards/autenticacao.guard";
import { AutorizacaoGuard } from "./guards/autorizacao.guard";
import { CsrfGuard } from "./guards/csrf.guard";
import { SessaoRepository } from "./sessao.repository";

@Module({
  imports: [DatabaseModule],
  providers: [
    SessaoRepository,
    AuthService,
    { provide: APP_GUARD, useClass: AutenticacaoGuard },
    { provide: APP_GUARD, useClass: AutorizacaoGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
