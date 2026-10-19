import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AlterarResponsavelData,
  AlterarSituacaoResponsavelData,
  CriarResponsavelData,
  IdentidadeAutenticada,
  ListarResponsaveisQueryData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { ResponsavelPersistenceMapper } from "./mappers";
import type {
  ListarResponsaveisResultado,
  ResponsavelDetalhePayload,
} from "./types";
import { ResponsaveisRepository } from "./responsaveis.repository";

@Injectable()
export class ResponsaveisService {
  constructor(private readonly responsaveis: ResponsaveisRepository) {}

  async criar(
    dados: CriarResponsavelData,
    identidade: IdentidadeAutenticada,
  ): Promise<ResponsavelDetalhePayload> {
    await this.verificarMatriculaDisponivel(dados.matricula);

    try {
      return await this.responsaveis.criar(
        ResponsavelPersistenceMapper.paraCriacao(dados, identidade.id),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async listar(
    query: ListarResponsaveisQueryData,
  ): Promise<ListarResponsaveisResultado> {
    const where = ResponsavelPersistenceMapper.paraFiltro(query);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.responsaveis.listar({ where, skip, take: query.limite }),
      this.responsaveis.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(responsavelId: string): Promise<ResponsavelDetalhePayload> {
    const responsavel = await this.responsaveis.buscarPorId(responsavelId);
    if (responsavel === null) throw this.responsavelNaoEncontrado();
    return responsavel;
  }

  async alterar(
    responsavelId: string,
    dados: AlterarResponsavelData,
  ): Promise<ResponsavelDetalhePayload> {
    if ((await this.responsaveis.buscarPorId(responsavelId)) === null) {
      throw this.responsavelNaoEncontrado();
    }

    if (dados.matricula !== undefined) {
      await this.verificarMatriculaDisponivel(dados.matricula, responsavelId);
    }

    try {
      return await this.responsaveis.alterar(
        responsavelId,
        ResponsavelPersistenceMapper.paraAtualizacao(dados),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async alterarSituacao(
    responsavelId: string,
    dados: AlterarSituacaoResponsavelData,
  ): Promise<ResponsavelDetalhePayload> {
    const responsavel = await this.responsaveis.buscarPorId(responsavelId);
    if (responsavel === null) throw this.responsavelNaoEncontrado();
    if (responsavel.ativo === dados.ativo) return responsavel;

    try {
      return await this.responsaveis.alterarSituacao(
        responsavelId,
        dados.ativo,
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  private async verificarMatriculaDisponivel(
    matricula: string,
    responsavelIdAtual?: string,
  ): Promise<void> {
    const responsavelId =
      await this.responsaveis.buscarIdPorMatricula(matricula);
    if (responsavelId !== null && responsavelId !== responsavelIdAtual) {
      throw this.matriculaDuplicada();
    }
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (this.ehErroPrisma(erro, "P2002")) throw this.matriculaDuplicada();
    if (this.ehErroPrisma(erro, "P2025")) {
      throw this.responsavelNaoEncontrado();
    }
    throw erro;
  }

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private matriculaDuplicada(): ConflictException {
    return new ConflictException({
      codigo: "MATRICULA_RESPONSAVEL_JA_EXISTENTE",
      mensagem: "Já existe um responsável com a matrícula informada.",
      erros: [
        {
          campo: "matricula",
          codigo: "VALOR_JA_EXISTENTE",
          mensagem: "Já existe um responsável com esta matrícula.",
        },
      ],
    });
  }

  private responsavelNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "RESPONSAVEL_NAO_ENCONTRADO",
      mensagem: "O responsável informado não foi encontrado.",
      erros: [],
    });
  }
}
