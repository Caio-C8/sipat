import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import type { AppEnvironment } from "@repo/contracts";
import type { EnvironmentVariables } from "../../../environment";
import { CHAVE_ROTA_PUBLICA } from "../auth.constants";
import type { RequisicaoAutenticada } from "../auth.types";
import { AuthService } from "../auth.service";
import { extrairTokenSessao } from "../token-sessao";

@Injectable()
export class AutenticacaoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(
      CHAVE_ROTA_PUBLICA,
      [context.getHandler(), context.getClass()],
    );

    if (publica) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequisicaoAutenticada>();
    const ambiente = this.config.getOrThrow("APP_ENV", {
      infer: true,
    }) as AppEnvironment;
    const token = extrairTokenSessao(request.cookies, ambiente);
    const identidade = await this.authService.autenticar(token);

    if (identidade === null) {
      throw new UnauthorizedException();
    }

    request.identidadeAutenticada = identidade;
    return true;
  }
}
