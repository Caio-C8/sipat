import type {
  AlterarEspecieData,
  CriarEspecieData,
  ListarEspeciesQueryData,
} from "@repo/contracts";
import type { Prisma } from "@repo/database";

export class EspeciePersistenceMapper {
  static paraCriacao(
    especie: CriarEspecieData,
    nomeNormalizado: string,
    createdById: string,
  ): Prisma.EspecieCreateInput {
    return {
      nome: especie.nome,
      nomeNormalizado,
      descricao: especie.descricao,
      natureza: { connect: { id: especie.naturezaId } },
      createdBy: { connect: { id: createdById } },
    };
  }

  static paraAtualizacao(
    especie: AlterarEspecieData,
    nomeNormalizado?: string,
  ): Prisma.EspecieUpdateInput {
    return {
      ...(especie.nome === undefined
        ? {}
        : { nome: especie.nome, nomeNormalizado }),
      ...(especie.descricao === undefined
        ? {}
        : { descricao: especie.descricao }),
      ...(especie.naturezaId === undefined
        ? {}
        : { natureza: { connect: { id: especie.naturezaId } } }),
      updatedAt: new Date(),
    };
  }

  static paraFiltro(
    query: ListarEspeciesQueryData,
    buscaNormalizada?: string,
  ): Prisma.EspecieWhereInput {
    return {
      ...(query.naturezaId === undefined
        ? {}
        : { naturezaId: query.naturezaId }),
      ...(buscaNormalizada === undefined
        ? {}
        : {
            OR: [
              { nome: { contains: query.busca, mode: "insensitive" } },
              { nomeNormalizado: { contains: buscaNormalizada } },
            ],
          }),
    };
  }
}
