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
import {
  calcularHashIdempotencia,
  construirConflitoIdempotencia,
} from "../../common/utils/idempotencia";
import { ResponsaveisService } from "../responsaveis/responsaveis.service";
import { InventariosPolicyService } from "../inventarios/inventarios-policy.service";
import { SetorPersistenceMapper } from "./mappers";
import { SetoresRepository } from "./setores.repository";
import type { ListarSetoresResultado, SetorDetalhePayload } from "./types";

@Injectable()
export class SetoresService {
  constructor(
    private readonly setores: SetoresRepository,
    private readonly responsaveis: ResponsaveisService,
    private readonly inventariosPolicy: InventariosPolicyService,
  ) {}

  async criar(
    dados: CriarSetorData,
    identidade: IdentidadeAutenticada,
  ): Promise<SetorDetalhePayload> {
    await this.validarResponsavelAtivo(dados.responsavelId);
    const { chaveIdempotencia, ...conteudo } = dados;
    const hashCriacao = calcularHashIdempotencia(conteudo);

    try {
      return await this.setores.executarTransacao(async (repository) => {
        if (
          !(await repository.tentarBloquearChaveCriacao(
            identidade.id,
            chaveIdempotencia,
          ))
        )
          throw this.conflitoIdempotencia("OPERACAO_EM_PROCESSAMENTO");
        const anterior = await repository.buscarPorChaveCriacao(
          identidade.id,
          chaveIdempotencia,
        );
        if (anterior) {
          if (anterior.hashCriacao !== hashCriacao)
            throw this.conflitoIdempotencia("CHAVE_IDEMPOTENCIA_REUTILIZADA");
          throw this.conflitoIdempotencia("OPERACAO_JA_PROCESSADA");
        }
        const responsavel = await repository.bloquearResponsavel(
          dados.responsavelId,
        );
        if (responsavel === null) {
          throw new NotFoundException({
            codigo: "RESPONSAVEL_NAO_ENCONTRADO",
            mensagem: "O responsável informado não foi encontrado.",
            erros: [],
          });
        }
        if (!responsavel.ativo) throw this.responsavelInativo();
        return repository.criar({
          ...SetorPersistenceMapper.paraCriacao(dados, identidade.id),
          chaveCriacao: chaveIdempotencia,
          hashCriacao,
        });
      });
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
    if (!dados.ativo) {
      await this.inventariosPolicy.exigirSetorPodeSerInativado(setorId);
    }

    try {
      return await this.setores.alterarSituacao(setorId, dados.ativo);
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  private async validarResponsavelAtivo(responsavelId: string): Promise<void> {
    const responsavel = await this.responsaveis.consultar(responsavelId);
    if (!responsavel.ativo) throw this.responsavelInativo();
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (
      typeof erro === "object" &&
      erro !== null &&
      "message" in erro &&
      typeof erro.message === "string" &&
      erro.message.includes("setores_inventario_aberto_check")
    ) {
      throw new ConflictException({
        codigo: "SETOR_PARTICIPANTE_INVENTARIO_ABERTO",
        mensagem:
          "O setor não pode ser inativado enquanto participar de um inventário não finalizado.",
        erros: [],
      });
    }
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

  private responsavelInativo(): ConflictException {
    return new ConflictException({
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

  private conflitoIdempotencia(
    codigo:
      | "OPERACAO_JA_PROCESSADA"
      | "CHAVE_IDEMPOTENCIA_REUTILIZADA"
      | "OPERACAO_EM_PROCESSAMENTO",
  ): ConflictException {
    return new ConflictException(construirConflitoIdempotencia(codigo));
  }

  bloquearParaMovimentacao(ids: string[], tx: Prisma.TransactionClient) {
    return this.setores.bloquearParaMovimentacao(ids, tx);
  }
  async listarOpcoesMovimentacao(
    busca: string | undefined,
    somenteAtivos: boolean,
    skip: number,
    take: number,
  ) {
    const where: Prisma.SetorWhereInput = {
      ...(somenteAtivos ? { ativo: true } : {}),
      ...(busca ? { nome: { contains: busca, mode: "insensitive" } } : {}),
    };
    const [items, total] = await Promise.all([
      this.setores.listarOpcoesMovimentacao(where, skip, take),
      this.setores.contar(where),
    ]);
    return { items, total };
  }
}
