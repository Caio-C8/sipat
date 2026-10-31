import * as z from "zod";
import {
  ChaveIdempotenciaSchema,
  CODIGOS_CONFLITO_IDEMPOTENCIA,
  PaginacaoQuerySchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";
import {
  DataCivilSchema,
  Decimal19_7Schema,
  NumeroPatrimonialSchema,
} from "../patrimonio";

const UuidSchema = z.uuid().transform((id) => id.toLowerCase());
const TextoBuscaSchema = z.string().trim().min(1).max(200);
const TextoLongoSchema = z.string().trim().min(1).max(10_000);
const DataHoraSchema = z.iso.datetime({ precision: 3 });
const RelacionadoSchema = z.strictObject({
  id: z.uuid(),
  nome: z.string().min(1),
});

export const LIMITE_ITENS_MANUTENCAO = 50;
export const LIMITE_DOCUMENTOS_ITEM_MANUTENCAO = 20;
export const LIMITE_BYTES_DOCUMENTO_MANUTENCAO = 10 * 1024 * 1024;
export const TipoManutencaoSchema = z.enum(["PREVENTIVA", "CORRETIVA"]);
export const StatusManutencaoSchema = z.enum(["EM_ANDAMENTO", "CONCLUIDA"]);
export const FaseDocumentoManutencaoSchema = z.enum([
  "PEDIDO",
  "ENVIO",
  "RECEBIMENTO",
  "LEGADO",
]);
export const CODIGOS_ERRO_MANUTENCAO = [
  "DATA_ENVIO_FUTURA",
  "DATA_RETORNO_INVALIDA",
  "GARANTIA_DATA_INVALIDA",
  "MANUTENCAO_NAO_ENCONTRADA",
  "ITEM_MANUTENCAO_NAO_ENCONTRADO",
  "DOCUMENTO_MANUTENCAO_NAO_ENCONTRADO",
  "PATRIMONIO_NAO_ENCONTRADO",
  "PATRIMONIO_NAO_ATIVO",
  "PATRIMONIO_NAO_EM_MANUTENCAO",
  "PATRIMONIO_EM_OUTRA_MANUTENCAO",
  "COMISSAO_NAO_ENCONTRADA",
  "COMISSAO_FORA_DA_VIGENCIA",
  "FORNECEDOR_NAO_ENCONTRADO",
  "FORNECEDOR_INATIVO",
  "SETOR_EM_INVENTARIO_EM_ANDAMENTO",
  "ITEM_JA_RECEBIDO",
  "ORCAMENTO_VERSAO_DIVERGENTE",
  ...CODIGOS_CONFLITO_IDEMPOTENCIA,
  "CONFLITO_CONCORRENTE_MANUTENCAO",
  "LIMITE_DOCUMENTOS_MANUTENCAO",
  "DOCUMENTO_MANUTENCAO_INVALIDO",
  "DOCUMENTO_MANUTENCAO_MUITO_GRANDE",
] as const;
export const CodigoErroManutencaoSchema = z.enum(CODIGOS_ERRO_MANUTENCAO);

export const ManutencaoParamsSchema = z.strictObject({
  manutencaoId: UuidSchema,
});
export const ItemManutencaoParamsSchema = ManutencaoParamsSchema.extend({
  itemId: UuidSchema,
});
export const DocumentoManutencaoParamsSchema = ManutencaoParamsSchema.extend({
  documentoId: UuidSchema,
});
export const ListarManutencoesQuerySchema = PaginacaoQuerySchema.extend({
  busca: TextoBuscaSchema.optional(),
  status: StatusManutencaoSchema.optional(),
  dataEnvioInicio: DataCivilSchema.optional(),
  dataEnvioFim: DataCivilSchema.optional(),
}).superRefine((dados, contexto) => {
  if (
    dados.dataEnvioInicio &&
    dados.dataEnvioFim &&
    dados.dataEnvioInicio > dados.dataEnvioFim
  )
    contexto.addIssue({
      code: "custom",
      path: ["dataEnvioFim"],
      message: "A data final não pode ser anterior à inicial.",
    });
});
export const ListarFornecedoresManutencaoQuerySchema =
  PaginacaoQuerySchema.extend({
    busca: TextoBuscaSchema.optional(),
  });
export const ListarComissoesManutencaoQuerySchema =
  ListarFornecedoresManutencaoQuerySchema.extend({
    dataEnvio: DataCivilSchema,
  });

export const OrcamentoInicialManutencaoSchema = z.strictObject({
  dataOrcamento: DataCivilSchema,
  descricaoOrcamento: TextoLongoSchema,
  valorOrcamento: Decimal19_7Schema,
});
export const ItemCriacaoManutencaoSchema = z.strictObject({
  patrimonioId: UuidSchema,
  tipo: TipoManutencaoSchema,
  fornecedorId: UuidSchema.nullable().optional(),
  previsaoRetorno: DataCivilSchema.nullable().optional(),
  descricaoProblema: TextoLongoSchema.nullable().optional(),
  orcamentoInicial: OrcamentoInicialManutencaoSchema.optional(),
});
export const CriarManutencaoBodySchema = z
  .strictObject({
    chaveIdempotencia: ChaveIdempotenciaSchema,
    dataEnvio: DataCivilSchema,
    comissaoId: UuidSchema,
    justificativa: TextoLongoSchema.nullable().optional(),
    itens: z
      .array(ItemCriacaoManutencaoSchema)
      .min(1)
      .max(LIMITE_ITENS_MANUTENCAO),
  })
  .superRefine((dados, contexto) => {
    const ids = new Set<string>();
    dados.itens.forEach((item, indice) => {
      if (ids.has(item.patrimonioId))
        contexto.addIssue({
          code: "custom",
          path: ["itens", indice, "patrimonioId"],
          message: "O patrimônio não pode ser repetido.",
        });
      ids.add(item.patrimonioId);
    });
  });
export const AtualizarOrcamentoManutencaoBodySchema = z.strictObject({
  versaoEsperada: z.number().int().min(0),
  fornecedorId: UuidSchema.nullable().optional(),
  dataOrcamento: DataCivilSchema,
  descricaoOrcamento: TextoLongoSchema,
  valorOrcamento: Decimal19_7Schema,
});
export const GarantiaManutencaoSchema = z.strictObject({
  descricao: TextoLongoSchema,
  dataFim: DataCivilSchema.optional(),
});
export const RegistrarRetornoManutencaoBodySchema = z.strictObject({
  chaveIdempotencia: ChaveIdempotenciaSchema,
  dataRetorno: DataCivilSchema,
  descricaoServicoRealizado: TextoLongoSchema,
  valorRealizado: Decimal19_7Schema,
  garantia: GarantiaManutencaoSchema.nullable(),
});
export const DadosDocumentoManutencaoSchema = z
  .strictObject({
    chaveIdempotencia: ChaveIdempotenciaSchema,
    fase: z.enum(["PEDIDO", "ENVIO", "RECEBIMENTO"]),
    itemId: UuidSchema.optional(),
  })
  .superRefine((dados, contexto) => {
    if ((dados.fase === "PEDIDO") === Boolean(dados.itemId))
      contexto.addIssue({
        code: "custom",
        path: ["itemId"],
        message: "Informe o item somente para envio ou recebimento.",
      });
  });
export const CampoDadosDocumentoManutencaoSchema = z
  .string({ error: "O campo dados deve ser uma string JSON." })
  .transform((valor, contexto) => {
    try {
      return JSON.parse(valor) as unknown;
    } catch {
      contexto.addIssue({
        code: "custom",
        message: "O campo dados deve conter JSON válido.",
      });
      return z.NEVER;
    }
  })
  .pipe(DadosDocumentoManutencaoSchema);

export const RevisaoOrcamentoManutencaoSchema = z.strictObject({
  id: z.uuid(),
  versao: z.number().int().min(1),
  dataOrcamento: DataCivilSchema,
  descricaoOrcamento: z.string(),
  valorOrcamento: Decimal19_7Schema,
  fornecedor: RelacionadoSchema.nullable(),
  registradoPor: RelacionadoSchema,
  createdAt: DataHoraSchema,
});
export const DocumentoManutencaoSchema = z.strictObject({
  id: z.uuid(),
  fase: FaseDocumentoManutencaoSchema,
  itemId: z.uuid().nullable(),
  tamanhoBytes: z.number().int().min(0).nullable(),
  nome: z.string().min(1),
  criadoEm: DataHoraSchema,
  url: z.string().startsWith("/api/backend/manutencoes/"),
});
export const ItemManutencaoSchema = z.strictObject({
  id: z.uuid(),
  patrimonio: z.strictObject({
    id: z.uuid(),
    numeroPatrimonio: NumeroPatrimonialSchema,
    descricao: z.string(),
    status: z.enum(["ATIVO", "EM_MANUTENCAO", "EMPRESTADO", "BAIXADO"]),
  }),
  tipo: TipoManutencaoSchema,
  fornecedor: RelacionadoSchema.nullable(),
  previsaoRetorno: DataCivilSchema.nullable(),
  descricaoProblema: z.string().nullable(),
  versaoOrcamento: z.number().int().min(0),
  orcamentoAtual: RevisaoOrcamentoManutencaoSchema.nullable(),
  revisoesOrcamento: z.array(RevisaoOrcamentoManutencaoSchema),
  dataRetorno: DataCivilSchema.nullable(),
  descricaoServicoRealizado: z.string().nullable(),
  valorRealizado: Decimal19_7Schema.nullable(),
  garantia: GarantiaManutencaoSchema.nullable(),
  recebidoPor: RelacionadoSchema.nullable(),
  recebidoEm: DataHoraSchema.nullable(),
  documentos: z.array(DocumentoManutencaoSchema),
});
export const ManutencaoResumoSchema = z.strictObject({
  id: z.uuid(),
  numeroRequisicao: z.string().nullable(),
  dataEnvio: DataCivilSchema,
  dataRetorno: DataCivilSchema.nullable(),
  status: StatusManutencaoSchema,
  totalItens: z.number().int().min(0),
  itensPendentes: z.number().int().min(0),
  itensRetornados: z.number().int().min(0),
  temPdfPedido: z.boolean(),
});
export const ManutencaoDetalheSchema = ManutencaoResumoSchema.extend({
  justificativa: z.string().nullable(),
  comissao: RelacionadoSchema,
  criadoPor: RelacionadoSchema,
  criadoEm: DataHoraSchema,
  itens: z.array(ItemManutencaoSchema),
  documentos: z.array(DocumentoManutencaoSchema),
});
export const FornecedorOpcaoManutencaoSchema = RelacionadoSchema;
export const ComissaoOpcaoManutencaoSchema = RelacionadoSchema.extend({
  dataVigenciaInicio: DataCivilSchema,
  dataVigenciaFim: DataCivilSchema,
});
export const RetornoManutencaoSchema = z.strictObject({
  item: ItemManutencaoSchema,
  statusPedido: StatusManutencaoSchema,
  dataRetornoPedido: DataCivilSchema.nullable(),
});
export const ListarManutencoesResponseSchema =
  criarRespostaSucessoPaginadaSchema(ManutencaoResumoSchema);
export const ConsultarManutencaoResponseSchema = criarRespostaSucessoSchema(
  ManutencaoDetalheSchema,
);
export const CriarManutencaoResponseSchema = ConsultarManutencaoResponseSchema;
export const AtualizarOrcamentoManutencaoResponseSchema =
  criarRespostaSucessoSchema(ItemManutencaoSchema);
export const RegistrarRetornoManutencaoResponseSchema =
  criarRespostaSucessoSchema(RetornoManutencaoSchema);
export const EnviarDocumentoManutencaoResponseSchema =
  criarRespostaSucessoSchema(DocumentoManutencaoSchema);
export const ListarFornecedoresManutencaoResponseSchema =
  criarRespostaSucessoPaginadaSchema(FornecedorOpcaoManutencaoSchema);
export const ListarComissoesManutencaoResponseSchema =
  criarRespostaSucessoPaginadaSchema(ComissaoOpcaoManutencaoSchema);

export type CriarManutencaoBodyData = z.output<
  typeof CriarManutencaoBodySchema
>;
export type CriarManutencaoBodyInput = z.input<
  typeof CriarManutencaoBodySchema
>;
export type AtualizarOrcamentoManutencaoBodyData = z.output<
  typeof AtualizarOrcamentoManutencaoBodySchema
>;
export type RegistrarRetornoManutencaoBodyData = z.output<
  typeof RegistrarRetornoManutencaoBodySchema
>;
export type DadosDocumentoManutencao = z.output<
  typeof DadosDocumentoManutencaoSchema
>;
export type ListarManutencoesQueryData = z.output<
  typeof ListarManutencoesQuerySchema
>;
export type ListarManutencoesQueryInput = z.input<
  typeof ListarManutencoesQuerySchema
>;
export type ListarFornecedoresManutencaoQueryData = z.output<
  typeof ListarFornecedoresManutencaoQuerySchema
>;
export type ListarComissoesManutencaoQueryData = z.output<
  typeof ListarComissoesManutencaoQuerySchema
>;
export type ManutencaoResumo = z.output<typeof ManutencaoResumoSchema>;
export type ManutencaoDetalhe = z.output<typeof ManutencaoDetalheSchema>;
export type ItemManutencao = z.output<typeof ItemManutencaoSchema>;
export type DocumentoManutencao = z.output<typeof DocumentoManutencaoSchema>;
export type RetornoManutencao = z.output<typeof RetornoManutencaoSchema>;
export type ListarManutencoesResponse = z.output<
  typeof ListarManutencoesResponseSchema
>;
export type ConsultarManutencaoResponse = z.output<
  typeof ConsultarManutencaoResponseSchema
>;
export type CriarManutencaoResponse = z.output<
  typeof CriarManutencaoResponseSchema
>;
export type AtualizarOrcamentoManutencaoResponse = z.output<
  typeof AtualizarOrcamentoManutencaoResponseSchema
>;
export type RegistrarRetornoManutencaoResponse = z.output<
  typeof RegistrarRetornoManutencaoResponseSchema
>;
export type EnviarDocumentoManutencaoResponse = z.output<
  typeof EnviarDocumentoManutencaoResponseSchema
>;
export type ListarFornecedoresManutencaoResponse = z.output<
  typeof ListarFornecedoresManutencaoResponseSchema
>;
export type ListarComissoesManutencaoResponse = z.output<
  typeof ListarComissoesManutencaoResponseSchema
>;
