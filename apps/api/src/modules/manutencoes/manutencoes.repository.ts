import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import { manutencaoDetalheArgs } from "./types";

type Cliente = DatabaseClient | Prisma.TransactionClient;

@Injectable()
export class ManutencoesRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly database: Cliente) {}

  executarTransacao<T>(
    operacao: (
      repo: ManutencoesRepository,
      tx: Prisma.TransactionClient,
    ) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database))
      throw new Error("Transação já iniciada.");
    return this.database.$transaction(
      (tx) => operacao(new ManutencoesRepository(tx), tx),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 20_000,
      },
    );
  }

  async tentarBloquearChave(
    usuarioId: string,
    chave: string,
  ): Promise<boolean> {
    const [linha] = await this.database.$queryRaw<{ obtido: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(hashtextextended(${`${usuarioId}:${chave}`}, 0)) AS obtido
    `;
    return linha?.obtido === true;
  }

  buscarIdempotencia(usuarioId: string, chave: string) {
    return this.database.idempotenciaManutencao.findUnique({
      where: { usuarioId_chave: { usuarioId, chave } },
    });
  }
  salvarIdempotencia(data: Prisma.IdempotenciaManutencaoUncheckedCreateInput) {
    return this.database.idempotenciaManutencao.create({ data });
  }
  consultar(id: string) {
    return this.database.manutencao.findUnique({
      where: { id },
      ...manutencaoDetalheArgs,
    });
  }
  listar(where: Prisma.ManutencaoWhereInput, skip: number, take: number) {
    return this.database.manutencao.findMany({
      where,
      skip,
      take,
      orderBy: [{ dataEnvio: "desc" }, { id: "desc" }],
      select: {
        id: true,
        numeroRequisicao: true,
        dataEnvio: true,
        dataRetorno: true,
        status: true,
        _count: {
          select: {
            itens: true,
            documentos: { where: { itemId: null } },
          },
        },
        itens: { where: { dataRetorno: null }, select: { id: true } },
      },
    });
  }
  contar(where: Prisma.ManutencaoWhereInput) {
    return this.database.manutencao.count({ where });
  }
  listarFornecedores(
    where: Prisma.FornecedorWhereInput,
    skip: number,
    take: number,
  ) {
    return this.database.fornecedor.findMany({
      where,
      skip,
      take,
      orderBy: [{ razaoSocial: "asc" }, { id: "asc" }],
      select: { id: true, razaoSocial: true },
    });
  }
  contarFornecedores(where: Prisma.FornecedorWhereInput) {
    return this.database.fornecedor.count({ where });
  }
  listarComissoes(
    where: Prisma.ComissaoWhereInput,
    skip: number,
    take: number,
  ) {
    return this.database.comissao.findMany({
      where,
      skip,
      take,
      orderBy: [{ nome: "asc" }, { id: "asc" }],
      select: {
        id: true,
        nome: true,
        dataVigenciaInicio: true,
        dataVigenciaFim: true,
      },
    });
  }
  contarComissoes(where: Prisma.ComissaoWhereInput) {
    return this.database.comissao.count({ where });
  }
  buscarSetoresPatrimonios(ids: string[]) {
    return this.database.patrimonio.findMany({
      where: { id: { in: ids } },
      select: { id: true, setorAtualId: true },
    });
  }
  buscarFornecedores(ids: string[]) {
    return this.database.fornecedor.findMany({
      where: { id: { in: ids } },
      select: { id: true, ativo: true },
    });
  }
  buscarItensAbertos(ids: string[]) {
    return this.database.itemManutencao.findMany({
      where: { patrimonioId: { in: ids }, dataRetorno: null },
      select: { patrimonioId: true },
    });
  }
  async bloquearItem(id: string, manutencaoId: string) {
    const [item] = await this.database.$queryRaw<
      { id: string; patrimonioId: string }[]
    >`
      SELECT id, patrimonio_id AS "patrimonioId" FROM itens_manutencao
      WHERE id = ${id}::uuid AND manutencao_id = ${manutencaoId}::uuid FOR UPDATE
    `;
    return item ?? null;
  }
  criar(data: Prisma.ManutencaoUncheckedCreateInput) {
    return this.database.manutencao.create({ data, select: { id: true } });
  }
  criarItem(data: Prisma.ItemManutencaoUncheckedCreateInput) {
    return this.database.itemManutencao.create({ data, select: { id: true } });
  }
  criarRevisao(data: Prisma.RevisaoOrcamentoManutencaoUncheckedCreateInput) {
    return this.database.revisaoOrcamentoManutencao.create({
      data,
      select: { id: true },
    });
  }
  atualizarItem(id: string, data: Prisma.ItemManutencaoUncheckedUpdateInput) {
    return this.database.itemManutencao.update({
      where: { id },
      data,
      select: { id: true },
    });
  }
  atualizarPedido(id: string, data: Prisma.ManutencaoUncheckedUpdateInput) {
    return this.database.manutencao.update({
      where: { id },
      data,
      select: { id: true },
    });
  }
  atualizarPatrimonio(id: string, status: "ATIVO" | "EM_MANUTENCAO") {
    return this.database.patrimonio.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      select: { id: true },
    });
  }
  criarDocumento(data: Prisma.DocumentoManutencaoUncheckedCreateInput) {
    return this.database.documentoManutencao.create({ data });
  }
  consultarDocumento(id: string, manutencaoId: string) {
    return this.database.documentoManutencao.findFirst({
      where: { id, manutencaoId },
    });
  }
  contarDocumentosItem(itemId: string) {
    return this.database.documentoManutencao.count({ where: { itemId } });
  }
  contarDocumentosPedido(manutencaoId: string) {
    return this.database.documentoManutencao.count({
      where: { manutencaoId, itemId: null },
    });
  }
}
