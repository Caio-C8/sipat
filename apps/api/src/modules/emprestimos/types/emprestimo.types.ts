import { Prisma } from "@repo/database";

export const emprestimoInclude = {
  patrimonio: { select: { id: true, numeroPatrimonio: true, descricao: true } },
  setorVinculo: { select: { id: true, nome: true } },
  comissao: { select: { id: true, nome: true } },
  createdBy: { select: { id: true, nome: true } },
  devolucao: {
    include: {
      comissao: { select: { id: true, nome: true } },
      createdBy: { select: { id: true, nome: true } },
    },
  },
} satisfies Prisma.EmprestimoPatrimonioInclude;

export type EmprestimoRegistro = Prisma.EmprestimoPatrimonioGetPayload<{
  include: typeof emprestimoInclude;
}>;
export type EmprestimoResumoRow = {
  id: string;
  modoAgrupamento: "EM_GRUPO" | "SEPARADAMENTE" | null;
  destinatario: string | null;
  dataEmprestimo: Date;
  dataPrevistaDevolucao: Date | null;
  total: bigint;
  pendentes: bigint;
  emAtraso: boolean;
  createdAt: Date;
};
