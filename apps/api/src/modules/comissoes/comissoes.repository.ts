import { Inject, Injectable } from "@nestjs/common";
import { Prisma, type DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  comissaoDetalheArgs,
  type ComissaoDetalhePayload,
  comissaoResumoArgs,
  type ComissaoResumoPayload,
  membroComissaoArgs,
  type MembroComissaoPayload,
} from "./types";

type ClienteComissoes = DatabaseClient | Prisma.TransactionClient;

type ListarParametros = {
  where: Prisma.ComissaoWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class ComissoesRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClienteComissoes,
  ) {}

  executarTransacao<T>(
    operacao: (repository: ComissoesRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database)) {
      throw new Error(
        "Uma transação não pode ser iniciada dentro de outra transação.",
      );
    }

    return this.database.$transaction((transaction) =>
      operacao(new ComissoesRepository(transaction)),
    );
  }

  async tentarBloquearChaveCriacao(
    usuarioId: string,
    chave: string,
  ): Promise<boolean> {
    const [linha] = await this.database.$queryRaw<{ obtido: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(hashtextextended(${`comissao:${usuarioId}:${chave}`}, 0)) AS obtido
    `;
    return linha?.obtido === true;
  }

  buscarPorChaveCriacao(usuarioId: string, chave: string) {
    return this.database.comissao.findUnique({
      where: {
        createdById_chaveCriacao: {
          createdById: usuarioId,
          chaveCriacao: chave,
        },
      },
      select: { id: true, hashCriacao: true },
    });
  }

  async bloquearComissao(comissaoId: string): Promise<boolean> {
    const registros = await this.database.$queryRaw<readonly { id: string }[]>`
      SELECT "id"
      FROM "comissoes"
      WHERE "id" = ${comissaoId}::uuid
      FOR UPDATE
    `;

    return registros.length === 1;
  }

  async bloquearResponsaveis(
    responsavelIds: readonly string[],
  ): Promise<ReadonlyMap<string, boolean>> {
    if (responsavelIds.length === 0) return new Map();

    const registros = await this.database.$queryRaw<
      readonly { id: string; ativo: boolean }[]
    >`
      SELECT "id", "ativo"
      FROM "responsaveis"
      WHERE "id" = ANY(ARRAY[${Prisma.join(responsavelIds)}]::uuid[])
      FOR SHARE
    `;

    return new Map(registros.map(({ id, ativo }) => [id, ativo]));
  }

  criar(data: Prisma.ComissaoCreateInput): Promise<ComissaoDetalhePayload> {
    return this.database.comissao.create({ data, ...comissaoDetalheArgs });
  }

  listar({
    where,
    skip,
    take,
  }: ListarParametros): Promise<ComissaoResumoPayload[]> {
    return this.database.comissao.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...comissaoResumoArgs,
    });
  }

  contar(where: Prisma.ComissaoWhereInput): Promise<number> {
    return this.database.comissao.count({ where });
  }

  buscarPorId(comissaoId: string): Promise<ComissaoDetalhePayload | null> {
    return this.database.comissao.findUnique({
      where: { id: comissaoId },
      ...comissaoDetalheArgs,
    });
  }

  buscarVigente(
    comissaoId: string,
    dataReferencia: Date,
  ): Promise<ComissaoDetalhePayload | null> {
    return this.database.comissao.findFirst({
      where: {
        id: comissaoId,
        dataVigenciaInicio: { lte: dataReferencia },
        dataVigenciaFim: { gte: dataReferencia },
      },
      ...comissaoDetalheArgs,
    });
  }

  alterar(
    comissaoId: string,
    data: Prisma.ComissaoUpdateInput,
  ): Promise<ComissaoDetalhePayload> {
    return this.database.comissao.update({
      where: { id: comissaoId },
      data,
      ...comissaoDetalheArgs,
    });
  }

  contarMembros(comissaoId: string): Promise<number> {
    return this.database.membroComissao.count({ where: { comissaoId } });
  }

  buscarMembro(
    comissaoId: string,
    membroComissaoId: string,
  ): Promise<MembroComissaoPayload | null> {
    return this.database.membroComissao.findFirst({
      where: { id: membroComissaoId, comissaoId },
      ...membroComissaoArgs,
    });
  }

  adicionarMembro(
    data: Prisma.MembroComissaoUncheckedCreateInput,
  ): Promise<MembroComissaoPayload> {
    return this.database.membroComissao.create({
      data,
      ...membroComissaoArgs,
    });
  }

  alterarMembro(
    membroComissaoId: string,
    papel: "PRESIDENTE" | "MEMBRO",
  ): Promise<MembroComissaoPayload> {
    return this.database.membroComissao.update({
      where: { id: membroComissaoId },
      data: { tipoMembroComissao: papel, updatedAt: new Date() },
      ...membroComissaoArgs,
    });
  }

  async removerMembro(membroComissaoId: string): Promise<void> {
    await this.database.membroComissao.delete({
      where: { id: membroComissaoId },
    });
  }

  async bloquearParaMovimentacao(id: string, tx: Prisma.TransactionClient) {
    const linhas = await tx.$queryRaw<
      { id: string; dataVigenciaInicio: Date; dataVigenciaFim: Date }[]
    >`SELECT id, data_vigencia_inicio AS "dataVigenciaInicio", data_vigencia_fim AS "dataVigenciaFim" FROM comissoes WHERE id = ${id}::uuid FOR SHARE`;
    return linhas[0] ?? null;
  }
  listarOpcoesMovimentacao(
    where: Prisma.ComissaoWhereInput,
    skip: number,
    take: number,
  ) {
    return this.database.comissao.findMany({
      where,
      skip,
      take,
      orderBy: [{ nome: "asc" }, { id: "asc" }],
      ...comissaoResumoArgs,
    });
  }
}
