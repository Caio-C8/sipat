import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { PerfilUsuario } from "@repo/contracts";
import {
  CHAVE_PERFIS_PERMITIDOS,
  CHAVE_PERMITE_TROCA_SENHA_OBRIGATORIA,
  CHAVE_ROTA_PUBLICA,
} from "../auth.constants";
import type { RequisicaoAutenticada } from "../auth.types";

@Injectable()
export class AutorizacaoGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const publica = this.reflector.getAllAndOverride<boolean>(
      CHAVE_ROTA_PUBLICA,
      [context.getHandler(), context.getClass()],
    );

    if (publica) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequisicaoAutenticada>();
    const identidade = request.identidadeAutenticada;

    if (identidade === undefined) {
      throw new UnauthorizedException();
    }

    const permiteTrocaSenhaObrigatoria =
      this.reflector.getAllAndOverride<boolean>(
        CHAVE_PERMITE_TROCA_SENHA_OBRIGATORIA,
        [context.getHandler(), context.getClass()],
      ) ?? false;

    if (identidade.trocaSenhaObrigatoria && !permiteTrocaSenhaObrigatoria) {
      throw new ForbiddenException({
        codigo: "TROCA_SENHA_OBRIGATORIA",
        mensagem: "A senha inicial deve ser substituída antes de continuar.",
        erros: [],
      });
    }

    const perfis = this.reflector.getAllAndOverride<readonly PerfilUsuario[]>(
      CHAVE_PERFIS_PERMITIDOS,
      [context.getHandler(), context.getClass()],
    );

    if (perfis === undefined || !perfis.includes(identidade.perfil)) {
      throw new ForbiddenException();
    }

    return true;
  }
}
