import type { SetorDetalhe, SetorResumo } from "@repo/contracts";
import type { SetorDetalhePayload, SetorResumoPayload } from "../types";

export class SetorResponseMapper {
  static paraResumo(setor: SetorResumoPayload): SetorResumo {
    return {
      id: setor.id,
      nome: setor.nome,
      sala: setor.sala,
      ramal: setor.ramal,
      ativo: setor.ativo,
      responsavel: {
        id: setor.responsavel.id,
        nome: setor.responsavel.nome,
        matricula: setor.responsavel.matricula,
        ativo: setor.responsavel.ativo,
      },
    };
  }

  static paraDetalhe(setor: SetorDetalhePayload): SetorDetalhe {
    return {
      ...this.paraResumo(setor),
      createdById: setor.createdById,
      createdAt: setor.createdAt.toISOString(),
      updatedAt: setor.updatedAt?.toISOString() ?? null,
    };
  }
}
