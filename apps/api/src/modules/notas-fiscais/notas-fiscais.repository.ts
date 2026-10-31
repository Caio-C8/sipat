import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  notaFiscalDetalheArgs,
  type NotaFiscalDetalhePayload,
  notaFiscalResumoArgs,
  type NotaFiscalResumoPayload,
} from "./types";

type ClienteNotasFiscais = DatabaseClient | Prisma.TransactionClient;

type ListarParametros = {
  where: Prisma.NotaFiscalWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class NotasFiscaisRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClienteNotasFiscais,
  ) {}

  executarTransacao<T>(
    operacao: (repository: NotasFiscaisRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database)) {
      throw new Error(
        "Uma transação não pode ser iniciada dentro de outra transação.",
      );
    }

    return this.database.$transaction((transaction) =>
      operacao(new NotasFiscaisRepository(transaction)),
    );
  }

  async tentarBloquearChaveCriacao(
    usuarioId: string,
    chave: string,
  ): Promise<boolean> {
    const [linha] = await this.database.$queryRaw<{ obtido: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(hashtextextended(${`nota-fiscal:${usuarioId}:${chave}`}, 0)) AS obtido
    `;
    return linha?.obtido === true;
  }

  buscarPorChaveCriacao(usuarioId: string, chave: string) {
    return this.database.notaFiscal.findUnique({
      where: {
        createdById_chaveCriacao: {
          createdById: usuarioId,
          chaveCriacao: chave,
        },
      },
      select: { id: true, hashCriacao: true },
    });
  }

  async bloquearFornecedorAtivo(fornecedorId: string): Promise<boolean> {
    const encontrados = await this.database.$queryRaw<
      readonly { id: string; ativo: boolean }[]
    >`
      SELECT "id", "ativo"
      FROM "fornecedores"
      WHERE "id" = ${fornecedorId}::uuid
      FOR SHARE
    `;

    return encontrados[0]?.ativo === true;
  }

  processoExiste(processoCompraId: string): Promise<{ id: string } | null> {
    return this.database.processoCompra.findUnique({
      where: { id: processoCompraId },
      select: { id: true },
    });
  }

  criar(data: Prisma.NotaFiscalCreateInput): Promise<NotaFiscalDetalhePayload> {
    return this.database.notaFiscal.create({
      data,
      ...notaFiscalDetalheArgs,
    });
  }

  listar({
    where,
    skip,
    take,
  }: ListarParametros): Promise<NotaFiscalResumoPayload[]> {
    return this.database.notaFiscal.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...notaFiscalResumoArgs,
    });
  }

  contar(where: Prisma.NotaFiscalWhereInput): Promise<number> {
    return this.database.notaFiscal.count({ where });
  }

  buscarPorId(notaFiscalId: string): Promise<NotaFiscalDetalhePayload | null> {
    return this.database.notaFiscal.findUnique({
      where: { id: notaFiscalId },
      ...notaFiscalDetalheArgs,
    });
  }

  alterar(
    notaFiscalId: string,
    data: Prisma.NotaFiscalUpdateInput,
  ): Promise<NotaFiscalDetalhePayload> {
    return this.database.notaFiscal.update({
      where: { id: notaFiscalId },
      data,
      ...notaFiscalDetalheArgs,
    });
  }

  async alterarAnexoSeAtual(
    notaFiscalId: string,
    chaveAtual: string | null,
    novaChave: string | null,
  ): Promise<boolean> {
    const resultado = await this.database.notaFiscal.updateMany({
      where: {
        id: notaFiscalId,
        caminhoAnexoNotaFiscal: chaveAtual,
      },
      data: {
        caminhoAnexoNotaFiscal: novaChave,
        updatedAt: new Date(),
      },
    });
    return resultado.count === 1;
  }
}
