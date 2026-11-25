import type {
  ItemManutencao,
  ManutencaoDetalhe,
  ManutencaoResumo,
} from "@repo/contracts";
import type { ItemManutencaoPayload, ManutencaoPayload } from "../types";

const dia = (valor: Date | null) => valor?.toISOString().slice(0, 10) ?? null;
const instante = (valor: Date | null) => valor?.toISOString() ?? null;

export class ManutencaoResponseMapper {
  static item(pedidoId: string, item: ItemManutencaoPayload): ItemManutencao {
    const revisoes = item.revisoesOrcamento.map((revisao) => ({
      id: revisao.id,
      versao: revisao.versao,
      dataOrcamento: dia(revisao.dataOrcamento)!,
      descricaoOrcamento: revisao.descricaoOrcamento,
      valorOrcamento: revisao.valorOrcamento.toString(),
      fornecedor: revisao.fornecedor
        ? { id: revisao.fornecedor.id, nome: revisao.fornecedor.razaoSocial }
        : null,
      registradoPor: { id: revisao.createdBy.id, nome: revisao.createdBy.nome },
      createdAt: revisao.createdAt.toISOString(),
    }));
    return {
      id: item.id,
      patrimonio: item.patrimonio,
      tipo: item.tipo,
      fornecedor: item.fornecedor
        ? { id: item.fornecedor.id, nome: item.fornecedor.razaoSocial }
        : null,
      previsaoRetorno: dia(item.previsaoRetorno),
      descricaoProblema: item.descricaoProblema,
      versaoOrcamento: item.versaoOrcamento,
      orcamentoAtual: revisoes.at(-1) ?? null,
      revisoesOrcamento: revisoes,
      dataRetorno: item.dataRetorno?.toISOString() ?? null,
      descricaoServicoRealizado: item.descricaoServicoRealizado,
      valorRealizado: item.valorRealizado?.toString() ?? null,
      garantia:
        item.descricaoGarantia || item.dataFimGarantia
          ? {
              ...(item.descricaoGarantia
                ? { descricao: item.descricaoGarantia }
                : {}),
              ...(item.dataFimGarantia
                ? { dataFim: dia(item.dataFimGarantia)! }
                : {}),
            }
          : null,
      recebidoPor: item.recebidoPor,
      recebidoEm: instante(item.recebidoEm),
      anexoObservacao: item.caminhoAnexoObservacao
        ? {
            url: `/api/backend/manutencoes/${pedidoId}/itens/${item.id}/anexo-observacao`,
          }
        : null,
    };
  }

  static resumo(pedido: {
    id: string;
    numeroPedido: bigint;
    numeroRequisicao: string | null;
    dataEnvio: Date;
    dataRetorno: Date | null;
    status: "EM_ANDAMENTO" | "CONCLUIDA";
    totalItens: number;
    itensPendentes: number;
    temAnexoObservacao: boolean;
  }): ManutencaoResumo {
    return {
      id: pedido.id,
      numeroPedido: pedido.numeroPedido.toString(),
      numeroRequisicao: pedido.numeroRequisicao,
      dataEnvio: pedido.dataEnvio.toISOString(),
      dataRetorno: pedido.dataRetorno?.toISOString() ?? null,
      status: pedido.status,
      totalItens: pedido.totalItens,
      itensPendentes: pedido.itensPendentes,
      itensRetornados: pedido.totalItens - pedido.itensPendentes,
      temAnexoObservacao: pedido.temAnexoObservacao,
    };
  }

  static detalhe(pedido: ManutencaoPayload): ManutencaoDetalhe {
    return {
      ...this.resumo({
        id: pedido.id,
        numeroPedido: pedido.numeroPedido,
        numeroRequisicao: pedido.numeroRequisicao,
        dataEnvio: pedido.dataEnvio,
        dataRetorno: pedido.dataRetorno,
        status: pedido.status,
        totalItens: pedido.itens.length,
        itensPendentes: pedido.itens.filter((item) => !item.dataRetorno).length,
        temAnexoObservacao: Boolean(pedido.caminhoAnexoObservacao),
      }),
      justificativa: pedido.justificativa,
      comissao: pedido.comissao,
      criadoPor: pedido.createdBy,
      criadoEm: pedido.createdAt.toISOString(),
      itens: pedido.itens.map((item) => this.item(pedido.id, item)),
      anexoObservacao: pedido.caminhoAnexoObservacao
        ? {
            url: `/api/backend/manutencoes/${pedido.id}/anexo-observacao`,
          }
        : null,
    };
  }
}
