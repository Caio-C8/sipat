import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  baixaDetalheArgs,
  type BaixaDetalhePayload,
  type ComissaoBloqueada,
  type PatrimonioBloqueado,
} from "./types";

type ClienteBaixas = DatabaseClient | Prisma.TransactionClient;

@Injectable()
export class BaixasRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClienteBaixas,
  ) {}

  executarTransacao<T>(
    operacao: (repository: BaixasRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database)) {
      throw new Error(
        "Uma transação não pode ser iniciada dentro de outra transação.",
      );
    }

    return this.database.$transaction((transaction) =>
      operacao(new BaixasRepository(transaction)),
    );
  }

  async bloquearPatrimonio(
    patrimonioId: string,
  ): Promise<PatrimonioBloqueado | null> {
    const registros = await this.database.$queryRaw<PatrimonioBloqueado[]>`
      SELECT "id", "status"
      FROM "patrimonios"
      WHERE "id" = ${patrimonioId}::uuid
      FOR UPDATE
    `;
    return registros[0] ?? null;
  }

  async bloquearComissao(
    comissaoId: string,
  ): Promise<ComissaoBloqueada | null> {
    const registros = await this.database.$queryRaw<ComissaoBloqueada[]>`
      SELECT "id", "data_vigencia_inicio" AS "dataVigenciaInicio",
             "data_vigencia_fim" AS "dataVigenciaFim"
      FROM "comissoes"
      WHERE "id" = ${comissaoId}::uuid
      FOR SHARE
    `;
    return registros[0] ?? null;
  }

  buscarPorPatrimonio(
    patrimonioId: string,
  ): Promise<BaixaDetalhePayload | null> {
    return this.database.baixaPatrimonio.findUnique({
      where: { patrimonioId },
      ...baixaDetalheArgs,
    });
  }

  criar(
    data: Prisma.BaixaPatrimonioUncheckedCreateInput,
  ): Promise<BaixaDetalhePayload> {
    return this.database.baixaPatrimonio.create({
      data,
      ...baixaDetalheArgs,
    });
  }

  async marcarPatrimonioBaixado(patrimonioId: string): Promise<void> {
    await this.database.patrimonio.update({
      where: { id: patrimonioId },
      data: { status: "BAIXADO", updatedAt: new Date() },
      select: { id: true },
    });
  }
}
