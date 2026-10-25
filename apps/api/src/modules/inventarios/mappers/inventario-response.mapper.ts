import type {
  InventarioDetalhe,
  InventarioResumo,
  ItemInventarioResponse,
  SetorInventarioResumo,
} from "@repo/contracts";
import type {
  ComProgresso,
  InventarioDetalhePayload,
  InventarioResumoPayload,
  ItemInventarioPayload,
  ProgressoInventarioPayload,
  ProgressoSetorPayload,
  SetorInventarioResumoPayload,
} from "../types";

export class InventarioResponseMapper {
  static paraResumo(
    inventario: ComProgresso<
      InventarioResumoPayload,
      ProgressoInventarioPayload
    >,
  ): InventarioResumo {
    return {
      id: inventario.id,
      nome: inventario.nome,
      status: inventario.status,
      dataInicio: inventario.dataInicio?.toISOString().slice(0, 10) ?? null,
      dataFim: inventario.dataFim?.toISOString().slice(0, 10) ?? null,
      iniciadoPorId: inventario.iniciadoPorId,
      finalizadoPorId: inventario.finalizadoPorId,
      comissao: inventario.comissao,
      progresso: inventario.progresso,
      createdAt: inventario.createdAt.toISOString(),
      updatedAt: inventario.updatedAt?.toISOString() ?? null,
    };
  }

  static paraDetalhe(
    inventario: ComProgresso<
      InventarioDetalhePayload,
      ProgressoInventarioPayload
    >,
  ): InventarioDetalhe {
    return {
      ...this.paraResumo(inventario),
      descricao: inventario.descricao,
      observacao: inventario.observacao,
      createdById: inventario.createdById,
    };
  }

  static paraSetor(
    setor: ComProgresso<SetorInventarioResumoPayload, ProgressoSetorPayload>,
  ): SetorInventarioResumo {
    return {
      id: setor.id,
      status: setor.status,
      setor: setor.setor,
      dataInicio: setor.dataInicio?.toISOString() ?? null,
      dataFim: setor.dataFim?.toISOString() ?? null,
      iniciadoPorId: setor.iniciadoPorId,
      concluidoPorId: setor.concluidoPorId,
      progresso: setor.progresso,
    };
  }

  static paraItem(item: ItemInventarioPayload): ItemInventarioResponse {
    return {
      id: item.id,
      patrimonio: item.patrimonio,
      setorEsperado: item.setorEsperado,
      observacao: item.observacao,
      statusVerificacao: item.statusVerificacao,
      situacao: item.situacao,
      setorEncontrado: item.setorEncontrado,
      dataVerificacao: item.dataVerificacao?.toISOString() ?? null,
      verificadoPorId: item.verificadoPorId,
      statusPatrimonioNaVerificacao: item.statusPatrimonioNaVerificacao,
      ausenciaJustificada:
        item.emprestimoPatrimonioId !== null
          ? {
              tipo: "EMPRESTIMO",
              emprestimoPatrimonioId: item.emprestimoPatrimonioId,
            }
          : item.itemManutencaoId !== null
            ? {
                tipo: "MANUTENCAO",
                itemManutencaoId: item.itemManutencaoId,
              }
            : null,
      statusCorrecao: item.statusCorrecao,
      tipoCorrecao: item.tipoCorrecao,
      dataCorrecao: item.dataCorrecao?.toISOString() ?? null,
      corrigidoPorId: item.corrigidoPorId,
      transferenciaCorrecaoId: item.transferenciaCorrecaoId,
    } as ItemInventarioResponse;
  }
}
