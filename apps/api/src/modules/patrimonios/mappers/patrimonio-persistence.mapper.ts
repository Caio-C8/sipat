import type { CriarPatrimonioBodyData } from "@repo/contracts";
import type { Prisma } from "@repo/database";

type DadosPatrimonioNormalizados = CriarPatrimonioBodyData & {
  descricao: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
};

export class PatrimonioPersistenceMapper {
  static paraCriacao(
    dados: DadosPatrimonioNormalizados,
    numeroPatrimonio: string,
    createdById: string,
  ): Prisma.PatrimonioCreateInput {
    const textoBusca = [
      dados.descricao,
      dados.marca,
      dados.modelo,
      dados.numeroSerie,
    ]
      .filter((valor): valor is string => valor !== undefined)
      .join(" ");

    return {
      numeroPatrimonio,
      tipoNumeroPatrimonial: dados.semNumeroOficial
        ? "SEM_NUMERO_OFICIAL"
        : "OFICIAL",
      descricao: dados.descricao,
      marca: dados.marca,
      modelo: dados.modelo,
      numeroSerie: dados.numeroSerie,
      textoBusca,
      tipoIncorporacao: dados.tipoIncorporacao,
      dataTombamento: this.paraDataCivil(dados.dataTombamento),
      valorIncorporacao: dados.valorIncorporacao,
      status: "ATIVO",
      especie: { connect: { id: dados.especieId } },
      setorAtual: { connect: { id: dados.setorAtualId } },
      ...(dados.processoCompraId === undefined
        ? {}
        : { processoCompra: { connect: { id: dados.processoCompraId } } }),
      createdBy: { connect: { id: createdById } },
      situacaoContabil: {
        create: {
          valorBrutoAtual: dados.valorIncorporacao,
          depreciacaoAcumuladaAtual: "0",
        },
      },
      ...(dados.parametrosDepreciacao === undefined
        ? {}
        : {
            parametrosDepreciacao: {
              create: {
                metodo: dados.parametrosDepreciacao.metodo,
                vidaUtilInicialMeses:
                  dados.parametrosDepreciacao.vidaUtilInicialMeses,
                percentualResidual:
                  dados.parametrosDepreciacao.percentualResidual,
                valorResidual: dados.parametrosDepreciacao.valorResidual,
                valorBaseInicial: dados.parametrosDepreciacao.valorBaseInicial,
                dataInicio: this.paraDataCivil(
                  dados.parametrosDepreciacao.dataInicio,
                ),
              },
            },
          }),
    };
  }

  private static paraDataCivil(data: string): Date {
    return new Date(`${data}T00:00:00.000Z`);
  }
}
