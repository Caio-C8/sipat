import type {
  CriarInventarioBodyData,
  ListarInventariosQueryData,
  ListarItensInventarioQueryData,
  ListarSetoresInventarioQueryData,
} from "@repo/contracts";
import type { Prisma } from "@repo/database";

export class InventarioPersistenceMapper {
  static paraCriacao(
    dados: CriarInventarioBodyData,
    createdById: string,
  ): Prisma.InventarioUncheckedCreateInput {
    return {
      nome: dados.nome,
      descricao: dados.descricao,
      observacao: dados.observacao,
      comissaoId: dados.comissaoId,
      createdById,
    };
  }

  static paraFiltroInventarios(
    query: ListarInventariosQueryData,
  ): Prisma.InventarioWhereInput {
    return {
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.comissaoId === undefined
        ? {}
        : { comissaoId: query.comissaoId }),
      ...(query.busca === undefined
        ? {}
        : {
            OR: [
              { nome: { contains: query.busca, mode: "insensitive" as const } },
              {
                descricao: {
                  contains: query.busca,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
    };
  }

  static paraFiltroSetores(
    query: ListarSetoresInventarioQueryData,
  ): Prisma.SetorInventarioWhereInput {
    return {
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.busca === undefined
        ? {}
        : {
            setor: {
              nome: { contains: query.busca, mode: "insensitive" },
            },
          }),
    };
  }

  static paraFiltroItens(
    query: ListarItensInventarioQueryData,
  ): Prisma.ItemInventarioWhereInput {
    return {
      ...(query.statusVerificacao === undefined
        ? {}
        : { statusVerificacao: query.statusVerificacao }),
      ...(query.situacao === undefined ? {} : { situacao: query.situacao }),
      AND: [
        ...(query.setorInventarioId === undefined
          ? []
          : [
              query.contextoSetor === "PREVISTO"
                ? { setorInventarioId: query.setorInventarioId }
                : query.contextoSetor === "ENCONTRADO_NO_SETOR"
                  ? {
                      OR: [
                        {
                          setorEncontrado: {
                            setoresInventario: {
                              some: { id: query.setorInventarioId },
                            },
                          },
                        },
                        {
                          localizacoesPosteriores: {
                            some: {
                              setorInventarioEncontradoId:
                                query.setorInventarioId,
                            },
                          },
                        },
                      ],
                    }
                  : {
                      OR: [
                        { setorInventarioId: query.setorInventarioId },
                        {
                          setorEncontrado: {
                            setoresInventario: {
                              some: { id: query.setorInventarioId },
                            },
                          },
                        },
                        {
                          localizacoesPosteriores: {
                            some: {
                              setorInventarioEncontradoId:
                                query.setorInventarioId,
                            },
                          },
                        },
                      ],
                    },
            ]),
        ...(query.statusCorrecao === undefined
          ? []
          : [
              {
                OR: [
                  { statusCorrecao: query.statusCorrecao },
                  {
                    localizacoesPosteriores: {
                      some: { statusCorrecao: query.statusCorrecao },
                    },
                  },
                ],
              },
            ]),
        ...(query.busca === undefined
          ? []
          : [
              {
                patrimonio: {
                  OR: [
                    {
                      numeroPatrimonio: {
                        contains: query.busca,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      descricao: {
                        contains: query.busca,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
            ]),
      ],
    };
  }
}
