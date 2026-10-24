import type {
  AlterarComissaoBodyData,
  CriarComissaoBodyData,
  ListarComissoesQueryData,
} from "@repo/contracts";
import type { Prisma } from "@repo/database";

export class ComissaoPersistenceMapper {
  static paraCriacao(
    comissao: CriarComissaoBodyData,
    createdById: string,
  ): Prisma.ComissaoCreateInput {
    return {
      nome: comissao.nome,
      descricao: comissao.descricao,
      numeroAto: comissao.numeroAto,
      dataVigenciaInicio: this.paraDataCivil(comissao.dataVigenciaInicio),
      dataVigenciaFim: this.paraDataCivil(comissao.dataVigenciaFim),
      createdBy: { connect: { id: createdById } },
      membros: {
        create: comissao.membros.map((membro) => ({
          tipoMembroComissao: membro.papel,
          responsavel: { connect: { id: membro.responsavelId } },
        })),
      },
    };
  }

  static paraAtualizacao(
    comissao: AlterarComissaoBodyData,
  ): Prisma.ComissaoUpdateInput {
    return {
      ...(comissao.nome === undefined ? {} : { nome: comissao.nome }),
      ...(comissao.descricao === undefined
        ? {}
        : { descricao: comissao.descricao }),
      ...(comissao.numeroAto === undefined
        ? {}
        : { numeroAto: comissao.numeroAto }),
      ...(comissao.dataVigenciaInicio === undefined
        ? {}
        : {
            dataVigenciaInicio: this.paraDataCivil(comissao.dataVigenciaInicio),
          }),
      ...(comissao.dataVigenciaFim === undefined
        ? {}
        : { dataVigenciaFim: this.paraDataCivil(comissao.dataVigenciaFim) }),
      updatedAt: new Date(),
    };
  }

  static paraFiltro(
    query: ListarComissoesQueryData,
  ): Prisma.ComissaoWhereInput {
    return query.busca === undefined
      ? {}
      : {
          OR: [
            { nome: { contains: query.busca, mode: "insensitive" } },
            { numeroAto: { contains: query.busca, mode: "insensitive" } },
          ],
        };
  }

  static paraDataCivil(data: string): Date {
    return new Date(`${data}T00:00:00.000Z`);
  }
}
