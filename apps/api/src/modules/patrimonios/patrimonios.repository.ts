import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  patrimonioDetalheArgs,
  type PatrimonioDetalhePayload,
  type TipoNumeroParaGeracao,
} from "./types";

type ClientePatrimonios = DatabaseClient | Prisma.TransactionClient;

@Injectable()
export class PatrimoniosRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClientePatrimonios,
  ) {}

  executarTransacao<T>(
    operacao: (repository: PatrimoniosRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database)) {
      throw new Error(
        "Uma transação não pode ser iniciada dentro de outra transação.",
      );
    }

    return this.database.$transaction((transaction) =>
      operacao(new PatrimoniosRepository(transaction)),
    );
  }

  async gerarProximoNumero(tipo: TipoNumeroParaGeracao): Promise<string> {
    const resultado =
      tipo === "OFICIAL"
        ? await this.database.$queryRaw<readonly { valor: bigint }[]>`
            SELECT nextval('patrimonios_numero_oficial_seq') AS valor
          `
        : await this.database.$queryRaw<readonly { valor: bigint }[]>`
            SELECT nextval('patrimonios_sem_numero_oficial_seq') AS valor
          `;
    const valor = resultado[0]?.valor;

    if (valor === undefined) {
      throw new Error("A sequence patrimonial não retornou um valor.");
    }

    return tipo === "OFICIAL" ? valor.toString() : `SP-${valor.toString()}`;
  }

  async buscarSetor(setorId: string): Promise<{ ativo: boolean } | null> {
    const setores = await this.database.$queryRaw<
      readonly { ativo: boolean }[]
    >`
      SELECT "ativo"
      FROM "setores"
      WHERE "id" = ${setorId}::uuid
      FOR SHARE
    `;

    return setores[0] ?? null;
  }

  async especieExiste(especieId: string): Promise<boolean> {
    const especie = await this.database.especie.findUnique({
      where: { id: especieId },
      select: { id: true },
    });

    return especie !== null;
  }

  async processoCompraExiste(processoCompraId: string): Promise<boolean> {
    const processo = await this.database.processoCompra.findUnique({
      where: { id: processoCompraId },
      select: { id: true },
    });

    return processo !== null;
  }

  criar(data: Prisma.PatrimonioCreateInput): Promise<PatrimonioDetalhePayload> {
    return this.database.patrimonio.create({
      data,
      ...patrimonioDetalheArgs,
    });
  }
}
