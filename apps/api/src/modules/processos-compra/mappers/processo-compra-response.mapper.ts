import type {
  ProcessoCompraDetalhe,
  ProcessoCompraResumo,
} from "@repo/contracts";
import type {
  ProcessoCompraDetalhePayload,
  ProcessoCompraResumoPayload,
} from "../types";

export class ProcessoCompraResponseMapper {
  static paraResumo(
    processo: ProcessoCompraResumoPayload,
  ): ProcessoCompraResumo {
    return {
      id: processo.id,
      numeroProcesso: processo.numeroProcesso,
      anoProcesso: processo.anoProcesso,
      numeroEmpenho: processo.numeroEmpenho,
      anoEmpenho: processo.anoEmpenho,
      valorTotal: processo.valorTotal?.toString() ?? null,
      quantidadeNotas: processo._count.notasFiscais,
    };
  }

  static paraDetalhe(
    processo: ProcessoCompraDetalhePayload,
  ): ProcessoCompraDetalhe {
    return {
      ...this.paraResumo(processo),
      observacao: processo.observacao,
      notas: processo.notasFiscais.map((nota) => ({
        id: nota.id,
        numeroNotaFiscal: nota.numeroNotaFiscal,
        anoNotaFiscal: nota.anoNotaFiscal,
        dataEmissao: nota.dataEmissao.toISOString().slice(0, 10),
        fornecedor: nota.fornecedor,
        anexoUrl:
          nota.caminhoAnexoNotaFiscal === null
            ? null
            : `/api/notas-fiscais/${nota.id}/anexo`,
      })),
      createdAt: processo.createdAt.toISOString(),
      updatedAt: processo.updatedAt?.toISOString() ?? null,
    };
  }
}
