import type { FornecedorDetalhe, FornecedorResumo } from "@repo/contracts";
import type {
  FornecedorDetalhePayload,
  FornecedorResumoPayload,
} from "../types";

export class FornecedorResponseMapper {
  static paraResumo(fornecedor: FornecedorResumoPayload): FornecedorResumo {
    return {
      id: fornecedor.id,
      razaoSocial: fornecedor.razaoSocial,
      nomeFantasia: fornecedor.nomeFantasia,
      cnpj: fornecedor.cnpj,
      ativo: fornecedor.ativo,
    };
  }

  static paraDetalhe(fornecedor: FornecedorDetalhePayload): FornecedorDetalhe {
    return {
      ...this.paraResumo(fornecedor),
      nomeRepresentante: fornecedor.nomeRepresentante,
      email: fornecedor.email,
      telefone: fornecedor.telefone,
      endereco: fornecedor.endereco,
      createdById: fornecedor.createdById,
      createdAt: fornecedor.createdAt.toISOString(),
      updatedAt: fornecedor.updatedAt?.toISOString() ?? null,
    };
  }
}
