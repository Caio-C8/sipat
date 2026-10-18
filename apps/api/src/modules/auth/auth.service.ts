import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  type AppEnvironment,
  type IdentidadeAutenticada,
  IdentidadeAutenticadaSchema,
  type LoginBody,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { SenhaHasher } from "../../common/security/senha-hasher";
import { MuitasRequisicoesException } from "../../common/http/muitas-requisicoes.exception";
import type { EnvironmentVariables } from "../../environment";
import { AuthRepository } from "./auth.repository";
import {
  DURACAO_ABSOLUTA_SESSAO_MS,
  INATIVIDADE_NOMINAL_SESSAO_MS,
  INTERVALO_ATUALIZACAO_ATIVIDADE_MS,
  MAXIMO_SESSOES_ATIVAS,
  MAXIMO_TENTATIVAS_TRANSACAO,
  POLITICA_RATE_LIMIT_LOGIN,
  TAMANHO_LOTE_LIMPEZA_RATE_LIMIT,
} from "./auth.constants";
import { CapacidadeArgon2 } from "./capacidade-argon2";
import { criarChaveRateLimitLogin } from "./rate-limit-login";
import { SessaoRepository } from "./sessao.repository";
import { calcularHashTokenSessao, gerarTokenSessao } from "./token-sessao";
import type { LoginRealizado } from "./auth.types";

const HASH_FICTICIO =
  "$argon2id$v=19$m=19456,t=2,p=1$7k3jXdW9HljY+Hh5z2L9Lg$n+/QIxGmny4eYuES0YUW9KF2xQGYCuBsWb/EDz0cbU0";

@Injectable()
export class AuthService {
  constructor(
    private readonly sessoes: SessaoRepository,
    private readonly authRepository: AuthRepository,
    private readonly senhaHasher: SenhaHasher,
    private readonly capacidadeArgon2: CapacidadeArgon2,
    private readonly config: ConfigService<EnvironmentVariables, true>,
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

  private credenciaisInvalidas(): UnauthorizedException {
    return new UnauthorizedException({
      codigo: "CREDENCIAIS_INVALIDAS",
      mensagem: "E-mail ou senha inválidos.",
      erros: [],
    });
  }
}
