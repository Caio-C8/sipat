import type {
  AlterarSetorData,
  CriarSetorData,
  ListarSetoresQueryData,
} from "@repo/contracts";
import type { Prisma } from "@repo/database";

export class SetorPersistenceMapper {
  static paraCriacao(
    setor: CriarSetorData,
    createdById: string,
  ): Prisma.SetorCreateInput {
    return {
      nome: setor.nome,
      sala: setor.sala,
      ramal: setor.ramal,
      ativo: true,
      responsavel: { connect: { id: setor.responsavelId } },
      createdBy: { connect: { id: createdById } },
    };
  }

  static paraAtualizacao(setor: AlterarSetorData): Prisma.SetorUpdateInput {
    return {
      ...(setor.nome === undefined ? {} : { nome: setor.nome }),
      ...(setor.sala === undefined ? {} : { sala: setor.sala }),
      ...(setor.ramal === undefined ? {} : { ramal: setor.ramal }),
      ...(setor.responsavelId === undefined
        ? {}
        : { responsavel: { connect: { id: setor.responsavelId } } }),
      updatedAt: new Date(),
    };
  }

  static paraFiltro(query: ListarSetoresQueryData): Prisma.SetorWhereInput {
    return {
      ...(query.ativo === undefined ? {} : { ativo: query.ativo }),
      ...(query.responsavelId === undefined
        ? {}
        : { responsavelId: query.responsavelId }),
      ...(query.busca === undefined
        ? {}
        : {
            OR: [
              { nome: { contains: query.busca, mode: "insensitive" } },
              { sala: { contains: query.busca, mode: "insensitive" } },
              { ramal: { contains: query.busca, mode: "insensitive" } },
            ],
          }),
    };
  }
}
