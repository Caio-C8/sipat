import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { CABECALHO_CSRF, VALOR_CABECALHO_CSRF } from "@repo/contracts";
import { parsearOrigensCors } from "../../../common/http/origens-cors";
import type { EnvironmentVariables } from "../../../environment";
import {
  CHAVE_ISENTA_CSRF_SOLICITACAO_PUBLICA,
  CHAVE_TRANSPORTE_AUTH_MOBILE,
  METODOS_PROTEGIDOS_POR_CSRF,
} from "../auth.constants";
import type { RequisicaoAutenticada } from "../auth.types";

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequisicaoAutenticada>();

    const solicitacaoPublicaIsenta = this.reflector.getAllAndOverride<boolean>(
      CHAVE_ISENTA_CSRF_SOLICITACAO_PUBLICA,
      [context.getHandler()],
    );
    if (solicitacaoPublicaIsenta === true) return true;

    const transporteMobile = this.reflector.getAllAndOverride<string>(
      CHAVE_TRANSPORTE_AUTH_MOBILE,
      [context.getHandler(), context.getClass()],
    );
    if (
      request.transporteAutenticacao === "bearer" ||
      transporteMobile !== undefined
    ) {
      return true;
    }

    if (!METODOS_PROTEGIDOS_POR_CSRF.has(request.method.toUpperCase())) {
      return true;
    }

    const origem = request.headers.origin;
    const origensPermitidas = parsearOrigensCors(
      this.config.getOrThrow("CORS_ORIGINS", { infer: true }),
    );

    if (
      typeof origem !== "string" ||
      origem === "null" ||
      !origensPermitidas.includes(origem)
    ) {
      throw new ForbiddenException();
    }

    const valorCsrf = request.headers[CABECALHO_CSRF.toLowerCase()];

    if (valorCsrf !== VALOR_CABECALHO_CSRF) {
      throw new ForbiddenException();
    }

    return true;
  }
}
