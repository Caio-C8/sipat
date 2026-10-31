import { Inject, Injectable } from "@nestjs/common";
import { type DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  patrimonioDetalheArgs,
  type PatrimonioDetalhePayload,
  patrimonioParaSubstituicaoArgs,
  type PatrimonioParaSubstituicaoPayload,
  patrimonioResumoArgs,
  type PatrimonioResumoPayload,
  type TipoNumeroParaGeracao,
} from "./types";

type ClientePatrimonios = DatabaseClient | Prisma.TransactionClient;

type ListarPatrimoniosParametros = {
  where: Prisma.PatrimonioWhereInput;
  skip: number;
  take: number;
};

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

  listar({
    where,
    skip,
    take,
  }: ListarPatrimoniosParametros): Promise<PatrimonioResumoPayload[]> {
    return this.database.patrimonio.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...patrimonioResumoArgs,
    });
  }

  contar(where: Prisma.PatrimonioWhereInput): Promise<number> {
    return this.database.patrimonio.count({ where });
  }

  buscarPorId(patrimonioId: string): Promise<PatrimonioDetalhePayload | null> {
    return this.database.patrimonio.findUnique({
      where: { id: patrimonioId },
      ...patrimonioDetalheArgs,
    });
  }

  buscarParaSubstituicao(
    patrimonioId: string,
  ): Promise<PatrimonioParaSubstituicaoPayload | null> {
    return this.database.patrimonio.findUnique({
      where: { id: patrimonioId },
      ...patrimonioParaSubstituicaoArgs,
    });
  }

  async atualizarNumeroCondicional(
    patrimonioId: string,
    numeroAtual: string,
    numeroNovo: string,
  ): Promise<boolean> {
    const resultado = await this.database.patrimonio.updateMany({
      where: {
        id: patrimonioId,
        numeroPatrimonio: numeroAtual,
        tipoNumeroPatrimonial: "OFICIAL",
      },
      data: { numeroPatrimonio: numeroNovo },
    });

    return resultado.count === 1;
  }

  async criarHistoricoSubstituicao(
    patrimonioId: string,
    numeroAnterior: string,
    numeroNovo: string,
    createdById: string,
  ): Promise<void> {
    await this.database.substituicaoNumeroPatrimonial.create({
      data: {
        patrimonio: { connect: { id: patrimonioId } },
        numeroAnterior,
        numeroNovo,
        createdBy: { connect: { id: createdById } },
      },
      select: { id: true },
    });
  }

  bloquearParaMovimentacao(ids: string[], tx: Prisma.TransactionClient) {
    return tx.$queryRaw<{ id: string; setorAtualId: string; status: string }[]>`
      SELECT id, setor_atual_id AS "setorAtualId", status::text AS status
      FROM patrimonios WHERE id = ANY(ARRAY[${Prisma.join(ids)}]::uuid[])
      ORDER BY id FOR UPDATE
    `;
  }
  atualizarStatusEmprestimo(
    id: string,
    esperado: "ATIVO" | "EMPRESTADO",
    novo: "ATIVO" | "EMPRESTADO",
    instante: Date,
    tx: Prisma.TransactionClient,
  ) {
    return tx.patrimonio.updateMany({
      where: { id, status: esperado },
      data: { status: novo, updatedAt: instante },
    });
  }
  atualizarSetorMovimentacao(
    id: string,
    setorAtualId: string,
    instante: Date,
    tx: Prisma.TransactionClient,
  ) {
    return tx.patrimonio.update({
      where: { id },
      data: { setorAtualId, updatedAt: instante },
      select: { id: true },
    });
  }
}
