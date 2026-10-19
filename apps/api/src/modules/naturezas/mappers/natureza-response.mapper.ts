import type { NaturezaDetalhe, NaturezaResumo } from "@repo/contracts";
import type { NaturezaDetalhePayload, NaturezaResumoPayload } from "../types";

export class NaturezaResponseMapper {
  static paraResumo(natureza: NaturezaResumoPayload): NaturezaResumo {
    return {
      id: natureza.id,
      nome: natureza.nome,
    };
  }

  static paraDetalhe(natureza: NaturezaDetalhePayload): NaturezaDetalhe {
    return {
      ...this.paraResumo(natureza),
      descricao: natureza.descricao,
      nomeNormalizado: natureza.nomeNormalizado,
      createdById: natureza.createdById,
      createdAt: natureza.createdAt.toISOString(),
      updatedAt: natureza.updatedAt?.toISOString() ?? null,
    };
  }
}
