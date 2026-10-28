import type { MovimentacaoDetalhe, MovimentacaoResumo } from "@repo/contracts";
import type { MovimentacaoPayload } from "../types";
export class MovimentacaoResponseMapper {
  static paraResumo(item: MovimentacaoPayload): MovimentacaoResumo {
    return {
      id: item.id,
      patrimonio: item.patrimonio,
      setorOrigem: item.setorAntigo,
      setorDestino: item.setorAtual,
      comissao: item.comissao,
      dataTransferencia: item.dataTransferencia.toISOString(),
      origemRegistro: item.itemInventarioCorrecao
        ? "CORRECAO_INVENTARIO"
        : "COMUM",
    };
  }
  static paraDetalhe(item: MovimentacaoPayload): MovimentacaoDetalhe {
    const base = {
      ...this.paraResumo(item),
      observacao: item.observacao,
      createdAt: item.createdAt.toISOString(),
      registradoPor: item.createdBy,
    };
    return item.itemInventarioCorrecao
      ? {
          ...base,
          origemRegistro: "CORRECAO_INVENTARIO",
          correcaoInventario: {
            inventarioId: item.itemInventarioCorrecao.inventarioId,
            itemInventarioId: item.itemInventarioCorrecao.id,
          },
        }
      : { ...base, origemRegistro: "COMUM", correcaoInventario: null };
  }
}
