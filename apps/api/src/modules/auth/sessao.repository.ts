import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import type { SessaoParaAutenticacao } from "./auth.types";

const sessaoParaAutenticacaoSelect = {
  expiresAt: true,
  revokedAt: true,
  usuario: {
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
    },
  },
} satisfies Prisma.SessaoUsuarioSelect;

@Injectable()
export class SessaoRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  async buscarPorTokenHash(
    tokenHash: string,
  ): Promise<SessaoParaAutenticacao | null> {
    return this.database.sessaoUsuario.findUnique({
      where: { tokenHash },
      select: sessaoParaAutenticacaoSelect,
    });
  }
}
