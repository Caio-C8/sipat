import type { PatrimonioDetalhe, PatrimonioResumo } from "@repo/contracts";
import type {
  PatrimonioDetalhePayload,
  PatrimonioResumoPayload,
} from "../types";

export class PatrimonioResponseMapper {
  static paraResumo(patrimonio: PatrimonioResumoPayload): PatrimonioResumo {
    return {
      id: patrimonio.id,
      numeroPatrimonio: patrimonio.numeroPatrimonio,
      tipoNumeroPatrimonial: patrimonio.tipoNumeroPatrimonial,
      descricao: patrimonio.descricao,
      marca: patrimonio.marca,
      modelo: patrimonio.modelo,
      numeroSerie: patrimonio.numeroSerie,
      status: patrimonio.status,
      setorAtual: patrimonio.setorAtual,
      especie: patrimonio.especie,
    };
  }

  static paraDetalhe(patrimonio: PatrimonioDetalhePayload): PatrimonioDetalhe {
    if (patrimonio.situacaoContabil === null) {
      throw new Error("Patrimônio sem situação contábil inicial.");
    }

    const parametro = patrimonio.parametrosDepreciacao[0] ?? null;

    return {
      ...this.paraResumo(patrimonio),
      dataTombamento: this.paraDataCivil(patrimonio.dataTombamento),
      tipoIncorporacao: patrimonio.tipoIncorporacao,
      valorIncorporacao: patrimonio.valorIncorporacao.toString(),
      processoCompra: patrimonio.processoCompra,
      situacaoContabil: {
        valorBrutoAtual: patrimonio.situacaoContabil.valorBrutoAtual.toString(),
        depreciacaoAcumuladaAtual:
          patrimonio.situacaoContabil.depreciacaoAcumuladaAtual.toString(),
      },
      parametroDepreciacaoAtual:
        parametro === null
          ? null
          : {
              metodo: parametro.metodo,
              vidaUtilInicialMeses: parametro.vidaUtilInicialMeses,
              percentualResidual:
                parametro.percentualResidual?.toString() ?? null,
              valorResidual: parametro.valorResidual.toString(),
              valorBaseInicial: parametro.valorBaseInicial.toString(),
              dataInicio: this.paraDataCivil(parametro.dataInicio),
              dataFim:
                parametro.dataFim === null
                  ? null
                  : this.paraDataCivil(parametro.dataFim),
            },
      createdAt: patrimonio.createdAt.toISOString(),
      updatedAt: patrimonio.updatedAt?.toISOString() ?? null,
    };
  }

  private static paraDataCivil(data: Date): string {
    return data.toISOString().slice(0, 10);
  }
}
