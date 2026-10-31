import { Inject, Injectable } from "@nestjs/common";
import { type DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  setorDetalheArgs,
  type SetorDetalhePayload,
  setorResumoArgs,
  type SetorResumoPayload,
} from "./types";

type ClienteSetores = DatabaseClient | Prisma.TransactionClient;

type ListarSetoresParametros = {
  where: Prisma.SetorWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class SetoresRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClienteSetores,
  ) {}

  executarTransacao<T>(
    operacao: (repository: SetoresRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database))
      throw new Error("Uma transação não pode ser iniciada dentro de outra.");
    return this.database.$transaction((tx) =>
      operacao(new SetoresRepository(tx)),
    );
  }

  async tentarBloquearChaveCriacao(
    usuarioId: string,
    chave: string,
  ): Promise<boolean> {
    const [linha] = await this.database.$queryRaw<{ obtido: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(hashtextextended(${`setor:${usuarioId}:${chave}`}, 0)) AS obtido
    `;
    return linha?.obtido === true;
  }

  buscarPorChaveCriacao(usuarioId: string, chave: string) {
    return this.database.setor.findUnique({
      where: {
        createdById_chaveCriacao: {
          createdById: usuarioId,
          chaveCriacao: chave,
        },
      },
      select: { id: true, hashCriacao: true },
    });
  }

  async bloquearResponsavel(
    responsavelId: string,
  ): Promise<{ ativo: boolean } | null> {
    const [linha] = await this.database.$queryRaw<{ ativo: boolean }[]>`
      SELECT ativo FROM responsaveis WHERE id = ${responsavelId}::uuid FOR SHARE
    `;
    return linha ?? null;
  }

  criar(data: Prisma.SetorCreateInput): Promise<SetorDetalhePayload> {
    return this.database.setor.create({ data, ...setorDetalheArgs });
  }

  listar({
    where,
    skip,
    take,
  }: ListarSetoresParametros): Promise<SetorResumoPayload[]> {
    return this.database.setor.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...setorResumoArgs,
    });
  }

  contar(where: Prisma.SetorWhereInput): Promise<number> {
    return this.database.setor.count({ where });
  }

  buscarPorId(setorId: string): Promise<SetorDetalhePayload | null> {
    return this.database.setor.findUnique({
      where: { id: setorId },
      ...setorDetalheArgs,
    });
  }

  alterar(
    setorId: string,
    data: Prisma.SetorUpdateInput,
  ): Promise<SetorDetalhePayload> {
    return this.database.setor.update({
      where: { id: setorId },
      data,
      ...setorDetalheArgs,
    });
  }

  alterarSituacao(
    setorId: string,
    ativo: boolean,
  ): Promise<SetorDetalhePayload> {
    return this.database.setor.update({
      where: { id: setorId },
      data: { ativo, updatedAt: new Date() },
      ...setorDetalheArgs,
    });
  }

  bloquearParaMovimentacao(ids: string[], tx: Prisma.TransactionClient) {
    return tx.$queryRaw<
      { id: string; ativo: boolean }[]
    >`SELECT id, ativo FROM setores WHERE id = ANY(ARRAY[${Prisma.join(ids)}]::uuid[]) ORDER BY id FOR SHARE`;
  }
  listarOpcoesMovimentacao(
    where: Prisma.SetorWhereInput,
    skip: number,
    take: number,
  ) {
    return this.database.setor.findMany({
      where,
      skip,
      take,
      orderBy: [{ nome: "asc" }, { id: "asc" }],
      select: {
        id: true,
        nome: true,
        ativo: true,
        responsavel: { select: { id: true, nome: true } },
      },
    });
  }
}
