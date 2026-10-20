import type { NotaFiscalDetalhe, NotaFiscalResumo } from "@repo/contracts";
import type {
  NotaFiscalDetalhePayload,
  NotaFiscalResumoPayload,
} from "../types";

export class NotaFiscalResponseMapper {
  static paraResumo(nota: NotaFiscalResumoPayload): NotaFiscalResumo {
    return {
      id: nota.id,
      numeroNotaFiscal: nota.numeroNotaFiscal,
      anoNotaFiscal: nota.anoNotaFiscal,
      dataEmissao: nota.dataEmissao.toISOString().slice(0, 10),
      fornecedor: nota.fornecedor,
      anexoUrl:
        nota.caminhoAnexoNotaFiscal === null
          ? null
          : `/api/notas-fiscais/${nota.id}/anexo`,
    };
  }

  static paraDetalhe(nota: NotaFiscalDetalhePayload): NotaFiscalDetalhe {
    return {
      ...this.paraResumo(nota),
      processoCompra: nota.processoCompra,
      createdAt: nota.createdAt.toISOString(),
      updatedAt: nota.updatedAt?.toISOString() ?? null,
    };
  }
}
