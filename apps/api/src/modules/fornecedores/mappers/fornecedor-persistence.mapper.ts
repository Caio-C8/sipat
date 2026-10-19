import type {
  AlterarFornecedorData,
  CriarFornecedorData,
  ListarFornecedoresQueryData,
} from "@repo/contracts";
import type { Prisma } from "@repo/database";

export class FornecedorPersistenceMapper {
  static paraCriacao(
    fornecedor: CriarFornecedorData,
    createdById: string,
  ): Prisma.FornecedorCreateInput {
    return {
      razaoSocial: fornecedor.razaoSocial,
      nomeFantasia: fornecedor.nomeFantasia,
      nomeRepresentante: fornecedor.nomeRepresentante,
      cnpj: fornecedor.cnpj,
      email: fornecedor.email,
      telefone: fornecedor.telefone,
      endereco: fornecedor.endereco,
      ativo: true,
      createdBy: { connect: { id: createdById } },
    };
  }

  static paraAtualizacao(
    fornecedor: AlterarFornecedorData,
  ): Prisma.FornecedorUpdateInput {
    return {
      ...(fornecedor.razaoSocial === undefined
        ? {}
        : { razaoSocial: fornecedor.razaoSocial }),
      ...(fornecedor.nomeFantasia === undefined
        ? {}
        : { nomeFantasia: fornecedor.nomeFantasia }),
      ...(fornecedor.nomeRepresentante === undefined
        ? {}
        : { nomeRepresentante: fornecedor.nomeRepresentante }),
      ...(fornecedor.cnpj === undefined ? {} : { cnpj: fornecedor.cnpj }),
      ...(fornecedor.email === undefined ? {} : { email: fornecedor.email }),
      ...(fornecedor.telefone === undefined
        ? {}
        : { telefone: fornecedor.telefone }),
      ...(fornecedor.endereco === undefined
        ? {}
        : { endereco: fornecedor.endereco }),
      updatedAt: new Date(),
    };
  }

  static paraFiltro(
    query: ListarFornecedoresQueryData,
  ): Prisma.FornecedorWhereInput {
    return {
      ...(query.ativo === undefined ? {} : { ativo: query.ativo }),
      ...(query.busca === undefined
        ? {}
        : {
            OR: [
              {
                razaoSocial: {
                  contains: query.busca,
                  mode: "insensitive" as const,
                },
              },
              {
                nomeFantasia: {
                  contains: query.busca,
                  mode: "insensitive" as const,
                },
              },
              {
                nomeRepresentante: {
                  contains: query.busca,
                  mode: "insensitive" as const,
                },
              },
              {
                cnpj: {
                  contains: query.busca.replace(/[./-]/g, "").toUpperCase(),
                  mode: "insensitive" as const,
                },
              },
              {
                email: {
                  contains: query.busca,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
    };
  }
}
