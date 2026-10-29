import type {
  DocumentoManutencao,
  ItemManutencao,
  ManutencaoDetalhe,
  ManutencaoResumo,
} from "@repo/contracts";
import type { DocumentoManutencao as DocumentoPersistido } from "@repo/database";
import type { ItemManutencaoPayload, ManutencaoPayload } from "../types";

const dia = (valor: Date | null) => valor?.toISOString().slice(0, 10) ?? null;
const instante = (valor: Date | null) => valor?.toISOString() ?? null;

export class ManutencaoResponseMapper {
  static documento(
    pedidoId: string,
    documento: DocumentoPersistido,
  ): DocumentoManutencao {
    return {
      id: documento.id,
      fase: documento.fase,
      itemId: documento.itemId,
      tamanhoBytes: documento.tamanhoBytes,
      nome: documento.nome,
      criadoEm: documento.createdAt.toISOString(),
      url: `/api/backend/manutencoes/${pedidoId}/documentos/${documento.id}`,
    };
  }

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
      dataRetorno: dia(item.dataRetorno),
      descricaoServicoRealizado: item.descricaoServicoRealizado,
      valorRealizado: item.valorRealizado?.toString() ?? null,
      garantia: item.descricaoGarantia
        ? {
            descricao: item.descricaoGarantia,
            ...(item.dataFimGarantia
              ? { dataFim: dia(item.dataFimGarantia)! }
              : {}),
          }
        : null,
      recebidoPor: item.recebidoPor,
      recebidoEm: instante(item.recebidoEm),
      documentos: item.documentos.map((doc) => this.documento(pedidoId, doc)),
    };
  }

  static resumo(pedido: {
    id: string;
    numeroRequisicao: string | null;
    dataEnvio: Date;
    dataRetorno: Date | null;
    status: "EM_ANDAMENTO" | "CONCLUIDA";
    totalItens: number;
    itensPendentes: number;
    temPdfPedido: boolean;
  }): ManutencaoResumo {
    return {
      id: pedido.id,
      numeroRequisicao: pedido.numeroRequisicao,
      dataEnvio: dia(pedido.dataEnvio)!,
      dataRetorno: dia(pedido.dataRetorno),
      status: pedido.status,
      totalItens: pedido.totalItens,
      itensPendentes: pedido.itensPendentes,
      itensRetornados: pedido.totalItens - pedido.itensPendentes,
      temPdfPedido: pedido.temPdfPedido,
    };
  }

  static detalhe(pedido: ManutencaoPayload): ManutencaoDetalhe {
    return {
      ...this.resumo({
        id: pedido.id,
        numeroRequisicao: pedido.numeroRequisicao,
        dataEnvio: pedido.dataEnvio,
        dataRetorno: pedido.dataRetorno,
        status: pedido.status,
        totalItens: pedido.itens.length,
        itensPendentes: pedido.itens.filter((item) => !item.dataRetorno).length,
        temPdfPedido: pedido.documentos.some((doc) => doc.itemId === null),
      }),
      justificativa: pedido.justificativa,
      comissao: pedido.comissao,
      criadoPor: pedido.createdBy,
      criadoEm: pedido.createdAt.toISOString(),
      itens: pedido.itens.map((item) => this.item(pedido.id, item)),
      documentos: pedido.documentos
        .filter((doc) => doc.itemId === null)
        .map((doc) => this.documento(pedido.id, doc)),
    };
  }
}
