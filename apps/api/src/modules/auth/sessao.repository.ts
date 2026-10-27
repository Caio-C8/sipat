import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import type { SessaoParaAutenticacao } from "./auth.types";

const sessaoParaAutenticacaoSelect = {
  id: true,
  expiraAt: true,
  ultimaAtividadeAt: true,
  revogadoAt: true,
  tipo: true,
  accessExpiraAt: true,
  usuario: {
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      trocaSenhaObrigatoria: true,
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

  async atualizarAtividadeSeNecessario(
    sessaoId: string,
    atividadeAnterior: Date,
    limiteAtualizacao: Date,
    agora: Date,
  ): Promise<void> {
    await this.database.sessaoUsuario.updateMany({
      where: {
        id: sessaoId,
        AND: [
          { ultimaAtividadeAt: atividadeAnterior },
          { ultimaAtividadeAt: { lte: limiteAtualizacao } },
        ],
        expiraAt: { gt: agora },
        revogadoAt: null,
      },
      data: { ultimaAtividadeAt: agora },
    });
  }

  async revogarPorTokenHash(tokenHash: string, agora: Date): Promise<void> {
    await this.database.sessaoUsuario.updateMany({
      where: { tokenHash, revogadoAt: null },
      data: { revogadoAt: agora },
    });
  }
}
