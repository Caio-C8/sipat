import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  especieDetalheArgs,
  type EspecieDetalhePayload,
  especieResumoArgs,
  type EspecieResumoPayload,
} from "./types";

type ListarEspeciesParametros = {
  where: Prisma.EspecieWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class EspeciesRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  criar(data: Prisma.EspecieCreateInput): Promise<EspecieDetalhePayload> {
    return this.database.especie.create({ data, ...especieDetalheArgs });
  }

  listar({
    where,
    skip,
    take,
  }: ListarEspeciesParametros): Promise<EspecieResumoPayload[]> {
    return this.database.especie.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...especieResumoArgs,
    });
  }

  contar(where: Prisma.EspecieWhereInput): Promise<number> {
    return this.database.especie.count({ where });
  }

  buscarPorId(especieId: string): Promise<EspecieDetalhePayload | null> {
    return this.database.especie.findUnique({
      where: { id: especieId },
      ...especieDetalheArgs,
    });
  }

  async buscarIdPorNomeNormalizado(
    nomeNormalizado: string,
  ): Promise<string | null> {
    const especie = await this.database.especie.findUnique({
      where: { nomeNormalizado },
      select: { id: true },
    });
    return especie?.id ?? null;
  }

  alterar(
    especieId: string,
    data: Prisma.EspecieUpdateInput,
  ): Promise<EspecieDetalhePayload> {
    return this.database.especie.update({
      where: { id: especieId },
      data,
      ...especieDetalheArgs,
    });
  }
}
