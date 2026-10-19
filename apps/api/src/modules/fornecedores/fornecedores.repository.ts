import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  fornecedorDetalheArgs,
  type FornecedorDetalhePayload,
  fornecedorResumoArgs,
  type FornecedorResumoPayload,
} from "./types";

type ListarFornecedoresParametros = {
  where: Prisma.FornecedorWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class FornecedoresRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: DatabaseClient,
  ) {}

  criar(data: Prisma.FornecedorCreateInput): Promise<FornecedorDetalhePayload> {
    return this.database.fornecedor.create({
      data,
      ...fornecedorDetalheArgs,
    });
  }

  listar({
    where,
    skip,
    take,
  }: ListarFornecedoresParametros): Promise<FornecedorResumoPayload[]> {
    return this.database.fornecedor.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...fornecedorResumoArgs,
    });
  }

  contar(where: Prisma.FornecedorWhereInput): Promise<number> {
    return this.database.fornecedor.count({ where });
  }

  buscarPorId(fornecedorId: string): Promise<FornecedorDetalhePayload | null> {
    return this.database.fornecedor.findUnique({
      where: { id: fornecedorId },
      ...fornecedorDetalheArgs,
    });
  }

  async buscarIdPorCnpj(cnpj: string): Promise<string | null> {
    const fornecedor = await this.database.fornecedor.findUnique({
      where: { cnpj },
      select: { id: true },
    });

    return fornecedor?.id ?? null;
  }

  alterar(
    fornecedorId: string,
    data: Prisma.FornecedorUpdateInput,
  ): Promise<FornecedorDetalhePayload> {
    return this.database.fornecedor.update({
      where: { id: fornecedorId },
      data,
      ...fornecedorDetalheArgs,
    });
  }

  alterarSituacao(
    fornecedorId: string,
    ativo: boolean,
  ): Promise<FornecedorDetalhePayload> {
    return this.database.fornecedor.update({
      where: { id: fornecedorId },
      data: { ativo, updatedAt: new Date() },
      ...fornecedorDetalheArgs,
    });
  }
}
