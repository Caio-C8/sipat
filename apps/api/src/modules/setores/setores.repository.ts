import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  setorDetalheArgs,
  type SetorDetalhePayload,
  setorResumoArgs,
  type SetorResumoPayload,
} from "./types";

type ListarSetoresParametros = {
  where: Prisma.SetorWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class SetoresRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

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
}
