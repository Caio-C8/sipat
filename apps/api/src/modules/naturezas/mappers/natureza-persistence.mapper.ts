import type {
  AlterarNaturezaData,
  CriarNaturezaData,
  ListarNaturezasQueryData,
} from "@repo/contracts";
import type { Prisma } from "@repo/database";

export class NaturezaPersistenceMapper {
  static paraCriacao(
    natureza: CriarNaturezaData,
    nomeNormalizado: string,
    createdById: string,
  ): Prisma.NaturezaCreateInput {
    return {
      nome: natureza.nome,
      nomeNormalizado,
      descricao: natureza.descricao,
      createdBy: { connect: { id: createdById } },
    };
  }

  static paraAtualizacao(
    natureza: AlterarNaturezaData,
    nomeNormalizado?: string,
  ): Prisma.NaturezaUpdateInput {
    return {
      ...(natureza.nome === undefined
        ? {}
        : { nome: natureza.nome, nomeNormalizado }),
      ...(natureza.descricao === undefined
        ? {}
        : { descricao: natureza.descricao }),
      updatedAt: new Date(),
    };
  }

  static paraFiltro(
    query: ListarNaturezasQueryData,
    buscaNormalizada?: string,
  ): Prisma.NaturezaWhereInput {
    return buscaNormalizada === undefined
      ? {}
      : {
          OR: [
            { nome: { contains: query.busca, mode: "insensitive" } },
            { nomeNormalizado: { contains: buscaNormalizada } },
          ],
        };
  }
}
