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
import {
  CHAVE_ROTA_PUBLICA,
  CHAVE_TRANSPORTE_AUTH_MOBILE,
} from "../auth.constants";
import type { RequisicaoAutenticada } from "../auth.types";
import { AuthService } from "../auth.service";
import { extrairTokenSessao } from "../token-sessao";
import { extrairBearer, possuiAuthorization } from "../token-mobile";

@Injectable()
export class AutenticacaoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequisicaoAutenticada>();
    const ambiente = this.config.getOrThrow("APP_ENV", {
      infer: true,
    }) as AppEnvironment;
    const tokenCookie = extrairTokenSessao(request.cookies, ambiente);
    const temBearer = possuiAuthorization(request.headers);
    const bearer = extrairBearer(request.headers);
    if (tokenCookie !== undefined && temBearer) {
      throw new UnauthorizedException();
    }

    const transporteMobile = this.reflector.getAllAndOverride<
      "public" | "access" | "refresh"
    >(CHAVE_TRANSPORTE_AUTH_MOBILE, [context.getHandler(), context.getClass()]);
    if (transporteMobile === "public") return true;
    if (transporteMobile === "refresh") {
      if (bearer === null || tokenCookie !== undefined) {
        throw new UnauthorizedException();
      }
      request.transporteAutenticacao = "bearer";
      return true;
    }

    const publica = this.reflector.getAllAndOverride<boolean>(
      CHAVE_ROTA_PUBLICA,
      [context.getHandler(), context.getClass()],
    );
    if (publica) return true;

    if (transporteMobile === "access" && bearer === null) {
      throw new UnauthorizedException();
    }

    const identidade =
      bearer !== null
        ? await this.authService.autenticarAccessMobile(bearer)
        : await this.authService.autenticar(tokenCookie);

    if (identidade === null) {
      throw new UnauthorizedException();
    }

    request.identidadeAutenticada = identidade;
    request.transporteAutenticacao = bearer !== null ? "bearer" : "cookie";
    return true;
  }
}
