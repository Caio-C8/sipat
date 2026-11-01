import {
  ConsultaRelatorioSchema,
  RelatorioTabularResponseSchema,
  type TipoTabular,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
export function consultaRelatorio(
  filtros: Record<string, unknown>,
  instante: Date,
  criterioTemporal: string,
  ordenacao: string,
  avisos: string[] = [],
  excluidosDataDesconhecida = 0,
) {
  const aplicados = Object.fromEntries(
    Object.entries(filtros).filter(
      ([k, v]) => k !== "pagina" && k !== "limite" && v !== undefined,
    ),
  );
  return ConsultaRelatorioSchema.parse({
    id: randomUUID(),
    instante: instante.toISOString(),
    filtros: aplicados,
    criterioTemporal,
    ordenacao,
    avisos,
    excluidosDataDesconhecida,
  });
}
export function respostaTabular(
  tipo: TipoTabular,
  dados: unknown[],
  resumo: unknown,
  pagina: number,
  limite: number,
  total: number,
  consulta: ReturnType<typeof consultaRelatorio>,
) {
  return RelatorioTabularResponseSchema.parse({
    status: 200,
    sucesso: true,
    mensagem: "Relatório consultado.",
    tipo,
    dados,
    resumo,
    meta: {
      pagina,
      limite,
      total,
      ultimaPagina: Math.max(1, Math.ceil(total / limite)),
    },
    consulta,
  });
}
