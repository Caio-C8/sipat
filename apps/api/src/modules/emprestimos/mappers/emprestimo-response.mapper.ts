import type {
  EmprestimoDetalhe,
  EmprestimoResumo,
  ItemEmprestimo,
} from "@repo/contracts";
import type {
  EmprestimoRegistro,
  EmprestimoResumoRow,
} from "../types/emprestimo.types";
import { diaSaoPaulo } from "../../../common/utils/datas-institucionais";

export class EmprestimoResponseMapper {
  static paraResumo(row: EmprestimoResumoRow): EmprestimoResumo {
    const pendentes = Number(row.pendentes);
    return {
      id: row.id,
      modoAgrupamento: row.modoAgrupamento,
      destinatario: row.destinatario,
      dataEmprestimo: row.dataEmprestimo.toISOString(),
      dataPrevistaDevolucao: row.dataPrevistaDevolucao?.toISOString() ?? null,
      total: Number(row.total),
      pendentes,
      situacao: pendentes > 0 ? "EM_ANDAMENTO" : "CONCLUIDO",
      emAtraso: row.emAtraso,
      createdAt: row.createdAt.toISOString(),
    };
  }

  static paraDetalhe(
    registros: EmprestimoRegistro[],
    agora = new Date(),
  ): EmprestimoDetalhe {
    const primeiro = registros[0]!;
    const hoje = diaSaoPaulo(agora);
    const pendentes = registros.filter((r) => !r.devolucao).length;
    const emAtraso = registros.some(
      (r) =>
        !r.devolucao &&
        r.dataPrevistaDevolucao !== null &&
        r.dataPrevistaDevolucao.toISOString().slice(0, 10) < hoje,
    );
    return {
      id: primeiro.grupoEmprestimoId,
      modoAgrupamento: primeiro.modoAgrupamento,
      destinatario: primeiro.destinatario,
      dataEmprestimo: primeiro.dataEmprestimo.toISOString(),
      dataPrevistaDevolucao:
        primeiro.dataPrevistaDevolucao?.toISOString() ?? null,
      total: registros.length,
      pendentes,
      situacao: pendentes > 0 ? "EM_ANDAMENTO" : "CONCLUIDO",
      emAtraso,
      createdAt: primeiro.createdAt.toISOString(),
      finalidade: primeiro.finalidade,
      observacao: primeiro.observacao,
      comissao: primeiro.comissao,
      registradoPor: primeiro.createdBy,
      itens: registros.map((registro) => this.paraItem(registro)),
    };
  }

  static paraItem(registro: EmprestimoRegistro): ItemEmprestimo {
    const devolucao = registro.devolucao;
    return {
      id: registro.id,
      patrimonio: registro.patrimonio,
      setorVinculo: registro.setorVinculo,
      pendente: devolucao === null,
      devolucao: devolucao
        ? {
            id: devolucao.id,
            dataDevolucao: devolucao.dataDevolucao.toISOString(),
            createdAt: devolucao.createdAt.toISOString(),
            observacao: devolucao.observacao,
            comissao: devolucao.comissao,
            registradoPor: devolucao.createdBy,
            aposPrevisao:
              registro.dataPrevistaDevolucao === null
                ? null
                : devolucao.dataDevolucao.toISOString().slice(0, 10) >
                  registro.dataPrevistaDevolucao.toISOString().slice(0, 10),
          }
        : null,
    };
  }
}
