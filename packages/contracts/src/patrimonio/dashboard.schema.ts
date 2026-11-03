import * as z from "zod";
import { criarRespostaSucessoSchema } from "../common";
import { StatusPatrimonioSchema } from "./patrimonio-fields.schema";

const contagem = z.int().nonnegative();
const resumo = z.strictObject({
  total: contagem,
  porStatus: z.record(StatusPatrimonioSchema, contagem),
  correcoesPendentes: contagem,
  setores: z
    .array(z.strictObject({ id: z.uuid(), nome: z.string(), total: contagem }))
    .max(4),
  atividades: z
    .array(
      z.strictObject({
        patrimonioId: z.uuid(),
        numero: z.string(),
        titulo: z.string(),
        registradoEm: z.iso.datetime(),
      }),
    )
    .max(3),
});
export type ResumoPatrimonialDashboard = z.output<typeof resumo>;
export const DashboardPatrimonialResponseSchema =
  criarRespostaSucessoSchema(resumo);
