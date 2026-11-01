import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import { construirNamespaceLockIdempotencia } from "../../common/utils/idempotencia";
import { movimentacaoArgs } from "./types";
type Cliente = DatabaseClient | Prisma.TransactionClient;
@Injectable()
export class MovimentacoesRepository {
  constructor(@Inject(DATABASE_CLIENT) private readonly database: Cliente) {}
  executarTransacao<T>(
    operacao: (
      repository: MovimentacoesRepository,
      tx: Prisma.TransactionClient,
    ) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database))
      throw new Error("Transação já iniciada.");
    return this.database.$transaction(
      (tx) => operacao(new MovimentacoesRepository(tx), tx),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      },
    );
  }
  async tentarBloquearChave(
    usuarioId: string,
    chave: string,
  ): Promise<boolean> {
    const namespace = construirNamespaceLockIdempotencia(
      "movimentacao",
      usuarioId,
      chave,
    );
    const [linha] = await this.database.$queryRaw<
      { obtido: boolean }[]
    >`SELECT pg_try_advisory_xact_lock(hashtextextended(${namespace}, 0)) AS obtido`;
    return linha?.obtido === true;
  }
  buscarIdempotencia(usuarioId: string, chave: string) {
    return this.database.idempotenciaMovimentacao.findUnique({
      where: { usuarioId_chave: { usuarioId, chave } },
    });
  }
  salvarIdempotencia(
    data: Prisma.IdempotenciaMovimentacaoUncheckedCreateInput,
  ) {
    return this.database.idempotenciaMovimentacao.create({ data });
  }
  criar(data: Prisma.TransferenciaPatrimonioUncheckedCreateInput) {
    return this.database.transferenciaPatrimonio.create({
      data,
      ...movimentacaoArgs,
    });
  }
  consultar(id: string) {
    return this.database.transferenciaPatrimonio.findUnique({
      where: { id },
      ...movimentacaoArgs,
    });
  }
  listar(
    where: Prisma.TransferenciaPatrimonioWhereInput,
    skip: number,
    take: number,
  ) {
    return this.database.transferenciaPatrimonio.findMany({
      where,
      skip,
      take,
      orderBy: [{ dataTransferencia: "desc" }, { id: "desc" }],
      ...movimentacaoArgs,
    });
  }
  contar(where: Prisma.TransferenciaPatrimonioWhereInput) {
    return this.database.transferenciaPatrimonio.count({ where });
  }
}
