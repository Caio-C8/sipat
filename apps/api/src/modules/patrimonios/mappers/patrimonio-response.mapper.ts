import type { PatrimonioDetalhe, PatrimonioResumo } from "@repo/contracts";
import { diaSaoPaulo } from "../../../common/utils/datas-institucionais";
import type {
  PatrimonioDetalhePayload,
  PatrimonioResumoPayload,
} from "../types";

export class PatrimonioResponseMapper {
  static paraResumo(patrimonio: PatrimonioResumoPayload): PatrimonioResumo {
    if (patrimonio.situacaoContabil === null) {
      throw new Error("Patrimônio sem situação contábil inicial.");
    }

    return {
      id: patrimonio.id,
      numeroPatrimonio: patrimonio.numeroPatrimonio,
      tipoNumeroPatrimonial: patrimonio.tipoNumeroPatrimonial,
      descricao: patrimonio.descricao,
      marca: patrimonio.marca,
      modelo: patrimonio.modelo,
      numeroSerie: patrimonio.numeroSerie,
      status: patrimonio.status,
      depreciavel: patrimonio.depreciavel,
      situacaoContabil: {
        valorBrutoAtual: patrimonio.situacaoContabil.valorBrutoAtual.toString(),
        depreciacaoAcumuladaAtual:
          patrimonio.situacaoContabil.depreciacaoAcumuladaAtual.toString(),
      },
      setorAtual: patrimonio.setorAtual,
      especie: patrimonio.especie,
    };
  }

  static paraDetalhe(patrimonio: PatrimonioDetalhePayload): PatrimonioDetalhe {
    const parametro = patrimonio.parametrosDepreciacao[0] ?? null;

    return {
      ...this.paraResumo(patrimonio),
      dataTombamento: this.paraDataCivil(patrimonio.dataTombamento),
      tipoIncorporacao: patrimonio.tipoIncorporacao,
      valorIncorporacao: patrimonio.valorIncorporacao.toString(),
      processoCompra: patrimonio.processoCompra,
      cadastradoPor: patrimonio.createdBy,
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
              dataInicio:
                parametro.dataInicio === null
                  ? null
                  : this.paraDataCivil(parametro.dataInicio),
              dataFim:
                parametro.dataFim === null
                  ? null
                  : this.paraDataCivil(parametro.dataFim),
            },
      disponibilidadeUso:
        patrimonio.disponibilidadeUso === null
          ? null
          : {
              id: patrimonio.disponibilidadeUso.id,
              dataDisponibilidade: this.paraDataCivil(
                patrimonio.disponibilidadeUso.dataDisponibilidade,
              ),
              primeiraCompetencia: patrimonio.depreciavel
                ? this.adicionarMes(
                    this.paraDataCivil(
                      patrimonio.disponibilidadeUso.dataDisponibilidade,
                    ).slice(0, 7),
                    1,
                  )
                : null,
              createdAt: patrimonio.disponibilidadeUso.createdAt.toISOString(),
              createdBy: patrimonio.disponibilidadeUso.createdBy,
            },
      resumoDepreciacao: this.resumoDepreciacao(parametro),
      createdAt: patrimonio.createdAt.toISOString(),
      updatedAt: patrimonio.updatedAt?.toISOString() ?? null,
    };
  }

  private static paraDataCivil(data: Date): string {
    return data.toISOString().slice(0, 10);
  }

  private static resumoDepreciacao(
    parametro: PatrimonioDetalhePayload["parametrosDepreciacao"][number] | null,
  ): PatrimonioDetalhe["resumoDepreciacao"] {
    if (parametro?.dataInicio === null || parametro === null) {
      return {
        primeiraCompetencia: null,
        ultimaCompetenciaProcessada: null,
        proximaCompetencia: null,
        quantidadePendencias: 0,
      };
    }
    const primeira = this.adicionarMes(
      this.paraDataCivil(parametro.dataInicio).slice(0, 7),
      1,
    );
    const ultima = parametro.depreciacoes[0]?.dataCompetencia
      ? this.paraDataCivil(parametro.depreciacoes[0].dataCompetencia).slice(
          0,
          7,
        )
      : null;
    const proxima = this.adicionarMes(primeira, parametro._count.depreciacoes);
    const atual = diaSaoPaulo(new Date()).slice(0, 7);
    return {
      primeiraCompetencia: primeira,
      ultimaCompetenciaProcessada: ultima,
      proximaCompetencia: proxima <= atual ? proxima : null,
      quantidadePendencias:
        proxima <= atual ? this.distanciaMeses(proxima, atual) + 1 : 0,
    };
  }

  private static adicionarMes(competencia: string, meses: number): string {
    const [ano, mes] = competencia.split("-").map(Number);
    return new Date(Date.UTC(ano!, mes! - 1 + meses, 1))
      .toISOString()
      .slice(0, 7);
  }

  private static distanciaMeses(inicio: string, fim: string): number {
    const [ai, mi] = inicio.split("-").map(Number);
    const [af, mf] = fim.split("-").map(Number);
    return af! * 12 + mf! - (ai! * 12 + mi!);
  }
}
