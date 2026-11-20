import * as z from "zod";
import { criarRespostaSucessoSchema } from "../common";
import { StatusPatrimonioSchema } from "../patrimonio/patrimonio-fields.schema";

const contagem = z.int().nonnegative();
const destino = z.string().startsWith("/");

const DashboardOperacionalSchema = z.strictObject({
  totais: z.strictObject({
    total: contagem,
    porStatus: z.record(StatusPatrimonioSchema, contagem),
  }),
  pendencias: z.strictObject({
    inventarios: z
      .array(
        z.strictObject({
          id: z.uuid(),
          nome: z.string().min(1),
          quantidadeCorrecoes: contagem.positive(),
          pendenciaMaisAntigaEm: z.iso.datetime(),
          destino,
        }),
      )
      .max(3),
    manutencoes: z
      .array(
        z.strictObject({
          id: z.uuid(),
          numeroPedido: z.string().regex(/^\d+$/),
          dataEnvio: z.iso.date(),
          quantidadeItensSemRetorno: contagem.positive(),
          destino,
        }),
      )
      .max(3),
    depreciacao: z
      .strictObject({
        competencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
        quantidadePatrimonios: contagem.positive(),
        destino,
      })
      .nullable(),
  }),
  setores: z
    .array(
      z.strictObject({
        id: z.uuid(),
        nome: z.string().min(1),
        total: contagem.positive(),
        destino,
      }),
    )
    .max(5),
  atividades: z
    .array(
      z.strictObject({
        patrimonioId: z.uuid(),
        numeroPatrimonio: z.string().min(1),
        tipo: z.enum([
          "CADASTRO",
          "SUBSTITUICAO_NUMERO",
          "MOVIMENTACAO",
          "BAIXA",
          "EMPRESTIMO",
          "DEVOLUCAO",
          "MANUTENCAO_ENVIO",
          "MANUTENCAO_RETORNO",
          "REAVALIACAO",
          "DEPRECIACAO",
          "INVENTARIO_VERIFICACAO",
          "INVENTARIO_CORRECAO",
        ]),
        titulo: z.string().min(1),
        registradoEm: z.iso.datetime(),
        destino,
      }),
    )
    .max(3),
});

export type DashboardOperacional = z.output<typeof DashboardOperacionalSchema>;
export const DashboardOperacionalResponseSchema = criarRespostaSucessoSchema(
  DashboardOperacionalSchema,
);
export type DashboardOperacionalResponse = z.output<
  typeof DashboardOperacionalResponseSchema
>;
