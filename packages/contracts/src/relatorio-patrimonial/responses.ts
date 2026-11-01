import * as z from "zod";
import {
  MetaPaginacaoSchema,
  criarRespostaSucessoSchema,
  criarRespostaSucessoPaginadaSchema,
} from "../common/resposta.schema";
import { TipoRelatorioSchema, TipoEventoRelatorioSchema } from "./queries";
const texto = z.string();
const decimal = z.string().regex(/^-?\d+\.\d{7}$/);
export const LimitesRelatorios = {
  previaPadrao: 20,
  previaMaxima: 50,
  offsetMaximo: 50000,
  dias: 366,
  competencias: 12,
  linhasPdf: 1000,
  paginasPdf: 200,
  bytesPdf: 10485760,
  bytesDataset: 8388608,
  emissoesUsuario: 1,
  emissoesInstancia: 2,
  prazoMs: 20000,
  bancoMs: 10000,
} as const;
export const titulosRelatorios = {
  patrimonios: "Relação de patrimônios",
  "ficha-bem": "Ficha individual do bem",
  movimentacoes: "Movimentações",
  manutencoes: "Manutenções",
  depreciacoes: "Depreciações",
  reavaliacoes: "Reavaliações",
  inventarios: "Inventário e inconsistências",
  emprestimos: "Empréstimos",
  baixas: "Baixas patrimoniais",
} as const;
export const patrimoniosLinhaSchema = z.strictObject({
  id: z.uuid(),
  patrimonioId: z.uuid(),
  numeroPatrimonio: texto,
  tipoNumeroPatrimonial: texto,
  descricao: texto,
  especie: texto,
  natureza: texto,
  setorAtual: texto,
  salaAtual: texto.nullable(),
  responsavelAtual: texto,
  status: texto,
  dataTombamento: texto,
  valorIncorporacao: decimal,
  valorBrutoAtual: decimal.nullable(),
  depreciacaoAcumuladaAtual: decimal.nullable(),
  valorLiquidoAtual: decimal.nullable(),
});
export const patrimoniosResumoSchema = z.strictObject({
  quantidade: z.number().int().nonnegative(),
  semNumeroOficial: z.number().int().nonnegative(),
  semContabilidade: z.number().int().nonnegative(),
  incorporacao: decimal.nullable(),
  brutoAtual: decimal.nullable(),
  acumuladoAtual: decimal.nullable(),
  liquidoAtual: decimal.nullable(),
});
export const movimentacoesLinhaSchema = z.strictObject({
  id: z.uuid(),
  patrimonioId: z.uuid(),
  numeroPatrimonio: texto,
  descricao: texto,
  dataTransferencia: texto,
  setorOrigem: texto,
  setorDestino: texto,
  origem: texto,
  comissao: texto,
  autor: texto,
  registroEm: texto,
  observacao: texto.nullable(),
  inventarioId: texto.nullable(),
});
export const movimentacoesResumoSchema = z.strictObject({
  quantidade: z.number().int().nonnegative(),
  bensDistintos: z.number().int().nonnegative(),
});
export const manutencoesLinhaSchema = z.strictObject({
  id: z.uuid(),
  patrimonioId: z.uuid(),
  pedidoId: texto,
  numeroPatrimonio: texto,
  descricao: texto,
  tipo: texto,
  dataEnvio: texto,
  situacao: texto,
  comissao: texto,
  requisicao: texto.nullable(),
  fornecedor: texto.nullable(),
  previsaoRetorno: texto.nullable(),
  dataRetorno: texto.nullable(),
  versaoOrcamento: texto.nullable(),
  valorOrcamento: decimal.nullable(),
  valorRealizado: decimal.nullable(),
  servico: texto.nullable(),
  garantia: texto.nullable(),
  vencimentoGarantia: texto.nullable(),
});
export const manutencoesResumoSchema = z.strictObject({
  quantidade: z.number().int().nonnegative(),
  pedidosDistintos: z.number().int().nonnegative(),
  pendentes: z.number().int().nonnegative(),
  retornados: z.number().int().nonnegative(),
  semOrcamento: z.number().int().nonnegative(),
  semRealizado: z.number().int().nonnegative(),
  orcamentoConhecido: decimal.nullable(),
  realizadoConhecido: decimal.nullable(),
});
export const depreciacoesLinhaSchema = z.strictObject({
  id: z.uuid(),
  patrimonioId: z.uuid(),
  competencia: texto,
  numeroPatrimonio: texto,
  descricao: texto,
  parametroId: texto,
  processamento: texto,
  valorContabilAnterior: decimal,
  valorDepreciado: decimal,
  valorContabilNovo: decimal,
  comissao: texto,
  autor: texto,
});
export const depreciacoesResumoSchema = z.strictObject({
  quantidade: z.number().int().nonnegative(),
  bensDistintos: z.number().int().nonnegative(),
  quotas: decimal.nullable(),
  porCompetencia: z.array(
    z.strictObject({
      competencia: texto,
      quantidade: z.number().int().nonnegative(),
      quotas: decimal,
    }),
  ),
});
export const reavaliacoesLinhaSchema = z.strictObject({
  id: z.uuid(),
  patrimonioId: z.uuid(),
  numeroPatrimonioAtual: texto,
  descricaoAtual: texto,
  dataReavaliacao: texto,
  valorLiquidoAnterior: decimal,
  valorReavaliado: decimal,
  valorResidualNovo: decimal,
  vidaUtilNovaMeses: texto,
  dataReferencia: texto.nullable(),
  numeroSnapshot: texto.nullable(),
  descricaoSnapshot: texto.nullable(),
  valorBrutoAnterior: decimal.nullable(),
  depreciacaoAcumuladaAnterior: decimal.nullable(),
  valorResidualAnterior: decimal.nullable(),
  vidaUtilAnteriorMeses: texto.nullable(),
  comissaoSnapshot: texto.nullable(),
  autorSnapshot: texto.nullable(),
  comissaoAtual: texto.nullable(),
  autorAtual: texto.nullable(),
  laudo: texto.nullable(),
  observacao: texto.nullable(),
  parametroAnteriorId: texto.nullable(),
  parametroAnteriorSituacao: z.enum([
    "REGISTRADO",
    "PRIMEIRO_PARAMETRO",
    "NAO_INFORMADO_LEGADO",
  ]),
});
export const reavaliacoesResumoSchema = z.strictObject({
  quantidade: z.number().int().nonnegative(),
  bensDistintos: z.number().int().nonnegative(),
  semReferencia: z.number().int().nonnegative(),
});
export const inventariosLinhaSchema = z.strictObject({
  id: z.uuid(),
  patrimonioId: z.uuid(),
  inventarioId: texto,
  inventario: texto,
  statusInventario: texto,
  numeroPatrimonio: texto,
  descricao: texto,
  setorEsperado: texto,
  verificacao: texto,
  situacao: texto.nullable(),
  setorEncontrado: texto.nullable(),
  dataVerificacao: texto.nullable(),
  autorVerificacao: texto.nullable(),
  statusNaVerificacao: texto.nullable(),
  ausenciaJustificada: texto.nullable(),
  emprestimoId: texto.nullable(),
  manutencaoItemId: texto.nullable(),
  correcao: texto.nullable(),
  tipoCorrecao: texto.nullable(),
  dataCorrecao: texto.nullable(),
  autorCorrecao: texto.nullable(),
  transferenciaCorrecaoId: texto.nullable(),
  localizacaoId: texto.nullable(),
  dataLocalizacao: texto.nullable(),
  setorLocalizacao: texto.nullable(),
  autorLocalizacao: texto.nullable(),
  correcaoPosterior: texto.nullable(),
  tipoCorrecaoPosterior: texto.nullable(),
  dataCorrecaoPosterior: texto.nullable(),
  autorCorrecaoPosterior: texto.nullable(),
  transferenciaPosteriorId: texto.nullable(),
  observacao: texto.nullable(),
});
export const inventariosResumoSchema = z.strictObject({
  quantidade: z.number().int().nonnegative(),
  pendentes: z.number().int().nonnegative(),
  verificados: z.number().int().nonnegative(),
  corretos: z.number().int().nonnegative(),
  divergentes: z.number().int().nonnegative(),
  naoLocalizados: z.number().int().nonnegative(),
  correcoesOriginaisPendentes: z.number().int().nonnegative(),
  correcoesOriginaisConcluidas: z.number().int().nonnegative(),
  correcoesPosterioresPendentes: z.number().int().nonnegative(),
  correcoesPosterioresConcluidas: z.number().int().nonnegative(),
});
export const emprestimosLinhaSchema = z.strictObject({
  id: z.uuid(),
  patrimonioId: z.uuid(),
  grupoId: texto,
  numeroPatrimonio: texto,
  descricao: texto,
  dataSaida: texto,
  situacao: texto,
  emAtraso: texto,
  comissaoSaida: texto,
  autorSaida: texto,
  modoAgrupamento: texto.nullable(),
  destinatario: texto.nullable(),
  finalidade: texto.nullable(),
  previsao: texto.nullable(),
  setorVinculo: texto.nullable(),
  devolucaoId: texto.nullable(),
  dataDevolucao: texto.nullable(),
  comissaoDevolucao: texto.nullable(),
  autorDevolucao: texto.nullable(),
  observacao: texto.nullable(),
});
export const emprestimosResumoSchema = z.strictObject({
  quantidade: z.number().int().nonnegative(),
  gruposDistintos: z.number().int().nonnegative(),
  pendentes: z.number().int().nonnegative(),
  devolvidos: z.number().int().nonnegative(),
  atrasados: z.number().int().nonnegative(),
  semPrevisao: z.number().int().nonnegative(),
});
export const baixasLinhaSchema = z.strictObject({
  id: z.uuid(),
  patrimonioId: z.uuid(),
  numeroPatrimonio: texto,
  descricao: texto,
  dataBaixa: texto,
  tipo: texto,
  motivo: texto,
  comissao: texto,
  autor: texto,
  registroEm: texto,
  observacao: texto.nullable(),
});
export const baixasResumoSchema = z.strictObject({
  quantidade: z.number().int().nonnegative(),
  porTipo: z.array(
    z.strictObject({ tipo: texto, quantidade: z.number().int().nonnegative() }),
  ),
});
export const ConsultaRelatorioSchema = z.strictObject({
  id: z.uuid(),
  instante: z.iso.datetime(),
  filtros: z.record(z.string(), z.union([z.string(), z.number()])),
  criterioTemporal: texto,
  ordenacao: texto,
  avisos: z.array(texto),
  excluidosDataDesconhecida: z.number().int().nonnegative(),
});
export const respostasTabulares = {
  patrimonios: z.strictObject({
    status: z.literal(200),
    sucesso: z.literal(true),
    mensagem: texto,
    tipo: z.literal("patrimonios"),
    dados: z.array(patrimoniosLinhaSchema),
    resumo: patrimoniosResumoSchema,
    meta: MetaPaginacaoSchema,
    consulta: ConsultaRelatorioSchema,
  }),
  movimentacoes: z.strictObject({
    status: z.literal(200),
    sucesso: z.literal(true),
    mensagem: texto,
    tipo: z.literal("movimentacoes"),
    dados: z.array(movimentacoesLinhaSchema),
    resumo: movimentacoesResumoSchema,
    meta: MetaPaginacaoSchema,
    consulta: ConsultaRelatorioSchema,
  }),
  manutencoes: z.strictObject({
    status: z.literal(200),
    sucesso: z.literal(true),
    mensagem: texto,
    tipo: z.literal("manutencoes"),
    dados: z.array(manutencoesLinhaSchema),
    resumo: manutencoesResumoSchema,
    meta: MetaPaginacaoSchema,
    consulta: ConsultaRelatorioSchema,
  }),
  depreciacoes: z.strictObject({
    status: z.literal(200),
    sucesso: z.literal(true),
    mensagem: texto,
    tipo: z.literal("depreciacoes"),
    dados: z.array(depreciacoesLinhaSchema),
    resumo: depreciacoesResumoSchema,
    meta: MetaPaginacaoSchema,
    consulta: ConsultaRelatorioSchema,
  }),
  reavaliacoes: z.strictObject({
    status: z.literal(200),
    sucesso: z.literal(true),
    mensagem: texto,
    tipo: z.literal("reavaliacoes"),
    dados: z.array(reavaliacoesLinhaSchema),
    resumo: reavaliacoesResumoSchema,
    meta: MetaPaginacaoSchema,
    consulta: ConsultaRelatorioSchema,
  }),
  inventarios: z.strictObject({
    status: z.literal(200),
    sucesso: z.literal(true),
    mensagem: texto,
    tipo: z.literal("inventarios"),
    dados: z.array(inventariosLinhaSchema),
    resumo: inventariosResumoSchema,
    meta: MetaPaginacaoSchema,
    consulta: ConsultaRelatorioSchema,
  }),
  emprestimos: z.strictObject({
    status: z.literal(200),
    sucesso: z.literal(true),
    mensagem: texto,
    tipo: z.literal("emprestimos"),
    dados: z.array(emprestimosLinhaSchema),
    resumo: emprestimosResumoSchema,
    meta: MetaPaginacaoSchema,
    consulta: ConsultaRelatorioSchema,
  }),
  baixas: z.strictObject({
    status: z.literal(200),
    sucesso: z.literal(true),
    mensagem: texto,
    tipo: z.literal("baixas"),
    dados: z.array(baixasLinhaSchema),
    resumo: baixasResumoSchema,
    meta: MetaPaginacaoSchema,
    consulta: ConsultaRelatorioSchema,
  }),
};
export const RelatorioTabularResponseSchema = z.discriminatedUnion("tipo", [
  respostasTabulares.patrimonios,
  respostasTabulares.movimentacoes,
  respostasTabulares.manutencoes,
  respostasTabulares.depreciacoes,
  respostasTabulares.reavaliacoes,
  respostasTabulares.inventarios,
  respostasTabulares.emprestimos,
  respostasTabulares.baixas,
]);
export type RelatorioTabularResponse = z.output<
  typeof RelatorioTabularResponseSchema
>;
export const CadastroFichaSchema = patrimoniosLinhaSchema.extend({
  marca: texto.nullable(),
  modelo: texto.nullable(),
  serie: texto.nullable(),
  processoId: z.uuid().nullable(),
  processo: texto.nullable(),
  parametro: z
    .strictObject({
      id: z.uuid(),
      metodo: texto,
      vidaUtilMeses: z.number().int(),
      residual: decimal,
      base: decimal,
      inicio: texto,
    })
    .nullable(),
});
const baseEvento = {
  id: z.uuid(),
  patrimonioId: z.uuid(),
  fonteId: z.uuid(),
  ocorrencia: texto.nullable(),
  precisao: z.enum(["DIA", "INSTANTE", "DESCONHECIDA"]),
  registroEm: texto.nullable(),
  autor: texto.nullable(),
  comissao: texto.nullable(),
};
export const EventoFichaSchema = z.discriminatedUnion("tipo", [
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("SUBSTITUICAO_NUMERO"),
    atributos: z.strictObject({ numeroAnterior: texto, numeroNovo: texto }),
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("TRANSFERENCIA"),
    atributos: movimentacoesLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("REAVALIACAO"),
    atributos: reavaliacoesLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("DEPRECIACAO"),
    atributos: depreciacoesLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("EMPRESTIMO"),
    atributos: emprestimosLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("DEVOLUCAO"),
    atributos: emprestimosLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("BAIXA"),
    atributos: baixasLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("ENVIO_MANUTENCAO"),
    atributos: manutencoesLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("REVISAO_ORCAMENTO"),
    atributos: z.strictObject({
      itemId: z.uuid(),
      versao: z.number().int(),
      descricao: texto,
      valor: decimal,
      fornecedor: texto.nullable(),
    }),
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("RETORNO_MANUTENCAO"),
    atributos: manutencoesLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("CONFERENCIA_INVENTARIO"),
    atributos: inventariosLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("CORRECAO_INVENTARIO"),
    atributos: inventariosLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("LOCALIZACAO_POSTERIOR"),
    atributos: inventariosLinhaSchema,
  }),
  z.strictObject({
    ...baseEvento,
    tipo: z.literal("CORRECAO_LOCALIZACAO"),
    atributos: inventariosLinhaSchema,
  }),
]);
export type EventoFicha = z.output<typeof EventoFichaSchema>;
export const FichaResponseSchema = criarRespostaSucessoSchema(
  z.strictObject({
    cadastro: CadastroFichaSchema,
    secoes: z.array(
      z.strictObject({
        tipo: TipoEventoRelatorioSchema,
        disponivel: z.boolean(),
        quantidade: z.number().int().nonnegative(),
      }),
    ),
    consulta: ConsultaRelatorioSchema,
  }),
);
export type FichaResponse = z.output<typeof FichaResponseSchema>;
export const EventosFichaResponseSchema = z.strictObject({
  status: z.literal(200),
  sucesso: z.literal(true),
  mensagem: texto,
  tipo: z.literal("ficha-bem"),
  dados: z.array(EventoFichaSchema),
  resumo: z.strictObject({
    quantidade: z.number().int().nonnegative(),
    porTipo: z.array(
      z.strictObject({
        tipo: TipoEventoRelatorioSchema,
        quantidade: z.number().int().nonnegative(),
      }),
    ),
  }),
  meta: MetaPaginacaoSchema,
  consulta: ConsultaRelatorioSchema,
});
export type EventosFichaResponse = z.output<typeof EventosFichaResponseSchema>;
export const CatalogoRelatoriosResponseSchema = criarRespostaSucessoSchema(
  z.strictObject({
    tipos: z
      .array(
        z.strictObject({
          tipo: TipoRelatorioSchema,
          titulo: texto,
          disponivel: z.boolean(),
          motivo: texto.nullable(),
          previa: z.boolean(),
          pdf: z.boolean(),
        }),
      )
      .length(9),
    limites: z.object({
      previaPadrao: z.number().int().positive(),
      previaMaxima: z.number().int().positive(),
      offsetMaximo: z.number().int().positive(),
      dias: z.number().int().positive(),
      competencias: z.number().int().positive(),
      linhasPdf: z.number().int().positive(),
      paginasPdf: z.number().int().positive(),
      bytesPdf: z.number().int().positive(),
      bytesDataset: z.number().int().positive(),
      emissoesUsuario: z.number().int().positive(),
      emissoesInstancia: z.number().int().positive(),
      prazoMs: z.number().int().positive(),
      bancoMs: z.number().int().positive(),
    }),
  }),
);
export type CatalogoRelatoriosResponse = z.output<
  typeof CatalogoRelatoriosResponseSchema
>;
export const OpcoesRelatorioResponseSchema = criarRespostaSucessoPaginadaSchema(
  z.strictObject({ id: z.uuid(), rotulo: texto }),
);
export type OpcoesRelatorioResponse = z.output<
  typeof OpcoesRelatorioResponseSchema
>;
export const ErroRelatorioCodigoSchema = z.enum([
  "RELATORIO_LIMITE_EXCEDIDO",
  "RELATORIO_INDISPONIVEL",
  "RELATORIO_TEMPO_EXCEDIDO",
]);
