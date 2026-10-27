import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import type {
  RefreshMobileParaUso,
  RedefinicaoSenhaParaConsumo,
  SessaoParaAutenticacao,
  UsuarioParaAlteracaoSenha,
  UsuarioParaLogin,
  UsuarioParaRecuperacaoSenha,
} from "./auth.types";

type ClienteAuth = DatabaseClient | Prisma.TransactionClient;

const usuarioParaLoginSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  senha: true,
  trocaSenhaObrigatoria: true,
} satisfies Prisma.UsuarioSelect;

interface CriarSessaoData {
  usuarioId: string;
  tokenHash: string;
  expiraAt: Date;
  ultimaAtividadeAt: Date;
  tipo?: "WEB" | "MOBILE";
  accessExpiraAt?: Date;
}

const sessaoMobileParaAutenticacaoSelect = {
  id: true,
  expiraAt: true,
  accessExpiraAt: true,
  ultimaAtividadeAt: true,
  revogadoAt: true,
  tipo: true,
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

  buscarUsuarioAtivoPorId(usuarioId: string): Promise<UsuarioParaLogin | null> {
    return this.database.usuario.findFirst({
      where: { id: usuarioId, ativo: true },
      select: usuarioParaLoginSelect,
    });
  }

  buscarUsuarioParaAlteracaoSenha(
    usuarioId: string,
  ): Promise<UsuarioParaAlteracaoSenha | null> {
    return this.database.usuario.findUnique({
      where: { id: usuarioId },
      select: { ativo: true, senha: true },
    });
  }

  buscarUsuarioAtivoParaRecuperacao(
    email: string,
  ): Promise<UsuarioParaRecuperacaoSenha | null> {
    return this.database.usuario.findFirst({
      where: { email, ativo: true },
      select: { id: true, email: true },
    });
  }

  buscarRedefinicaoParaConsumo(
    tokenHash: string,
  ): Promise<RedefinicaoSenhaParaConsumo | null> {
    return this.database.redefinicaoSenha.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        tokenHash: true,
        expiraAt: true,
        consumidoAt: true,
        usuario: {
          select: { id: true, email: true, ativo: true, senha: true },
        },
      },
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

  async reservarTentativaOperacaoSenha(
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
      INSERT INTO "tentativas_operacoes_senha" (
        "chave_hash",
        "tentativas",
        "janela_expira_at",
        "updated_at"
      )
      VALUES (${chaveHash}, 1, ${novaExpiracao}, CURRENT_TIMESTAMP)
      ON CONFLICT ("chave_hash") DO UPDATE SET
        "tentativas" = CASE
          WHEN "tentativas_operacoes_senha"."janela_expira_at" <= ${agora} THEN 1
          ELSE LEAST(
            "tentativas_operacoes_senha"."tentativas" + 1,
            ${marcadorBloqueado}
          )
        END,
        "janela_expira_at" = CASE
          WHEN "tentativas_operacoes_senha"."janela_expira_at" <= ${agora}
            THEN ${novaExpiracao}
          ELSE "tentativas_operacoes_senha"."janela_expira_at"
        END,
        "updated_at" = CURRENT_TIMESTAMP
      RETURNING
        "tentativas",
        "janela_expira_at" AS "janelaExpiraAt"
    `;

    if (!registro) {
      throw new Error("O contador de operações de senha não retornou estado.");
    }

    return registro.tentativas > maximoTentativas
      ? registro.janelaExpiraAt
      : null;
  }

  async limparTentativasOperacaoSenha(chaveHash: string): Promise<void> {
    await this.database.tentativaOperacaoSenha.deleteMany({
      where: { chaveHash },
    });
  }

  async limparTentativasOperacaoSenhaExpiradas(
    agora: Date,
    tamanhoLote: number,
  ): Promise<number> {
    const expiradas = await this.database.tentativaOperacaoSenha.findMany({
      where: { janelaExpiraAt: { lte: agora } },
      orderBy: [{ janelaExpiraAt: "asc" }, { chaveHash: "asc" }],
      take: tamanhoLote,
      select: { chaveHash: true },
    });

    if (expiradas.length === 0) return 0;

    const resultado = await this.database.tentativaOperacaoSenha.deleteMany({
      where: {
        chaveHash: { in: expiradas.map(({ chaveHash }) => chaveHash) },
        janelaExpiraAt: { lte: agora },
      },
    });

    return resultado.count;
  }

  async substituirRedefinicaoSenha(
    usuarioId: string,
    tokenHash: string,
    expiraAt: Date,
    agora: Date,
  ): Promise<void> {
    await this.database.redefinicaoSenha.upsert({
      where: { usuarioId },
      create: { usuarioId, tokenHash, expiraAt },
      update: {
        tokenHash,
        expiraAt,
        consumidoAt: null,
        createdAt: agora,
        updatedAt: agora,
      },
    });
  }

  async consumirRedefinicaoSenhaSeValida(
    id: string,
    tokenHash: string,
    agora: Date,
  ): Promise<boolean> {
    const resultado = await this.database.redefinicaoSenha.updateMany({
      where: {
        id,
        tokenHash,
        consumidoAt: null,
        expiraAt: { gt: agora },
        usuario: { ativo: true },
      },
      data: { consumidoAt: agora },
    });

    return resultado.count === 1;
  }

  async invalidarRedefinicaoSenha(
    usuarioId: string,
    agora: Date,
  ): Promise<void> {
    await this.database.redefinicaoSenha.updateMany({
      where: { usuarioId, consumidoAt: null },
      data: { consumidoAt: agora },
    });
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

  async atualizarSenhaSeAtual(
    usuarioId: string,
    senhaHashAtual: string,
    novaSenhaHash: string,
    agora: Date,
  ): Promise<boolean> {
    const resultado = await this.database.usuario.updateMany({
      where: { id: usuarioId, ativo: true, senha: senhaHashAtual },
      data: { senha: novaSenhaHash, updatedAt: agora },
    });

    return resultado.count === 1;
  }

  async concluirPrimeiroAcessoSePendente(
    usuarioId: string,
    novaSenhaHash: string,
    agora: Date,
  ): Promise<boolean> {
    const resultado = await this.database.usuario.updateMany({
      where: {
        id: usuarioId,
        ativo: true,
        trocaSenhaObrigatoria: true,
      },
      data: {
        senha: novaSenhaHash,
        trocaSenhaObrigatoria: false,
        updatedAt: agora,
      },
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
        revogadoAt: null,
        expiraAt: { gt: agora },
        ultimaAtividadeAt: { gt: limiteInatividade },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
  }

  async revogarSessoes(ids: readonly string[], agora: Date): Promise<void> {
    if (ids.length === 0) return;

    await this.database.sessaoUsuario.updateMany({
      where: { id: { in: [...ids] }, revogadoAt: null },
      data: { revogadoAt: agora },
    });
  }

  async revogarTodasSessoes(usuarioId: string, agora: Date): Promise<void> {
    await this.database.sessaoUsuario.updateMany({
      where: { usuarioId, revogadoAt: null },
      data: { revogadoAt: agora },
    });
  }

  async criarSessao(data: CriarSessaoData): Promise<void> {
    await this.database.sessaoUsuario.create({
      data: { ...data, tipo: "WEB", accessExpiraAt: null },
    });
  }

  async criarSessaoMobile(
    data: Required<CriarSessaoData>,
    refreshTokenHash: string,
  ): Promise<void> {
    await this.database.sessaoUsuario.create({
      data: {
        ...data,
        refreshTokens: {
          create: { tokenHash: refreshTokenHash, expiraAt: data.expiraAt },
        },
      },
    });
  }

  buscarSessaoMobilePorAccessHash(
    tokenHash: string,
  ): Promise<SessaoParaAutenticacao | null> {
    return this.database.sessaoUsuario.findFirst({
      where: { tokenHash, tipo: "MOBILE" },
      select: sessaoMobileParaAutenticacaoSelect,
    });
  }

  buscarRefreshMobilePorHash(
    tokenHash: string,
  ): Promise<RefreshMobileParaUso | null> {
    return this.database.sessaoMobileRefresh.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        tokenHash: true,
        expiraAt: true,
        usadoAt: true,
        sessao: { select: sessaoMobileParaAutenticacaoSelect },
      },
    });
  }

  async consumirRefreshMobile(id: string, agora: Date): Promise<boolean> {
    const resultado = await this.database.sessaoMobileRefresh.updateMany({
      where: { id, usadoAt: null, expiraAt: { gt: agora } },
      data: { usadoAt: agora },
    });
    return resultado.count === 1;
  }

  async rotacionarCredenciaisMobile(
    sessaoId: string,
    accessTokenHash: string,
    accessExpiraAt: Date,
    refreshTokenHash: string,
    sessaoExpiraAt: Date,
    agora: Date,
  ): Promise<boolean> {
    const atualizada = await this.database.sessaoUsuario.updateMany({
      where: {
        id: sessaoId,
        tipo: "MOBILE",
        revogadoAt: null,
        expiraAt: { gt: agora },
      },
      data: {
        tokenHash: accessTokenHash,
        accessExpiraAt,
        ultimaAtividadeAt: agora,
      },
    });
    if (atualizada.count !== 1) return false;

    await this.database.sessaoMobileRefresh.create({
      data: {
        sessaoId,
        tokenHash: refreshTokenHash,
        expiraAt: sessaoExpiraAt,
      },
    });
    return true;
  }

  async atualizarAtividadeMobileSeNecessario(
    sessaoId: string,
    atividadeAnterior: Date,
    limiteAtualizacao: Date,
    agora: Date,
  ): Promise<void> {
    await this.database.sessaoUsuario.updateMany({
      where: {
        id: sessaoId,
        tipo: "MOBILE",
        ultimaAtividadeAt: atividadeAnterior,
        revogadoAt: null,
        expiraAt: { gt: agora },
        AND: { ultimaAtividadeAt: { lte: limiteAtualizacao } },
      },
      data: { ultimaAtividadeAt: agora },
    });
  }

  async revogarSessaoPorId(sessaoId: string, agora: Date): Promise<void> {
    await this.database.sessaoUsuario.updateMany({
      where: { id: sessaoId, revogadoAt: null },
      data: { revogadoAt: agora },
    });
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
