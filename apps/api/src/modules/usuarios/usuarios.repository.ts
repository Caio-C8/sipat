import { Inject, Injectable } from "@nestjs/common";
import type { DatabaseClient, Prisma } from "@repo/database";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import {
  usuarioDetalheArgs,
  type UsuarioDetalhePayload,
  usuarioRegraArgs,
  type UsuarioRegraPayload,
  usuarioResumoArgs,
  type UsuarioResumoPayload,
} from "./types";

type ClienteUsuarios = DatabaseClient | Prisma.TransactionClient;

type ListarUsuariosParametros = {
  where: Prisma.UsuarioWhereInput;
  skip: number;
  take: number;
};

@Injectable()
export class UsuariosRepository {
  constructor(
    @Inject(DATABASE_CLIENT)
    private readonly database: ClienteUsuarios,
  ) {}

  criar(data: Prisma.UsuarioCreateInput): Promise<UsuarioDetalhePayload> {
    return this.database.usuario.create({ data, ...usuarioDetalheArgs });
  }

  listar({
    where,
    skip,
    take,
  }: ListarUsuariosParametros): Promise<UsuarioResumoPayload[]> {
    return this.database.usuario.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...usuarioResumoArgs,
    });
  }

  contar(where: Prisma.UsuarioWhereInput): Promise<number> {
    return this.database.usuario.count({ where });
  }

  buscarPorId(usuarioId: string): Promise<UsuarioDetalhePayload | null> {
    return this.database.usuario.findUnique({
      where: { id: usuarioId },
      ...usuarioDetalheArgs,
    });
  }

  buscarParaRegra(usuarioId: string): Promise<UsuarioRegraPayload | null> {
    return this.database.usuario.findUnique({
      where: { id: usuarioId },
      ...usuarioRegraArgs,
    });
  }

  async buscarIdPorEmail(email: string): Promise<string | null> {
    const usuario = await this.database.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    return usuario?.id ?? null;
  }

  alterar(
    usuarioId: string,
    data: Prisma.UsuarioUpdateInput,
  ): Promise<UsuarioDetalhePayload> {
    return this.database.usuario.update({
      where: { id: usuarioId },
      data,
      ...usuarioDetalheArgs,
    });
  }

  contarAdministradoresAtivos(): Promise<number> {
    return this.database.usuario.count({
      where: { perfil: "ADMINISTRADOR", ativo: true },
    });
  }

  alterarSituacao(
    usuarioId: string,
    ativo: boolean,
  ): Promise<UsuarioDetalhePayload> {
    return this.database.usuario.update({
      where: { id: usuarioId },
      data: { ativo, updatedAt: new Date() },
      ...usuarioDetalheArgs,
    });
  }

  async revogarSessoesAtivas(usuarioId: string): Promise<void> {
    await this.database.sessaoUsuario.updateMany({
      where: { usuarioId, revogadoAt: null },
      data: { revogadoAt: new Date() },
    });
  }

  executarTransacaoSerializavel<T>(
    operacao: (repository: UsuariosRepository) => Promise<T>,
  ): Promise<T> {
    if (!("$transaction" in this.database)) {
      throw new Error(
        "Uma transação não pode ser iniciada dentro de outra transação.",
      );
    }

    return this.database.$transaction(
      (transaction) => operacao(new UsuariosRepository(transaction)),
      { isolationLevel: "Serializable" },
    );
  }
}
