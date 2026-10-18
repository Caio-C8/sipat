import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AlterarSituacaoUsuarioData,
  AlterarUsuarioData,
  CriarUsuarioData,
  IdentidadeAutenticada,
  ListarUsuariosQueryData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { SenhaHasher } from "../../common/security/senha-hasher";
import { UsuarioPersistenceMapper } from "./mappers";
import type { ListarUsuariosResultado, UsuarioDetalhePayload } from "./types";
import { UsuariosRepository } from "./usuarios.repository";

const MAXIMO_TENTATIVAS_TRANSACAO = 3;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly senhaHasher: SenhaHasher,
  ) {}

  async criar(
    dados: CriarUsuarioData,
    identidade: IdentidadeAutenticada,
  ): Promise<UsuarioDetalhePayload> {
    const email = this.normalizarEmail(dados.email);
    await this.verificarEmailDisponivel(email);
    const senhaHash = await this.senhaHasher.criarHash(dados.senha);

    try {
      return await this.usuarios.criar(
        UsuarioPersistenceMapper.paraCriacao(
          { ...dados, email, senhaHash },
          identidade.id,
        ),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async listar(
    query: ListarUsuariosQueryData,
  ): Promise<ListarUsuariosResultado> {
    const where = UsuarioPersistenceMapper.paraFiltro(query);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.usuarios.listar({ where, skip, take: query.limite }),
      this.usuarios.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(usuarioId: string): Promise<UsuarioDetalhePayload> {
    const usuario = await this.usuarios.buscarPorId(usuarioId);

    if (usuario === null) {
      throw this.usuarioNaoEncontrado();
    }

    return usuario;
  }

  async alterar(
    usuarioId: string,
    dados: AlterarUsuarioData,
    identidade: IdentidadeAutenticada,
  ): Promise<UsuarioDetalhePayload> {
    const usuarioAtual = await this.usuarios.buscarParaRegra(usuarioId);

    if (usuarioAtual === null) {
      throw this.usuarioNaoEncontrado();
    }

    if (
      usuarioId === identidade.id &&
      dados.perfil !== undefined &&
      dados.perfil !== usuarioAtual.perfil
    ) {
      throw new ConflictException({
        codigo: "AUTOALTERACAO_PERFIL_NAO_PERMITIDA",
        mensagem: "O administrador não pode alterar o próprio perfil.",
        erros: [],
      });
    }

    const email =
      dados.email === undefined ? undefined : this.normalizarEmail(dados.email);

    if (email !== undefined) {
      await this.verificarEmailDisponivel(email, usuarioId);
    }

    try {
      return await this.usuarios.alterar(
        usuarioId,
        UsuarioPersistenceMapper.paraAtualizacao({ ...dados, email }),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async alterarSituacao(
    usuarioId: string,
    dados: AlterarSituacaoUsuarioData,
    identidade: IdentidadeAutenticada,
  ): Promise<UsuarioDetalhePayload> {
    if (!dados.ativo && usuarioId === identidade.id) {
      throw new ConflictException({
        codigo: "AUTOINATIVACAO_NAO_PERMITIDA",
        mensagem: "O administrador não pode inativar a própria conta.",
        erros: [],
      });
    }

    for (
      let tentativa = 1;
      tentativa <= MAXIMO_TENTATIVAS_TRANSACAO;
      tentativa += 1
    ) {
      try {
        return await this.usuarios.executarTransacaoSerializavel(
          async (transacao) => {
            const usuario = await transacao.buscarParaRegra(usuarioId);

            if (usuario === null) {
              throw this.usuarioNaoEncontrado();
            }

            if (usuario.ativo === dados.ativo) {
              const detalhe = await transacao.buscarPorId(usuarioId);
              if (detalhe === null) throw this.usuarioNaoEncontrado();
              return detalhe;
            }

            if (!dados.ativo && usuario.perfil === "ADMINISTRADOR") {
              const administradoresAtivos =
                await transacao.contarAdministradoresAtivos();

              if (administradoresAtivos <= 1) {
                throw new ConflictException({
                  codigo: "ULTIMO_ADMINISTRADOR_ATIVO",
                  mensagem:
                    "O último administrador ativo não pode ser inativado.",
                  erros: [],
                });
              }
            }

            const atualizado = await transacao.alterarSituacao(
              usuarioId,
              dados.ativo,
            );

            if (!dados.ativo) {
              await transacao.revogarSessoesAtivas(usuarioId);
            }

            return atualizado;
          },
        );
      } catch (erro: unknown) {
        if (
          this.ehErroPrisma(erro, "P2034") &&
          tentativa < MAXIMO_TENTATIVAS_TRANSACAO
        ) {
          continue;
        }

        this.traduzirErroPersistencia(erro);
      }
    }

    throw new Error("Não foi possível concluir a transação de situação.");
  }

  private normalizarEmail(email: string): string {
    return email.normalize("NFC").trim().toLowerCase();
  }

  private async verificarEmailDisponivel(
    email: string,
    usuarioIdAtual?: string,
  ): Promise<void> {
    const usuarioId = await this.usuarios.buscarIdPorEmail(email);

    if (usuarioId !== null && usuarioId !== usuarioIdAtual) {
      throw this.emailDuplicado();
    }
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (this.ehErroPrisma(erro, "P2002")) {
      throw this.emailDuplicado();
    }

    if (this.ehErroPrisma(erro, "P2025")) {
      throw this.usuarioNaoEncontrado();
    }

    throw erro;
  }

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private emailDuplicado(): ConflictException {
    return new ConflictException({
      codigo: "EMAIL_USUARIO_JA_EXISTENTE",
      mensagem: "Já existe um usuário com o e-mail informado.",
      erros: [
        {
          campo: "email",
          codigo: "VALOR_JA_EXISTENTE",
          mensagem: "Já existe um usuário com este e-mail.",
        },
      ],
    });
  }

  private usuarioNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "USUARIO_NAO_ENCONTRADO",
      mensagem: "O usuário informado não foi encontrado.",
      erros: [],
    });
  }
}
