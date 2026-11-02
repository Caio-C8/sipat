import { DependenciaConsultaIndisponivelException } from "../../common/http/dependencia-consulta-indisponivel.exception";
import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import type {
  LinhaBanco,
  ResumoBanco,
  FonteRelatorio,
} from "./types/relatorios.types";

@Injectable()
export class RelatoriosRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly db: DatabaseClient | Prisma.TransactionClient,
  ) {}
  leitura<T>(operacao: (repo: RelatoriosRepository) => Promise<T>): Promise<T> {
    if (!("$transaction" in this.db)) throw new Error("Transação já iniciada.");
    return this.db
      .$transaction(
        async (tx) => {
          await tx.$executeRaw`SET TRANSACTION READ ONLY`;
          await tx.$executeRaw`SET LOCAL TIME ZONE 'UTC'`;
          await tx.$queryRaw`SELECT set_config('statement_timeout', '8000', true)`;
          return operacao(new RelatoriosRepository(tx));
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
          maxWait: 2000,
          timeout: 10000,
        },
      )
      .catch((erro: unknown) => {
        if (
          erro instanceof Prisma.PrismaClientKnownRequestError &&
          (["P2028", "P2024", "P1001", "P1002", "P1008", "P1017"].includes(
            erro.code,
          ) ||
            (erro.code === "P2010" && String(erro.meta?.code) === "57014"))
        )
          throw new DependenciaConsultaIndisponivelException();
        if (erro instanceof Prisma.PrismaClientInitializationError)
          throw new DependenciaConsultaIndisponivelException();
        throw erro;
      });
  }
  linhas(fonte: FonteRelatorio, skip: number, take: number) {
    return this.db.$queryRaw<LinhaBanco[]>(
      Prisma.sql`WITH fonte AS (${fonte.sql}) SELECT dados FROM fonte ORDER BY ${fonte.ordem} LIMIT ${take} OFFSET ${skip}`,
    );
  }
  resumo(fonte: FonteRelatorio, expressao: Prisma.Sql) {
    return this.db.$queryRaw<ResumoBanco[]>(
      Prisma.sql`WITH fonte AS (${fonte.sql}) SELECT ${expressao} AS resumo FROM fonte`,
    );
  }
  consultar(sql: Prisma.Sql) {
    return this.db.$queryRaw<LinhaBanco[]>(sql);
  }
  patrimonioExiste(id: string) {
    return this.db.patrimonio.findUnique({
      where: { id },
      select: { id: true },
    });
  }
  inventario(id: string) {
    return this.db.inventario.findUnique({
      where: { id },
      select: { id: true, status: true, _count: { select: { itens: true } } },
    });
  }
}
