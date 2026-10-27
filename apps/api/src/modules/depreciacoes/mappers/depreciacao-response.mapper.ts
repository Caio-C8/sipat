import type {
  ItemDepreciacaoPendente,
  ResultadoDepreciacaoIndividual,
} from "@repo/contracts";
import type {
  DepreciacaoCalculadaComLinha,
  DepreciacaoPersistida,
} from "../types";

export class DepreciacaoResponseMapper {
  static paraPendente(
    calculo: DepreciacaoCalculadaComLinha,
  ): ItemDepreciacaoPendente {
    const { linha } = calculo;
    if (
      linha.valorBrutoAtual === null ||
      linha.depreciacaoAcumuladaAtual === null ||
      linha.valorResidual === null ||
      !["ATIVO", "EMPRESTADO", "EM_MANUTENCAO"].includes(linha.status)
    ) {
      throw new Error("Item pendente com estado incompatível.");
    }
    return {
      patrimonioId: linha.patrimonioId,
      numeroPatrimonio: linha.numeroPatrimonio,
      descricao: linha.descricao,
      status: linha.status as ItemDepreciacaoPendente["status"],
      valorBrutoAtual: linha.valorBrutoAtual.toString(),
      depreciacaoAcumuladaAtual: linha.depreciacaoAcumuladaAtual.toString(),
      valorLiquidoAtual: calculo.valorContabilAnterior.toString(),
      valorResidual: linha.valorResidual.toString(),
      vidaUtilRestanteMeses: calculo.vidaUtilRestanteMeses,
      quotaPrevista: calculo.valorDepreciado.toString(),
      atingiraValorResidual: calculo.atingiraValorResidual,
    };
  }

  static paraRealizada(
    depreciacao: DepreciacaoPersistida,
    competencia: string,
  ): ResultadoDepreciacaoIndividual {
    return {
      resultado: "DEPRECIADO",
      id: depreciacao.id,
      competencia,
      dataDepreciacao: depreciacao.dataDepreciacao.toISOString(),
      valorContabilAnterior: depreciacao.valorContabilAnterior.toString(),
      valorDepreciado: depreciacao.valorDepreciado.toString(),
      valorContabilNovo: depreciacao.valorContabilNovo.toString(),
      patrimonio: depreciacao.patrimonio,
      comissao: depreciacao.comissao,
      createdById: depreciacao.createdById,
      createdAt: depreciacao.createdAt.toISOString(),
    };
  }
}
