import type { EspecieDetalhe, EspecieResumo } from "@repo/contracts";
import type { EspecieDetalhePayload, EspecieResumoPayload } from "../types";

export class EspecieResponseMapper {
  static paraResumo(especie: EspecieResumoPayload): EspecieResumo {
    return {
      id: especie.id,
      nome: especie.nome,
      natureza: especie.natureza,
    };
  }

  static paraDetalhe(especie: EspecieDetalhePayload): EspecieDetalhe {
    return {
      ...this.paraResumo(especie),
      descricao: especie.descricao,
      nomeNormalizado: especie.nomeNormalizado,
      createdById: especie.createdById,
      createdAt: especie.createdAt.toISOString(),
      updatedAt: especie.updatedAt?.toISOString() ?? null,
    };
  }
}
