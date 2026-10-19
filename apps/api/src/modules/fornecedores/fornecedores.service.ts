import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AlterarFornecedorData,
  AlterarSituacaoFornecedorData,
  CriarFornecedorData,
  IdentidadeAutenticada,
  ListarFornecedoresQueryData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { FornecedoresRepository } from "./fornecedores.repository";
import { FornecedorPersistenceMapper } from "./mappers";
import type {
  FornecedorDetalhePayload,
  ListarFornecedoresResultado,
} from "./types";

@Injectable()
export class FornecedoresService {
  constructor(private readonly fornecedores: FornecedoresRepository) {}

  async criar(
    dados: CriarFornecedorData,
    identidade: IdentidadeAutenticada,
  ): Promise<FornecedorDetalhePayload> {
    if (dados.cnpj !== undefined) {
      await this.verificarCnpjDisponivel(dados.cnpj);
    }

    try {
      return await this.fornecedores.criar(
        FornecedorPersistenceMapper.paraCriacao(dados, identidade.id),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async listar(
    query: ListarFornecedoresQueryData,
  ): Promise<ListarFornecedoresResultado> {
    const where = FornecedorPersistenceMapper.paraFiltro(query);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.fornecedores.listar({ where, skip, take: query.limite }),
      this.fornecedores.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(fornecedorId: string): Promise<FornecedorDetalhePayload> {
    const fornecedor = await this.fornecedores.buscarPorId(fornecedorId);
    if (fornecedor === null) throw this.fornecedorNaoEncontrado();
    return fornecedor;
  }

  async consultarAtivoParaVinculo(
    fornecedorId: string,
  ): Promise<FornecedorDetalhePayload> {
    const fornecedor = await this.consultar(fornecedorId);
    if (!fornecedor.ativo) {
      throw new ConflictException({
        codigo: "FORNECEDOR_INATIVO",
        mensagem: "O fornecedor informado está inativo.",
        erros: [
          {
            campo: "fornecedorId",
            codigo: "RELACAO_INATIVA",
            mensagem: "Um fornecedor inativo não pode receber novos vínculos.",
          },
        ],
      });
    }
    return fornecedor;
  }

  async alterar(
    fornecedorId: string,
    dados: AlterarFornecedorData,
  ): Promise<FornecedorDetalhePayload> {
    if ((await this.fornecedores.buscarPorId(fornecedorId)) === null) {
      throw this.fornecedorNaoEncontrado();
    }

    if (dados.cnpj !== undefined && dados.cnpj !== null) {
      await this.verificarCnpjDisponivel(dados.cnpj, fornecedorId);
    }

    try {
      return await this.fornecedores.alterar(
        fornecedorId,
        FornecedorPersistenceMapper.paraAtualizacao(dados),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async alterarSituacao(
    fornecedorId: string,
    dados: AlterarSituacaoFornecedorData,
  ): Promise<FornecedorDetalhePayload> {
    const fornecedor = await this.fornecedores.buscarPorId(fornecedorId);
    if (fornecedor === null) throw this.fornecedorNaoEncontrado();
    if (fornecedor.ativo === dados.ativo) return fornecedor;

    try {
      return await this.fornecedores.alterarSituacao(fornecedorId, dados.ativo);
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  private async verificarCnpjDisponivel(
    cnpj: string,
    fornecedorIdAtual?: string,
  ): Promise<void> {
    const fornecedorId = await this.fornecedores.buscarIdPorCnpj(cnpj);
    if (fornecedorId !== null && fornecedorId !== fornecedorIdAtual) {
      throw this.cnpjDuplicado();
    }
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (this.ehErroPrisma(erro, "P2002")) throw this.cnpjDuplicado();
    if (this.ehErroPrisma(erro, "P2025")) {
      throw this.fornecedorNaoEncontrado();
    }
    throw erro;
  }

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private cnpjDuplicado(): ConflictException {
    return new ConflictException({
      codigo: "CNPJ_FORNECEDOR_JA_EXISTENTE",
      mensagem: "Já existe um fornecedor com o CNPJ informado.",
      erros: [
        {
          campo: "cnpj",
          codigo: "VALOR_JA_EXISTENTE",
          mensagem: "Já existe um fornecedor com este CNPJ.",
        },
      ],
    });
  }

  private fornecedorNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "FORNECEDOR_NAO_ENCONTRADO",
      mensagem: "O fornecedor informado não foi encontrado.",
      erros: [],
    });
  }
}
