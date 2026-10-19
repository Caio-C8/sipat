import type {
  AlterarResponsavelData,
  CriarResponsavelData,
  ListarResponsaveisQueryData,
} from "@repo/contracts";
import type { Prisma } from "@repo/database";

export class ResponsavelPersistenceMapper {
  static paraCriacao(
    responsavel: CriarResponsavelData,
    createdById: string,
  ): Prisma.ResponsavelCreateInput {
    return {
      nome: responsavel.nome,
      matricula: responsavel.matricula,
      ativo: true,
      createdBy: { connect: { id: createdById } },
    };
  }

  static paraAtualizacao(
    responsavel: AlterarResponsavelData,
  ): Prisma.ResponsavelUpdateInput {
    return {
      ...(responsavel.nome === undefined ? {} : { nome: responsavel.nome }),
      ...(responsavel.matricula === undefined
        ? {}
        : { matricula: responsavel.matricula }),
      updatedAt: new Date(),
    };
  }

  static paraFiltro(
    query: ListarResponsaveisQueryData,
  ): Prisma.ResponsavelWhereInput {
    return {
      ...(query.ativo === undefined ? {} : { ativo: query.ativo }),
      ...(query.busca === undefined
        ? {}
        : {
            OR: [
              { nome: { contains: query.busca, mode: "insensitive" } },
              { matricula: { contains: query.busca, mode: "insensitive" } },
            ],
          }),
    };
  }
}
