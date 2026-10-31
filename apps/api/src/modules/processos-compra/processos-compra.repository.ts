import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  processoCompraDetalheArgs,
  type ProcessoCompraDetalhePayload,
  processoCompraResumoArgs,
  type ProcessoCompraResumoPayload,
} from "./types";

type ClienteProcessosCompra = DatabaseClient | Prisma.TransactionClient;

type ListarParametros = {
  where: Prisma.ProcessoCompraWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class ProcessosCompraRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClienteProcessosCompra,
  ) {}

  executarTransacao<T>(
    operacao: (repository: ProcessosCompraRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database)) {
      throw new Error(
        "Uma transação não pode ser iniciada dentro de outra transação.",
      );
    }

    return this.database.$transaction((transaction) =>
      operacao(new ProcessosCompraRepository(transaction)),
    );
  }

  async tentarBloquearChaveCriacao(
    usuarioId: string,
    chave: string,
  ): Promise<boolean> {
    const [linha] = await this.database.$queryRaw<{ obtido: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(hashtextextended(${`processo-compra:${usuarioId}:${chave}`}, 0)) AS obtido
    `;
    return linha?.obtido === true;
  }

  buscarPorChaveCriacao(usuarioId: string, chave: string) {
    return this.database.processoCompra.findUnique({
      where: {
        createdById_chaveCriacao: {
          createdById: usuarioId,
          chaveCriacao: chave,
        },
      },
      select: { id: true, hashCriacao: true },
    });
  }

  async bloquearFornecedoresAtivos(
    fornecedorIds: readonly string[],
  ): Promise<ReadonlySet<string>> {
    if (fornecedorIds.length === 0) return new Set();

    const encontrados = await this.database.$queryRaw<
      readonly { id: string; ativo: boolean }[]
    >`
      SELECT "id", "ativo"
      FROM "fornecedores"
      WHERE "id" = ANY(ARRAY[${Prisma.join(fornecedorIds)}]::uuid[])
      FOR SHARE
    `;

    return new Set(
      encontrados
        .filter((fornecedor) => fornecedor.ativo)
        .map((fornecedor) => fornecedor.id),
    );
  }

  criar(
    data: Prisma.ProcessoCompraCreateInput,
  ): Promise<ProcessoCompraDetalhePayload> {
    return this.database.processoCompra.create({
      data,
      ...processoCompraDetalheArgs,
    });
  }

  listar({
    where,
    skip,
    take,
  }: ListarParametros): Promise<ProcessoCompraResumoPayload[]> {
    return this.database.processoCompra.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...processoCompraResumoArgs,
    });
  }

  contar(where: Prisma.ProcessoCompraWhereInput): Promise<number> {
    return this.database.processoCompra.count({ where });
  }

  buscarPorId(
    processoCompraId: string,
  ): Promise<ProcessoCompraDetalhePayload | null> {
    return this.database.processoCompra.findUnique({
      where: { id: processoCompraId },
      ...processoCompraDetalheArgs,
    });
  }

  alterar(
    processoCompraId: string,
    data: Prisma.ProcessoCompraUpdateInput,
  ): Promise<ProcessoCompraDetalhePayload> {
    return this.database.processoCompra.update({
      where: { id: processoCompraId },
      data,
      ...processoCompraDetalheArgs,
    });
  }
}
