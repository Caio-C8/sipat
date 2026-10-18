import type { UsuarioDetalhe, UsuarioResumo } from "@repo/contracts";
import type { UsuarioDetalhePayload, UsuarioResumoPayload } from "../types";

export class UsuarioResponseMapper {
  static paraResumo(usuario: UsuarioResumoPayload): UsuarioResumo {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
      createdAt: usuario.createdAt.toISOString(),
      updatedAt: usuario.updatedAt?.toISOString() ?? null,
    };
  }

  static paraDetalhe(usuario: UsuarioDetalhePayload): UsuarioDetalhe {
    return {
      ...this.paraResumo(usuario),
      createdById: usuario.createdById,
    };
  }
}
