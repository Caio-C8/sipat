import type {
  AlterarUsuarioData,
  CriarUsuarioData,
  ListarUsuariosQueryData,
} from "@repo/contracts";
import type { Prisma } from "@repo/database";

export class UsuarioPersistenceMapper {
  static paraCriacao(
    usuario: Omit<CriarUsuarioData, "senha"> & { senhaHash: string },
    createdById: string,
  ): Prisma.UsuarioCreateInput {
    return {
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senhaHash,
      perfil: usuario.perfil,
      ativo: true,
      trocaSenhaObrigatoria: true,
      createdBy: { connect: { id: createdById } },
    };
  }

  static paraAtualizacao(
    usuario: AlterarUsuarioData,
  ): Prisma.UsuarioUpdateInput {
    return {
      ...(usuario.nome === undefined ? {} : { nome: usuario.nome }),
      ...(usuario.email === undefined ? {} : { email: usuario.email }),
      ...(usuario.perfil === undefined ? {} : { perfil: usuario.perfil }),
      updatedAt: new Date(),
    };
  }

  static paraFiltro(query: ListarUsuariosQueryData): Prisma.UsuarioWhereInput {
    return {
      ...(query.perfil === undefined ? {} : { perfil: query.perfil }),
      ...(query.ativo === undefined ? {} : { ativo: query.ativo }),
      ...(query.busca === undefined
        ? {}
        : {
            OR: [
              { nome: { contains: query.busca, mode: "insensitive" } },
              { email: { contains: query.busca, mode: "insensitive" } },
            ],
          }),
    };
  }
}
