import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  naturezaDetalheArgs,
  type NaturezaDetalhePayload,
  naturezaResumoArgs,
  type NaturezaResumoPayload,
} from "./types";

type ListarNaturezasParametros = {
  where: Prisma.NaturezaWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class NaturezasRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  criar(data: Prisma.NaturezaCreateInput): Promise<NaturezaDetalhePayload> {
    return this.database.natureza.create({ data, ...naturezaDetalheArgs });
  }

  listar({
    where,
    skip,
    take,
  }: ListarNaturezasParametros): Promise<NaturezaResumoPayload[]> {
    return this.database.natureza.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...naturezaResumoArgs,
    });
  }

  contar(where: Prisma.NaturezaWhereInput): Promise<number> {
    return this.database.natureza.count({ where });
  }

  buscarPorId(naturezaId: string): Promise<NaturezaDetalhePayload | null> {
    return this.database.natureza.findUnique({
      where: { id: naturezaId },
      ...naturezaDetalheArgs,
    });
  }

  async buscarIdPorNomeNormalizado(
    nomeNormalizado: string,
  ): Promise<string | null> {
    const natureza = await this.database.natureza.findUnique({
      where: { nomeNormalizado },
      select: { id: true },
    });
    return natureza?.id ?? null;
  }

  alterar(
    naturezaId: string,
    data: Prisma.NaturezaUpdateInput,
  ): Promise<NaturezaDetalhePayload> {
    return this.database.natureza.update({
      where: { id: naturezaId },
      data,
      ...naturezaDetalheArgs,
    });
  }
}
