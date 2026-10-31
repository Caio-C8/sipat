import type { ListarMovimentacoesQueryData } from "@repo/contracts";
import type { Prisma } from "@repo/database";
import { inicioDiaSaoPaulo, proximoDiaCivil } from "../datas-movimentacao";
export class MovimentacaoPersistenceMapper {
  static paraFiltro(
    query: ListarMovimentacoesQueryData,
  ): Prisma.TransferenciaPatrimonioWhereInput {
    return {
      patrimonioId: query.patrimonioId,
      setorAntigoId: query.setorOrigemId,
      setorAtualId: query.setorDestinoId,
      comissaoId: query.comissaoId,
      ...(query.busca
        ? {
            patrimonio: {
              OR: [
                {
                  numeroPatrimonio: {
                    contains: query.busca,
                    mode: "insensitive",
                  },
                },
                { descricao: { contains: query.busca, mode: "insensitive" } },
              ],
            },
          }
        : {}),
      ...(query.dataInicio || query.dataFim
        ? {
            dataTransferencia: {
              ...(query.dataInicio
                ? { gte: inicioDiaSaoPaulo(query.dataInicio) }
                : {}),
              ...(query.dataFim
                ? { lt: inicioDiaSaoPaulo(proximoDiaCivil(query.dataFim)) }
                : {}),
            },
          }
        : {}),
    };
  }
}
