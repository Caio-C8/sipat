import type {
  ComissaoDetalhe,
  ComissaoResumo,
  MembroComissaoResponse,
} from "@repo/contracts";
import type {
  ComissaoDetalhePayload,
  ComissaoResumoPayload,
  MembroComissaoPayload,
} from "../types";

export class ComissaoResponseMapper {
  static paraResumo(comissao: ComissaoResumoPayload): ComissaoResumo {
    return {
      id: comissao.id,
      nome: comissao.nome,
      numeroAto: comissao.numeroAto,
      dataVigenciaInicio: this.paraDataCivil(comissao.dataVigenciaInicio),
      dataVigenciaFim: this.paraDataCivil(comissao.dataVigenciaFim),
    };
  }

  static paraDetalhe(comissao: ComissaoDetalhePayload): ComissaoDetalhe {
    return {
      ...this.paraResumo(comissao),
      descricao: comissao.descricao,
      membros: comissao.membros.map((membro) => this.paraMembro(membro)),
      createdById: comissao.createdById,
      createdAt: comissao.createdAt.toISOString(),
      updatedAt: comissao.updatedAt?.toISOString() ?? null,
    };
  }

  static paraMembro(membro: MembroComissaoPayload): MembroComissaoResponse {
    return {
      id: membro.id,
      papel: membro.tipoMembroComissao,
      responsavel: membro.responsavel,
      createdAt: membro.createdAt.toISOString(),
      updatedAt: membro.updatedAt?.toISOString() ?? null,
    };
  }

  private static paraDataCivil(data: Date): string {
    return data.toISOString().slice(0, 10);
  }
}
