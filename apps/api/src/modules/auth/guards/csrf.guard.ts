import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CABECALHO_CSRF, VALOR_CABECALHO_CSRF } from "@repo/contracts";
import { parsearOrigensCors } from "../../../common/http/origens-cors";
import type { EnvironmentVariables } from "../../../environment";
import { METODOS_PROTEGIDOS_POR_CSRF } from "../auth.constants";
import type { RequisicaoAutenticada } from "../auth.types";

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequisicaoAutenticada>();

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
