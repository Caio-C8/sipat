import type { Prisma } from "@repo/database";

export const usuarioResumoArgs = {
  select: {
    id: true,
    nome: true,
    email: true,
    perfil: true,
    ativo: true,
    createdAt: true,
    updatedAt: true,
  },
} satisfies Prisma.UsuarioDefaultArgs;

export const usuarioDetalheArgs = {
  select: {
    ...usuarioResumoArgs.select,
    createdById: true,
  },
} satisfies Prisma.UsuarioDefaultArgs;

export const usuarioRegraArgs = {
  select: {
    id: true,
    perfil: true,
    ativo: true,
  },
} satisfies Prisma.UsuarioDefaultArgs;

export type UsuarioResumoPayload = Prisma.UsuarioGetPayload<
  typeof usuarioResumoArgs
>;
export type UsuarioDetalhePayload = Prisma.UsuarioGetPayload<
  typeof usuarioDetalheArgs
>;
export type UsuarioRegraPayload = Prisma.UsuarioGetPayload<
  typeof usuarioRegraArgs
>;

export type ListarUsuariosResultado = {
  items: UsuarioResumoPayload[];
  total: number;
  pagina: number;
  ultimaPagina: number;
  limite: number;
};
