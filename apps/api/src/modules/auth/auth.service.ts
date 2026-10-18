import { Injectable } from "@nestjs/common";
import {
  type IdentidadeAutenticada,
  IdentidadeAutenticadaSchema,
} from "@repo/contracts";
import { SessaoRepository } from "./sessao.repository";
import { calcularHashTokenSessao } from "./token-sessao";

@Injectable()
export class AuthService {
  constructor(private readonly sessoes: SessaoRepository) {}

  async autenticar(token: unknown): Promise<IdentidadeAutenticada | null> {
    const tokenHash = calcularHashTokenSessao(token);

    if (tokenHash === null) {
      return null;
    }

    const sessao = await this.sessoes.buscarPorTokenHash(tokenHash);

    if (
      sessao === null ||
      sessao.revokedAt !== null ||
      sessao.expiresAt.getTime() <= Date.now() ||
      !sessao.usuario.ativo
    ) {
      return null;
    }

    const identidade = IdentidadeAutenticadaSchema.safeParse({
      id: sessao.usuario.id,
      nome: sessao.usuario.nome,
      email: sessao.usuario.email,
      perfil: sessao.usuario.perfil,
    });

    return identidade.success ? identidade.data : null;
  }
}
