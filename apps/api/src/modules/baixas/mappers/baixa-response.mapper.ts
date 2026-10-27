import type { BaixaPatrimonioDetalhe } from "@repo/contracts";
import type { BaixaDetalhePayload } from "../types";

export class BaixaResponseMapper {
  static paraDetalhe(baixa: BaixaDetalhePayload): BaixaPatrimonioDetalhe {
    return {
      id: baixa.id,
      patrimonio: baixa.patrimonio,
      comissao: baixa.comissao,
      tipo: baixa.tipo,
      dataBaixa: baixa.dataBaixa.toISOString().slice(0, 10),
      motivo: baixa.motivo,
      observacao: baixa.observacao,
      createdById: baixa.createdById,
      createdAt: baixa.createdAt.toISOString(),
      anexoUrl:
        baixa.caminhoAnexoDocumento === null
          ? null
          : `/api/patrimonios/${baixa.patrimonio.id}/baixa/anexo`,
    };
  }
}
