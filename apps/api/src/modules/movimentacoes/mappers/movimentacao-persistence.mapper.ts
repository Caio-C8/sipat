import {
  MovimentacaoDetalheSchema,
  type ListarMovimentacoesQueryData,
} from "@repo/contracts";
import type { Prisma } from "@repo/database";
import * as z from "zod";
import { inicioDiaSaoPaulo, proximoDiaCivil } from "../datas-movimentacao";
import type { MovimentacaoPayload } from "../types";
import { MovimentacaoResponseMapper } from "./movimentacao-response.mapper";
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
  static paraSnapshot(items: MovimentacaoPayload[]): Prisma.InputJsonValue {
    return items.map((item) => MovimentacaoResponseMapper.paraDetalhe(item));
  }
  static doSnapshot(json: Prisma.JsonValue): MovimentacaoPayload[] {
    return z
      .array(MovimentacaoDetalheSchema)
      .min(1)
      .max(10)
      .parse(json)
      .map((item) => ({
        id: item.id,
        patrimonio: item.patrimonio,
        setorAntigo: item.setorOrigem,
        setorAtual: item.setorDestino,
        comissao: item.comissao,
        observacao: item.observacao,
        dataTransferencia: new Date(item.dataTransferencia),
        createdAt: new Date(item.createdAt),
        createdBy: item.registradoPor,
        itemInventarioCorrecao: item.correcaoInventario
          ? {
              id: item.correcaoInventario.itemInventarioId,
              inventarioId: item.correcaoInventario.inventarioId,
            }
          : null,
      }));
  }
}
