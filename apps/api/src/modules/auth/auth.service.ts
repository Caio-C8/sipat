import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  type AppEnvironment,
  type AlterarSenhaBody,
  type IdentidadeAutenticada,
  IdentidadeAutenticadaSchema,
  type LoginBody,
  type RedefinirSenhaBody,
  type SolicitarRedefinicaoSenhaBody,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { SenhaHasher } from "../../common/security/senha-hasher";
import { MuitasRequisicoesException } from "../../common/http/muitas-requisicoes.exception";
import type { EnvironmentVariables } from "../../environment";
import { AuthRepository } from "./auth.repository";
import {
  DURACAO_ABSOLUTA_SESSAO_MS,
  DURACAO_TOKEN_REDEFINICAO_SENHA_MS,
  INATIVIDADE_NOMINAL_SESSAO_MS,
  INTERVALO_ATUALIZACAO_ATIVIDADE_MS,
  MAXIMO_SESSOES_ATIVAS,
  MAXIMO_TENTATIVAS_TRANSACAO,
  POLITICA_RATE_LIMIT_LOGIN,
  TAMANHO_LOTE_LIMPEZA_RATE_LIMIT,
} from "./auth.constants";
import { CapacidadeArgon2 } from "./capacidade-argon2";
import { DespachanteEmailAuth } from "./despachante-email";
import {
  criarChaveRateLimitAlteracaoSenha,
  criarChaveRateLimitLogin,
  criarChaveRateLimitRecuperacaoSenha,
} from "./rate-limit-login";
import { SessaoRepository } from "./sessao.repository";
import { calcularHashTokenSessao, gerarTokenSessao } from "./token-sessao";
import {
  calcularHashTokenRedefinicaoSenha,
  gerarTokenRedefinicaoSenha,
} from "./token-redefinicao";
import type { LoginRealizado } from "./auth.types";

const HASH_FICTICIO =
  "$argon2id$v=19$m=19456,t=2,p=1$7k3jXdW9HljY+Hh5z2L9Lg$n+/QIxGmny4eYuES0YUW9KF2xQGYCuBsWb/EDz0cbU0";
const TROCA_SENHA_OBRIGATORIA_ATE_AUTH_004 = false;

@Injectable()
export class AuthService {
  constructor(
    private readonly sessoes: SessaoRepository,
    private readonly authRepository: AuthRepository,
    private readonly senhaHasher: SenhaHasher,
    private readonly capacidadeArgon2: CapacidadeArgon2,
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly despachanteEmail: DespachanteEmailAuth,
  ) {}

  async autenticar(token: unknown): Promise<IdentidadeAutenticada | null> {
    const tokenHash = calcularHashTokenSessao(token);

    if (tokenHash === null) {
      return null;
    }

    const sessao = await this.sessoes.buscarPorTokenHash(tokenHash);

    const agora = new Date();

    if (
      sessao === null ||
      sessao.revogadoAt !== null ||
      sessao.expiraAt.getTime() <= agora.getTime() ||
      sessao.ultimaAtividadeAt.getTime() + INATIVIDADE_NOMINAL_SESSAO_MS <=
        agora.getTime() ||
      !sessao.usuario.ativo
    ) {
      return null;
    }

    const identidade = IdentidadeAutenticadaSchema.safeParse({
      id: sessao.usuario.id,
      nome: sessao.usuario.nome,
      email: sessao.usuario.email,
      perfil: sessao.usuario.perfil,
      trocaSenhaObrigatoria: TROCA_SENHA_OBRIGATORIA_ATE_AUTH_004,
    });

    if (!identidade.success) {
      return null;
    }

    if (
      sessao.ultimaAtividadeAt.getTime() + INTERVALO_ATUALIZACAO_ATIVIDADE_MS <=
      agora.getTime()
    ) {
      await this.sessoes.atualizarAtividadeSeNecessario(
        sessao.id,
        sessao.ultimaAtividadeAt,
        new Date(agora.getTime() - INTERVALO_ATUALIZACAO_ATIVIDADE_MS),
        agora,
      );
    }

    return identidade.data;
  }

  login(dados: LoginBody): Promise<LoginRealizado> {
    return this.capacidadeArgon2.executar(() => this.executarLogin(dados));
  }

  async logout(token: unknown): Promise<void> {
    const tokenHash = calcularHashTokenSessao(token);

    if (tokenHash !== null) {
      await this.sessoes.revogarPorTokenHash(tokenHash, new Date());
    }
  }

  alterarSenha(usuarioId: string, dados: AlterarSenhaBody): Promise<void> {
    return this.capacidadeArgon2.executar(() =>
      this.executarAlteracaoSenha(usuarioId, dados),
    );
  }

  async solicitarRedefinicaoSenha(
    dados: SolicitarRedefinicaoSenhaBody,
  ): Promise<void> {
    if (!this.recuperacaoHabilitada()) return;
    const agora = new Date();
    const politica = POLITICA_RATE_LIMIT_LOGIN[this.obterAmbiente()];
    const chaveRateLimit = criarChaveRateLimitRecuperacaoSenha(
      dados.email,
      this.config.getOrThrow("AUTH_RATE_LIMIT_HMAC_SECRET", { infer: true }),
    );

    await this.authRepository.limparTentativasOperacaoSenhaExpiradas(
      agora,
      TAMANHO_LOTE_LIMPEZA_RATE_LIMIT,
    );
    const bloqueadoAte =
      await this.authRepository.reservarTentativaOperacaoSenha(
        chaveRateLimit,
        agora,
        politica.tentativas,
        politica.janelaMs,
      );

    if (bloqueadoAte !== null) {
      throw new MuitasRequisicoesException(
        Math.max(
          1,
          Math.ceil((bloqueadoAte.getTime() - agora.getTime()) / 1_000),
        ),
      );
    }

    const usuario = await this.authRepository.buscarUsuarioAtivoParaRecuperacao(
      dados.email,
    );
    if (usuario === null) return;

    const token = await this.criarRedefinicaoSenha(usuario.id, agora);
    const link = new URL(
      this.config.getOrThrow("AUTH_PASSWORD_RESET_URL", { infer: true }),
    );
    link.searchParams.set("token", token);
    this.despachanteEmail.despachar({
      tipo: "REDEFINIR_SENHA",
      destinatario: usuario.email,
      link: link.toString(),
    });
  }

  async redefinirSenha(dados: RedefinirSenhaBody): Promise<void> {
    if (!this.recuperacaoHabilitada()) {
      throw this.tokenRedefinicaoInvalido();
    }
    await this.capacidadeArgon2.executar(() =>
      this.executarRedefinicaoSenha(dados),
    );
  }

  private async executarAlteracaoSenha(
    usuarioId: string,
    dados: AlterarSenhaBody,
  ): Promise<void> {
    const agora = new Date();
    const ambiente = this.obterAmbiente();
    const politica = POLITICA_RATE_LIMIT_LOGIN[ambiente];
    const chaveRateLimit = criarChaveRateLimitAlteracaoSenha(
      usuarioId,
      this.config.getOrThrow("AUTH_RATE_LIMIT_HMAC_SECRET", { infer: true }),
    );

    await this.authRepository.limparTentativasOperacaoSenhaExpiradas(
      agora,
      TAMANHO_LOTE_LIMPEZA_RATE_LIMIT,
    );

    const bloqueadoAte =
      await this.authRepository.reservarTentativaOperacaoSenha(
        chaveRateLimit,
        agora,
        politica.tentativas,
        politica.janelaMs,
      );

    if (bloqueadoAte !== null) {
      throw new MuitasRequisicoesException(
        Math.max(
          1,
          Math.ceil((bloqueadoAte.getTime() - agora.getTime()) / 1_000),
        ),
      );
    }

    const usuario =
      await this.authRepository.buscarUsuarioParaAlteracaoSenha(usuarioId);
    const senhaValida =
      usuario !== null &&
      usuario.ativo &&
      (await this.senhaHasher.verificarHash(usuario.senha, dados.senhaAtual));

    if (!senhaValida || usuario === null) {
      throw this.senhaAtualInvalida();
    }

    const novaSenhaHash = await this.senhaHasher.criarHash(dados.novaSenha);
    await this.persistirAlteracaoSenha(
      usuarioId,
      usuario.senha,
      novaSenhaHash,
      chaveRateLimit,
      agora,
    );
  }

  private async persistirAlteracaoSenha(
    usuarioId: string,
    senhaHashAtual: string,
    novaSenhaHash: string,
    chaveRateLimit: string,
    agora: Date,
  ): Promise<void> {
    for (
      let tentativa = 1;
      tentativa <= MAXIMO_TENTATIVAS_TRANSACAO;
      tentativa += 1
    ) {
      try {
        const alterada =
          await this.authRepository.executarTransacaoSerializavel(
            async (repository) => {
              const atualizada = await repository.atualizarSenhaSeAtual(
                usuarioId,
                senhaHashAtual,
                novaSenhaHash,
                agora,
              );

              if (!atualizada) return false;

              await repository.invalidarRedefinicaoSenha(usuarioId, agora);
              await repository.revogarTodasSessoes(usuarioId, agora);
              await repository.limparTentativasOperacaoSenha(chaveRateLimit);
              return true;
            },
          );

        if (!alterada) {
          throw this.senhaAtualInvalida();
        }

        return;
      } catch (erro: unknown) {
        if (this.ehErroTransacaoRepetivel(erro)) {
          if (tentativa < MAXIMO_TENTATIVAS_TRANSACAO) continue;
          throw new MuitasRequisicoesException(1);
        }

        throw erro;
      }
    }
  }

  private async criarRedefinicaoSenha(
    usuarioId: string,
    agora: Date,
  ): Promise<string> {
    for (
      let tentativa = 1;
      tentativa <= MAXIMO_TENTATIVAS_TRANSACAO;
      tentativa += 1
    ) {
      const token = gerarTokenRedefinicaoSenha();
      try {
        await this.authRepository.substituirRedefinicaoSenha(
          usuarioId,
          calcularHashTokenRedefinicaoSenha(token),
          new Date(agora.getTime() + DURACAO_TOKEN_REDEFINICAO_SENHA_MS),
          agora,
        );
        return token;
      } catch (erro: unknown) {
        if (
          erro instanceof Prisma.PrismaClientKnownRequestError &&
          erro.code === "P2002" &&
          tentativa < MAXIMO_TENTATIVAS_TRANSACAO
        ) {
          continue;
        }
        throw erro;
      }
    }

    throw new Error("Não foi possível criar a redefinição de senha.");
  }

  private async executarRedefinicaoSenha(
    dados: RedefinirSenhaBody,
  ): Promise<void> {
    const agora = new Date();
    const tokenHash = calcularHashTokenRedefinicaoSenha(dados.token);
    const redefinicao =
      await this.authRepository.buscarRedefinicaoParaConsumo(tokenHash);

    if (
      redefinicao === null ||
      redefinicao.consumidoAt !== null ||
      redefinicao.expiraAt.getTime() <= agora.getTime() ||
      !redefinicao.usuario.ativo
    ) {
      throw this.tokenRedefinicaoInvalido();
    }

    const novaSenhaHash = await this.senhaHasher.criarHash(dados.novaSenha);

    for (
      let tentativa = 1;
      tentativa <= MAXIMO_TENTATIVAS_TRANSACAO;
      tentativa += 1
    ) {
      try {
        const redefinida =
          await this.authRepository.executarTransacaoSerializavel(
            async (repository) => {
              const consumida =
                await repository.consumirRedefinicaoSenhaSeValida(
                  redefinicao.id,
                  tokenHash,
                  agora,
                );
              if (!consumida) throw this.tokenRedefinicaoInvalido();

              const atualizada = await repository.atualizarSenhaSeAtual(
                redefinicao.usuario.id,
                redefinicao.usuario.senha,
                novaSenhaHash,
                agora,
              );
              if (!atualizada) throw this.tokenRedefinicaoInvalido();

              await repository.invalidarRedefinicaoSenha(
                redefinicao.usuario.id,
                agora,
              );
              await repository.revogarTodasSessoes(
                redefinicao.usuario.id,
                agora,
              );
              return true;
            },
          );

        if (!redefinida) throw this.tokenRedefinicaoInvalido();

        this.despachanteEmail.despachar({
          tipo: "SENHA_REDEFINIDA",
          destinatario: redefinicao.usuario.email,
        });
        return;
      } catch (erro: unknown) {
        if (this.ehErroTransacaoRepetivel(erro)) {
          if (tentativa < MAXIMO_TENTATIVAS_TRANSACAO) continue;
          throw new MuitasRequisicoesException(1);
        }
        throw erro;
      }
    }
  }

  private async executarLogin(dados: LoginBody): Promise<LoginRealizado> {
    const agora = new Date();
    const ambiente = this.obterAmbiente();
    const politica = POLITICA_RATE_LIMIT_LOGIN[ambiente];
    const chaveRateLimit = criarChaveRateLimitLogin(
      dados.email,
      this.config.getOrThrow("AUTH_RATE_LIMIT_HMAC_SECRET", { infer: true }),
    );

    await this.authRepository.limparTentativasExpiradas(
      agora,
      TAMANHO_LOTE_LIMPEZA_RATE_LIMIT,
    );

    const bloqueadoAte = await this.authRepository.reservarTentativaLogin(
      chaveRateLimit,
      agora,
      politica.tentativas,
      politica.janelaMs,
    );

    if (bloqueadoAte !== null) {
      throw new MuitasRequisicoesException(
        Math.max(
          1,
          Math.ceil((bloqueadoAte.getTime() - agora.getTime()) / 1_000),
        ),
      );
    }

    const usuario = await this.authRepository.buscarUsuarioParaLogin(
      dados.email.normalize("NFC").trim().toLowerCase(),
    );
    const senhaValida = await this.senhaHasher.verificarHash(
      usuario?.senha ?? HASH_FICTICIO,
      dados.senha,
    );

    if (usuario === null || !usuario.ativo || !senhaValida) {
      throw this.credenciaisInvalidas();
    }

    const identidade = IdentidadeAutenticadaSchema.parse({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      trocaSenhaObrigatoria: TROCA_SENHA_OBRIGATORIA_ATE_AUTH_004,
    });
    const token = await this.criarSessao(usuario.id, chaveRateLimit, agora);

    return { identidade, token };
  }

  private async criarSessao(
    usuarioId: string,
    chaveRateLimit: string,
    agora: Date,
  ): Promise<string> {
    for (
      let tentativa = 1;
      tentativa <= MAXIMO_TENTATIVAS_TRANSACAO;
      tentativa += 1
    ) {
      const token = gerarTokenSessao();
      const tokenHash = calcularHashTokenSessao(token)!;

      try {
        const criada = await this.authRepository.executarTransacaoSerializavel(
          async (repository) => {
            const usuarioAtivo = await repository.atualizarUltimoLoginSeAtivo(
              usuarioId,
              agora,
            );

            if (!usuarioAtivo) return false;

            const sessoesAtivas = await repository.listarSessoesAtivas(
              usuarioId,
              agora,
              new Date(agora.getTime() - INATIVIDADE_NOMINAL_SESSAO_MS),
            );
            const quantidadeRevogar = Math.max(
              0,
              sessoesAtivas.length - MAXIMO_SESSOES_ATIVAS + 1,
            );

            await repository.revogarSessoes(
              sessoesAtivas.slice(0, quantidadeRevogar).map(({ id }) => id),
              agora,
            );
            await repository.criarSessao({
              usuarioId,
              tokenHash,
              expiraAt: new Date(agora.getTime() + DURACAO_ABSOLUTA_SESSAO_MS),
              ultimaAtividadeAt: agora,
            });
            await repository.limparTentativasLogin(chaveRateLimit);

            return true;
          },
        );

        if (!criada) {
          throw this.credenciaisInvalidas();
        }

        return token;
      } catch (erro: unknown) {
        if (this.ehErroTransacaoRepetivel(erro)) {
          if (tentativa < MAXIMO_TENTATIVAS_TRANSACAO) {
            continue;
          }

          throw new MuitasRequisicoesException(1);
        }

        throw erro;
      }
    }

    throw new Error("Não foi possível criar a sessão.");
  }

  private ehErroTransacaoRepetivel(erro: unknown): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      (erro.code === "P2034" || erro.code === "P2002")
    );
  }

  private obterAmbiente(): AppEnvironment {
    return this.config.getOrThrow("APP_ENV", {
      infer: true,
    }) as AppEnvironment;
  }

  private recuperacaoHabilitada(): boolean {
    return this.config.getOrThrow("AUTH_PASSWORD_RESET_ENABLED", {
      infer: true,
    });
  }

  private credenciaisInvalidas(): UnauthorizedException {
    return new UnauthorizedException({
      codigo: "CREDENCIAIS_INVALIDAS",
      mensagem: "E-mail ou senha inválidos.",
      erros: [],
    });
  }

  private senhaAtualInvalida(): UnauthorizedException {
    return new UnauthorizedException({
      codigo: "SENHA_ATUAL_INVALIDA",
      mensagem: "A senha atual é inválida.",
      erros: [],
    });
  }

  private tokenRedefinicaoInvalido(): UnauthorizedException {
    return new UnauthorizedException({
      codigo: "TOKEN_REDEFINICAO_INVALIDO",
      mensagem: "O token de redefinição é inválido ou expirou.",
      erros: [],
    });
  }
}
