import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  responsavelDetalheArgs,
  type ResponsavelDetalhePayload,
  responsavelResumoArgs,
  type ResponsavelResumoPayload,
} from "./types";

type ListarResponsaveisParametros = {
  where: Prisma.ResponsavelWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class ResponsaveisRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  criar(
    data: Prisma.ResponsavelCreateInput,
  ): Promise<ResponsavelDetalhePayload> {
    return this.database.responsavel.create({
      data,
      ...responsavelDetalheArgs,
    });
  }

  listar({
    where,
    skip,
    take,
  }: ListarResponsaveisParametros): Promise<ResponsavelResumoPayload[]> {
    return this.database.responsavel.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...responsavelResumoArgs,
    });
  }

  contar(where: Prisma.ResponsavelWhereInput): Promise<number> {
    return this.database.responsavel.count({ where });
  }

  buscarPorId(
    responsavelId: string,
  ): Promise<ResponsavelDetalhePayload | null> {
    return this.database.responsavel.findUnique({
      where: { id: responsavelId },
      ...responsavelDetalheArgs,
    });
  }

  async buscarIdPorMatricula(matricula: string): Promise<string | null> {
    const responsavel = await this.database.responsavel.findUnique({
      where: { matricula },
      select: { id: true },
    });

    return responsavel?.id ?? null;
  }

  alterar(
    responsavelId: string,
    data: Prisma.ResponsavelUpdateInput,
  ): Promise<ResponsavelDetalhePayload> {
    return this.database.responsavel.update({
      where: { id: responsavelId },
      data,
      ...responsavelDetalheArgs,
    });
  }

  alterarSituacao(
    responsavelId: string,
    ativo: boolean,
  ): Promise<ResponsavelDetalhePayload> {
    return this.database.responsavel.update({
      where: { id: responsavelId },
      data: { ativo, updatedAt: new Date() },
      ...responsavelDetalheArgs,
    });
  }
}
