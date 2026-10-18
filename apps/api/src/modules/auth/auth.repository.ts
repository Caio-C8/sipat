import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import type { UsuarioParaLogin } from "./auth.types";

type ClienteAuth = DatabaseClient | Prisma.TransactionClient;

const usuarioParaLoginSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  senha: true,
} satisfies Prisma.UsuarioSelect;

interface CriarSessaoData {
  usuarioId: string;
  tokenHash: string;
  expiresAt: Date;
  lastActivityAt: Date;
}

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClienteAuth,
  ) {}

  buscarUsuarioParaLogin(email: string): Promise<UsuarioParaLogin | null> {
    return this.database.usuario.findUnique({
      where: { email },
      select: usuarioParaLoginSelect,
    });
  }

  async reservarTentativaLogin(
    chaveHash: string,
    agora: Date,
    maximoTentativas: number,
    janelaMs: number,
  ): Promise<Date | null> {
    const novaExpiracao = new Date(agora.getTime() + janelaMs);
    const marcadorBloqueado = maximoTentativas + 1;
    const [registro] = await this.database.$queryRaw<
      Array<{ tentativas: number; janelaExpiraAt: Date }>
    >`
      INSERT INTO "tentativas_login" (
        "chave_hash",
        "tentativas",
        "janela_expira_at",
        "updated_at"
      )
      VALUES (${chaveHash}, 1, ${novaExpiracao}, CURRENT_TIMESTAMP)
      ON CONFLICT ("chave_hash") DO UPDATE SET
        "tentativas" = CASE
          WHEN "tentativas_login"."janela_expira_at" <= ${agora} THEN 1
          ELSE LEAST(
            "tentativas_login"."tentativas" + 1,
            ${marcadorBloqueado}
          )
        END,
        "janela_expira_at" = CASE
          WHEN "tentativas_login"."janela_expira_at" <= ${agora}
            THEN ${novaExpiracao}
          ELSE "tentativas_login"."janela_expira_at"
        END,
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING
        "tentativas",
        "janela_expira_at" AS "janelaExpiraAt"
    `;

    if (!registro) {
      throw new Error("O contador de tentativas não retornou estado.");
    }

    return registro.tentativas > maximoTentativas
      ? registro.janelaExpiraAt
      : null;
  }

  async limparTentativasLogin(chaveHash: string): Promise<void> {
    await this.database.tentativaLogin.deleteMany({ where: { chaveHash } });
  }

  async limparTentativasExpiradas(
    agora: Date,
    tamanhoLote: number,
  ): Promise<number> {
    const expiradas = await this.database.tentativaLogin.findMany({
      where: { janelaExpiraAt: { lte: agora } },
      orderBy: [{ janelaExpiraAt: "asc" }, { chaveHash: "asc" }],
      take: tamanhoLote,
      select: { chaveHash: true },
    });

    if (expiradas.length === 0) {
      return 0;
    }

    const resultado = await this.database.tentativaLogin.deleteMany({
      where: {
        chaveHash: { in: expiradas.map(({ chaveHash }) => chaveHash) },
        janelaExpiraAt: { lte: agora },
      },
    });

    return resultado.count;
  }

  async atualizarUltimoLoginSeAtivo(
    usuarioId: string,
    agora: Date,
  ): Promise<boolean> {
    const resultado = await this.database.usuario.updateMany({
      where: { id: usuarioId, ativo: true },
      data: { ultimoLoginAt: agora, updatedAt: agora },
    });

    return resultado.count === 1;
  }

  async listarSessoesAtivas(
    usuarioId: string,
    agora: Date,
    limiteInatividade: Date,
  ): Promise<Array<{ id: string }>> {
    return this.database.sessaoUsuario.findMany({
      where: {
        usuarioId,
        revokedAt: null,
        expiresAt: { gt: agora },
        lastActivityAt: { gt: limiteInatividade },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
  }

  async revogarSessoes(ids: readonly string[], agora: Date): Promise<void> {
    if (ids.length === 0) return;

    await this.database.sessaoUsuario.updateMany({
      where: { id: { in: [...ids] }, revokedAt: null },
      data: { revokedAt: agora },
    });
  }

  async criarSessao(data: CriarSessaoData): Promise<void> {
    await this.database.sessaoUsuario.create({ data });
  }

  executarTransacaoSerializavel<T>(
    operacao: (repository: AuthRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database)) {
      throw new Error(
        "Uma transação não pode ser iniciada dentro de outra transação.",
      );
    }

    return this.database.$transaction(
      (transaction) => operacao(new AuthRepository(transaction)),
      { isolationLevel: "Serializable" },
    );
  }
}
