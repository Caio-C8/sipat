import * as z from "zod";
import {
  RespostaErroSchema,
  criarRespostaSucessoPaginadaSchema,
  criarRespostaSucessoSchema,
} from "../common";
import { DataCivilSchema, NumeroPatrimonialSchema } from "../patrimonio";
import {
  AusenciaJustificadaInventarioSchema,
  DateTimeUtcInventarioSchema,
  NomeInventarioSchema,
  StatusInventarioSchema,
  StatusPatrimonioNaVerificacaoSchema,
  StatusSetorInventarioSchema,
  TextoLongoInventarioSchema,
} from "./inventario-fields.schema";

const ContagemSchema = z.number().int().min(0);
const NomeRelacionadoSchema = z.string().trim().min(1).max(150);

export const ProgressoSetorInventarioSchema = z
  .strictObject({
    totalItens: ContagemSchema,
    itensPendentes: ContagemSchema,
    itensVerificados: ContagemSchema,
    corretos: ContagemSchema,
    divergencias: ContagemSchema,
    naoLocalizados: ContagemSchema,
  })
  .superRefine((progresso, contexto) => {
    if (
      progresso.totalItens !==
      progresso.itensPendentes + progresso.itensVerificados
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["totalItens"],
        message:
          "O total de itens deve corresponder à soma dos itens pendentes e verificados.",
      });
    }

    if (
      progresso.itensVerificados !==
      progresso.corretos + progresso.divergencias + progresso.naoLocalizados
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["itensVerificados"],
        message:
          "O total verificado deve corresponder às situações consolidadas.",
      });
    }
  });

export const ProgressoInventarioSchema = z
  .strictObject({
    totalSetores: ContagemSchema,
    setoresPendentes: ContagemSchema,
    setoresEmAndamento: ContagemSchema,
    setoresConcluidos: ContagemSchema,
    totalItens: ContagemSchema,
    itensPendentes: ContagemSchema,
    itensVerificados: ContagemSchema,
    corretos: ContagemSchema,
    divergencias: ContagemSchema,
    naoLocalizados: ContagemSchema,
    correcoesPendentes: ContagemSchema,
    correcoesCorrigidas: ContagemSchema,
  })
  .superRefine((progresso, contexto) => {
    if (
      progresso.totalSetores !==
      progresso.setoresPendentes +
        progresso.setoresEmAndamento +
        progresso.setoresConcluidos
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["totalSetores"],
        message: "O total de setores não corresponde aos estados informados.",
      });
    }

    if (
      progresso.totalItens !==
      progresso.itensPendentes + progresso.itensVerificados
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["totalItens"],
        message: "O total de itens não corresponde aos estados informados.",
      });
    }

    if (
      progresso.itensVerificados !==
      progresso.corretos + progresso.divergencias + progresso.naoLocalizados
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["itensVerificados"],
        message:
          "O total verificado deve corresponder às situações consolidadas.",
      });
    }

    if (
      progresso.divergencias !==
      progresso.correcoesPendentes + progresso.correcoesCorrigidas
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["divergencias"],
        message:
          "O total de divergências deve corresponder aos estados de correção.",
      });
    }
  });

const ComissaoInventarioResponseSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeRelacionadoSchema,
});

function validarDatasInventario(
  inventario: {
    status: "PENDENTE" | "EM_ANDAMENTO" | "FINALIZADO";
    dataInicio: string | null;
    dataFim: string | null;
    iniciadoPorId: string | null;
    finalizadoPorId: string | null;
  },
  contexto: z.RefinementCtx,
) {
  const inicioAusente =
    inventario.dataInicio === null && inventario.iniciadoPorId === null;
  const inicioCompleto =
    inventario.dataInicio !== null && inventario.iniciadoPorId !== null;
  const fimAusente =
    inventario.dataFim === null && inventario.finalizadoPorId === null;
  const fimCompleto =
    inventario.dataFim !== null && inventario.finalizadoPorId !== null;

  if (inventario.status === "PENDENTE" && (!inicioAusente || !fimAusente)) {
    contexto.addIssue({
      code: "custom",
      path: ["status"],
      message: "Inventário pendente não pode possuir início ou finalização.",
    });
  }

  if (
    inventario.status === "EM_ANDAMENTO" &&
    (!inicioCompleto || !fimAusente)
  ) {
    contexto.addIssue({
      code: "custom",
      path: ["status"],
      message:
        "Inventário em andamento deve possuir início e não pode possuir finalização.",
    });
  }

  if (inventario.status === "FINALIZADO" && (!inicioCompleto || !fimCompleto)) {
    contexto.addIssue({
      code: "custom",
      path: ["status"],
      message: "Inventário finalizado deve possuir início e finalização.",
    });
  }
}

export const InventarioResumoSchema = z
  .strictObject({
    id: z.uuid(),
    nome: NomeInventarioSchema,
    status: StatusInventarioSchema,
    dataInicio: DataCivilSchema.nullable(),
    dataFim: DataCivilSchema.nullable(),
    iniciadoPorId: z.uuid().nullable(),
    finalizadoPorId: z.uuid().nullable(),
    comissao: ComissaoInventarioResponseSchema,
    progresso: ProgressoInventarioSchema,
    createdAt: DateTimeUtcInventarioSchema,
    updatedAt: DateTimeUtcInventarioSchema.nullable(),
  })
  .superRefine(validarDatasInventario);

export const InventarioDetalheSchema = InventarioResumoSchema.safeExtend({
  descricao: TextoLongoInventarioSchema.nullable(),
  observacao: TextoLongoInventarioSchema.nullable(),
  createdById: z.uuid(),
});

const SetorRelacionadoResponseSchema = z.strictObject({
  id: z.uuid(),
  nome: NomeRelacionadoSchema,
});

export const SetorInventarioResumoSchema = z
  .strictObject({
    id: z.uuid(),
    status: StatusSetorInventarioSchema,
    setor: SetorRelacionadoResponseSchema,
    dataInicio: DateTimeUtcInventarioSchema.nullable(),
    dataFim: DateTimeUtcInventarioSchema.nullable(),
    iniciadoPorId: z.uuid().nullable(),
    concluidoPorId: z.uuid().nullable(),
    progresso: ProgressoSetorInventarioSchema,
  })
  .superRefine((setor, contexto) => {
    const inicioAusente =
      setor.dataInicio === null && setor.iniciadoPorId === null;
    const inicioCompleto =
      setor.dataInicio !== null && setor.iniciadoPorId !== null;
    const fimAusente = setor.dataFim === null && setor.concluidoPorId === null;
    const fimCompleto = setor.dataFim !== null && setor.concluidoPorId !== null;

    if (setor.status === "PENDENTE" && (!inicioAusente || !fimAusente)) {
      contexto.addIssue({
        code: "custom",
        path: ["status"],
        message: "Setor pendente não pode possuir início ou conclusão.",
      });
    }
    if (setor.status === "EM_ANDAMENTO" && (!inicioCompleto || !fimAusente)) {
      contexto.addIssue({
        code: "custom",
        path: ["status"],
        message:
          "Setor em andamento deve possuir início e não pode possuir conclusão.",
      });
    }
    if (setor.status === "CONCLUIDO" && (!inicioCompleto || !fimCompleto)) {
      contexto.addIssue({
        code: "custom",
        path: ["status"],
        message: "Setor concluído deve possuir início e conclusão.",
      });
    }
  });

const PatrimonioItemInventarioResponseSchema = z.strictObject({
  id: z.uuid(),
  numeroPatrimonio: NumeroPatrimonialSchema,
  descricao: z.string().trim().min(1).max(1_000),
});

const localizacaoPosteriorBaseShape = {
  id: z.uuid(),
  setorEncontrado: SetorRelacionadoResponseSchema,
  dataLocalizacao: DateTimeUtcInventarioSchema,
  localizadoPorId: z.uuid(),
  observacao: TextoLongoInventarioSchema.nullable(),
} as const;

const localizacaoPosteriorPendenteSchema = z.strictObject({
  ...localizacaoPosteriorBaseShape,
  statusCorrecao: z.literal("PENDENTE"),
  tipoCorrecao: z.null(),
  dataCorrecao: z.null(),
  corrigidoPorId: z.null(),
  transferenciaCorrecaoId: z.null(),
});

const localizacaoPosteriorRetornoSchema = z.strictObject({
  ...localizacaoPosteriorBaseShape,
  statusCorrecao: z.literal("CORRIGIDO"),
  tipoCorrecao: z.literal("RETORNO_AO_SETOR_CADASTRADO"),
  dataCorrecao: DateTimeUtcInventarioSchema,
  corrigidoPorId: z.uuid(),
  transferenciaCorrecaoId: z.null(),
});

const localizacaoPosteriorTransferenciaSchema = z.strictObject({
  ...localizacaoPosteriorBaseShape,
  statusCorrecao: z.literal("CORRIGIDO"),
  tipoCorrecao: z.literal("TRANSFERENCIA_CADASTRAL"),
  dataCorrecao: DateTimeUtcInventarioSchema,
  corrigidoPorId: z.uuid(),
  transferenciaCorrecaoId: z.uuid(),
});

export const LocalizacaoPosteriorInventarioResponseSchema = z.union([
  localizacaoPosteriorPendenteSchema,
  localizacaoPosteriorRetornoSchema,
  localizacaoPosteriorTransferenciaSchema,
]);

const itemBaseShape = {
  id: z.uuid(),
  patrimonio: PatrimonioItemInventarioResponseSchema,
  setorEsperado: SetorRelacionadoResponseSchema,
  observacao: TextoLongoInventarioSchema.nullable(),
} as const;

const itemPendenteSchema = z.strictObject({
  ...itemBaseShape,
  statusVerificacao: z.literal("PENDENTE"),
  situacao: z.null(),
  setorEncontrado: z.null(),
  dataVerificacao: z.null(),
  verificadoPorId: z.null(),
  statusPatrimonioNaVerificacao: z.null(),
  ausenciaJustificada: z.null(),
  statusCorrecao: z.null(),
  tipoCorrecao: z.null(),
  dataCorrecao: z.null(),
  corrigidoPorId: z.null(),
  transferenciaCorrecaoId: z.null(),
  localizacaoPosterior: z.null(),
});

const itemVerificadoBaseShape = {
  ...itemBaseShape,
  statusVerificacao: z.literal("VERIFICADO"),
  dataVerificacao: DateTimeUtcInventarioSchema,
  verificadoPorId: z.uuid(),
  statusPatrimonioNaVerificacao: StatusPatrimonioNaVerificacaoSchema,
} as const;

const itemCorretoSchema = z.strictObject({
  ...itemVerificadoBaseShape,
  situacao: z.literal("CORRETO"),
  setorEncontrado: z.null(),
  ausenciaJustificada: z.null(),
  statusCorrecao: z.null(),
  tipoCorrecao: z.null(),
  dataCorrecao: z.null(),
  corrigidoPorId: z.null(),
  transferenciaCorrecaoId: z.null(),
  localizacaoPosterior: z.null(),
});

const itemNaoLocalizadoSchema = z
  .strictObject({
    ...itemVerificadoBaseShape,
    situacao: z.literal("NAO_LOCALIZADO"),
    setorEncontrado: z.null(),
    ausenciaJustificada: AusenciaJustificadaInventarioSchema.nullable(),
    statusCorrecao: z.null(),
    tipoCorrecao: z.null(),
    dataCorrecao: z.null(),
    corrigidoPorId: z.null(),
    transferenciaCorrecaoId: z.null(),
    localizacaoPosterior:
      LocalizacaoPosteriorInventarioResponseSchema.nullable(),
  })
  .superRefine((item, contexto) => {
    const ausenciaCompativel =
      (item.statusPatrimonioNaVerificacao === "ATIVO" &&
        item.ausenciaJustificada === null) ||
      (item.statusPatrimonioNaVerificacao === "EMPRESTADO" &&
        item.ausenciaJustificada?.tipo === "EMPRESTIMO") ||
      (item.statusPatrimonioNaVerificacao === "EM_MANUTENCAO" &&
        item.ausenciaJustificada?.tipo === "MANUTENCAO");

    if (!ausenciaCompativel) {
      contexto.addIssue({
        code: "custom",
        path: ["ausenciaJustificada"],
        message:
          "A justificativa da ausência não corresponde ao status patrimonial observado.",
      });
    }
  });

const itemDivergentePendenteSchema = z.strictObject({
  ...itemVerificadoBaseShape,
  situacao: z.literal("DIVERGENCIA"),
  setorEncontrado: SetorRelacionadoResponseSchema,
  ausenciaJustificada: z.null(),
  statusCorrecao: z.literal("PENDENTE"),
  tipoCorrecao: z.null(),
  dataCorrecao: z.null(),
  corrigidoPorId: z.null(),
  transferenciaCorrecaoId: z.null(),
  localizacaoPosterior: z.null(),
});

const itemDivergenteRetornoSchema = z.strictObject({
  ...itemVerificadoBaseShape,
  situacao: z.literal("DIVERGENCIA"),
  setorEncontrado: SetorRelacionadoResponseSchema,
  ausenciaJustificada: z.null(),
  statusCorrecao: z.literal("CORRIGIDO"),
  tipoCorrecao: z.literal("RETORNO_AO_SETOR_CADASTRADO"),
  dataCorrecao: DateTimeUtcInventarioSchema,
  corrigidoPorId: z.uuid(),
  transferenciaCorrecaoId: z.null(),
  localizacaoPosterior: z.null(),
});

const itemDivergenteTransferenciaSchema = z.strictObject({
  ...itemVerificadoBaseShape,
  situacao: z.literal("DIVERGENCIA"),
  setorEncontrado: SetorRelacionadoResponseSchema,
  ausenciaJustificada: z.null(),
  statusCorrecao: z.literal("CORRIGIDO"),
  tipoCorrecao: z.literal("TRANSFERENCIA_CADASTRAL"),
  dataCorrecao: DateTimeUtcInventarioSchema,
  corrigidoPorId: z.uuid(),
  transferenciaCorrecaoId: z.uuid(),
  localizacaoPosterior: z.null(),
});

export const ItemInventarioResponseSchema = z.union([
  itemPendenteSchema,
  itemCorretoSchema,
  itemNaoLocalizadoSchema,
  itemDivergentePendenteSchema,
  itemDivergenteRetornoSchema,
  itemDivergenteTransferenciaSchema,
]);

export const VerificarItemInventarioResultadoSchema = z.discriminatedUnion(
  "tipo",
  [
    z.strictObject({
      tipo: z.literal("CONFERENCIA_REGISTRADA"),
      item: ItemInventarioResponseSchema,
    }),
    z.strictObject({
      tipo: z.literal("LEITURA_IDEMPOTENTE"),
      item: ItemInventarioResponseSchema,
    }),
    z.strictObject({
      tipo: z.literal("LOCALIZACAO_POSTERIOR_REGISTRADA"),
      item: ItemInventarioResponseSchema,
    }),
    z.strictObject({
      tipo: z.literal("LOCALIZACAO_POSTERIOR_IDEMPOTENTE"),
      item: ItemInventarioResponseSchema,
    }),
  ],
);

export const ItemJaVerificadoOutroSetorDadosSchema = z.discriminatedUnion(
  "contextoLocalizacao",
  [
    z.strictObject({
      itemInventarioId: z.uuid(),
      setorPrimeiraVerificacao: SetorRelacionadoResponseSchema,
      verificadoEm: DateTimeUtcInventarioSchema,
      contextoLocalizacao: z.literal("TRANSFERENCIA_POSTERIOR_REGISTRADA"),
      transferenciaId: z.uuid(),
    }),
    z.strictObject({
      itemInventarioId: z.uuid(),
      setorPrimeiraVerificacao: SetorRelacionadoResponseSchema,
      verificadoEm: DateTimeUtcInventarioSchema,
      contextoLocalizacao: z.literal("MOVIMENTACAO_FISICA_SEM_HISTORICO"),
    }),
  ],
);

export const ItemJaVerificadoOutroSetorResponseSchema =
  RespostaErroSchema.safeExtend({
    status: z.literal(409),
    codigo: z.literal("ITEM_INVENTARIO_JA_VERIFICADO"),
    dados: ItemJaVerificadoOutroSetorDadosSchema,
  });

export const ListarInventariosResponseSchema =
  criarRespostaSucessoPaginadaSchema(InventarioResumoSchema);
export const CriarInventarioResponseSchema = criarRespostaSucessoSchema(
  InventarioDetalheSchema,
);
export const ConsultarInventarioResponseSchema = criarRespostaSucessoSchema(
  InventarioDetalheSchema,
);
export const ListarSetoresInventarioResponseSchema =
  criarRespostaSucessoPaginadaSchema(SetorInventarioResumoSchema);
export const ListarItensInventarioResponseSchema =
  criarRespostaSucessoPaginadaSchema(ItemInventarioResponseSchema);
export const IniciarSetorInventarioResponseSchema = criarRespostaSucessoSchema(
  SetorInventarioResumoSchema,
);
export const ConcluirSetorInventarioResponseSchema = criarRespostaSucessoSchema(
  SetorInventarioResumoSchema,
);
export const VerificarItemInventarioResponseSchema = criarRespostaSucessoSchema(
  VerificarItemInventarioResultadoSchema,
);
export const CorrigirItemInventarioResponseSchema = criarRespostaSucessoSchema(
  ItemInventarioResponseSchema,
);
export const FinalizarInventarioResponseSchema = criarRespostaSucessoSchema(
  InventarioDetalheSchema,
);

export type ProgressoSetorInventario = z.output<
  typeof ProgressoSetorInventarioSchema
>;
export type ProgressoInventario = z.output<typeof ProgressoInventarioSchema>;
export type InventarioResumo = z.output<typeof InventarioResumoSchema>;
export type InventarioDetalhe = z.output<typeof InventarioDetalheSchema>;
export type SetorInventarioResumo = z.output<
  typeof SetorInventarioResumoSchema
>;
export type ItemInventarioResponse = z.output<
  typeof ItemInventarioResponseSchema
>;
export type LocalizacaoPosteriorInventarioResponse = z.output<
  typeof LocalizacaoPosteriorInventarioResponseSchema
>;
export type VerificarItemInventarioResultado = z.output<
  typeof VerificarItemInventarioResultadoSchema
>;
export type ItemJaVerificadoOutroSetorDados = z.output<
  typeof ItemJaVerificadoOutroSetorDadosSchema
>;
export type ListarInventariosResponse = z.output<
  typeof ListarInventariosResponseSchema
>;
export type CriarInventarioResponse = z.output<
  typeof CriarInventarioResponseSchema
>;
export type ConsultarInventarioResponse = z.output<
  typeof ConsultarInventarioResponseSchema
>;
export type ListarSetoresInventarioResponse = z.output<
  typeof ListarSetoresInventarioResponseSchema
>;
export type ListarItensInventarioResponse = z.output<
  typeof ListarItensInventarioResponseSchema
>;
export type IniciarSetorInventarioResponse = z.output<
  typeof IniciarSetorInventarioResponseSchema
>;
export type ConcluirSetorInventarioResponse = z.output<
  typeof ConcluirSetorInventarioResponseSchema
>;
export type VerificarItemInventarioResponse = z.output<
  typeof VerificarItemInventarioResponseSchema
>;
export type CorrigirItemInventarioResponse = z.output<
  typeof CorrigirItemInventarioResponseSchema
>;
export type FinalizarInventarioResponse = z.output<
  typeof FinalizarInventarioResponseSchema
>;
export type ItemJaVerificadoOutroSetorResponse = z.output<
  typeof ItemJaVerificadoOutroSetorResponseSchema
>;
