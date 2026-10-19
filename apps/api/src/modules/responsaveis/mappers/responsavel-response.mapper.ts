import type { ResponsavelDetalhe, ResponsavelResumo } from "@repo/contracts";
import type {
  ResponsavelDetalhePayload,
  ResponsavelResumoPayload,
} from "../types";

export class ResponsavelResponseMapper {
  static paraResumo(responsavel: ResponsavelResumoPayload): ResponsavelResumo {
    return {
      id: responsavel.id,
      nome: responsavel.nome,
      matricula: responsavel.matricula,
      ativo: responsavel.ativo,
    };
  }

  static paraDetalhe(
    responsavel: ResponsavelDetalhePayload,
  ): ResponsavelDetalhe {
    return {
      ...this.paraResumo(responsavel),
      createdById: responsavel.createdById,
      createdAt: responsavel.createdAt.toISOString(),
      updatedAt: responsavel.updatedAt?.toISOString() ?? null,
    };
  }
}
