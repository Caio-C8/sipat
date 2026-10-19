import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AlterarSetorData,
  AlterarSituacaoSetorData,
  CriarSetorData,
  IdentidadeAutenticada,
  ListarSetoresQueryData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { ResponsaveisService } from "../responsaveis/responsaveis.service";
import { SetorPersistenceMapper } from "./mappers";
import { SetoresRepository } from "./setores.repository";
import type { ListarSetoresResultado, SetorDetalhePayload } from "./types";

@Injectable()
export class SetoresService {
  constructor(
    private readonly setores: SetoresRepository,
    private readonly responsaveis: ResponsaveisService,
  ) {}

  async criar(
    dados: CriarSetorData,
    identidade: IdentidadeAutenticada,
  ): Promise<SetorDetalhePayload> {
    await this.validarResponsavelAtivo(dados.responsavelId);

    try {
      return await this.setores.criar(
        SetorPersistenceMapper.paraCriacao(dados, identidade.id),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async listar(query: ListarSetoresQueryData): Promise<ListarSetoresResultado> {
    const where = SetorPersistenceMapper.paraFiltro(query);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.setores.listar({ where, skip, take: query.limite }),
      this.setores.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(setorId: string): Promise<SetorDetalhePayload> {
    const setor = await this.setores.buscarPorId(setorId);
    if (setor === null) throw this.setorNaoEncontrado();
    return setor;
  }

  async alterar(
    setorId: string,
    dados: AlterarSetorData,
  ): Promise<SetorDetalhePayload> {
    if ((await this.setores.buscarPorId(setorId)) === null) {
      throw this.setorNaoEncontrado();
    }

    if (dados.responsavelId !== undefined) {
      await this.validarResponsavelAtivo(dados.responsavelId);
    }

    try {
      return await this.setores.alterar(
        setorId,
        SetorPersistenceMapper.paraAtualizacao(dados),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async alterarSituacao(
    setorId: string,
    dados: AlterarSituacaoSetorData,
  ): Promise<SetorDetalhePayload> {
    const setor = await this.setores.buscarPorId(setorId);
    if (setor === null) throw this.setorNaoEncontrado();
    if (setor.ativo === dados.ativo) return setor;

    try {
      return await this.setores.alterarSituacao(setorId, dados.ativo);
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  private async validarResponsavelAtivo(responsavelId: string): Promise<void> {
    const responsavel = await this.responsaveis.consultar(responsavelId);
    if (!responsavel.ativo) {
      throw new ConflictException({
        codigo: "RESPONSAVEL_INATIVO",
        mensagem: "O responsável informado está inativo.",
        erros: [
          {
            campo: "responsavelId",
            codigo: "RELACAO_INATIVA",
            mensagem: "Um responsável inativo não pode receber novos setores.",
          },
        ],
      });
    }
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (this.ehErroPrisma(erro, "P2025")) throw this.setorNaoEncontrado();
    if (this.ehErroPrisma(erro, "P2003")) {
      throw new ConflictException({
        codigo: "RELACAO_SETOR_INVALIDA",
        mensagem:
          "Uma relação informada deixou de estar disponível durante a operação.",
        erros: [],
      });
    }
    throw erro;
  }

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private setorNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "SETOR_NAO_ENCONTRADO",
      mensagem: "O setor informado não foi encontrado.",
      erros: [],
    });
  }
}
