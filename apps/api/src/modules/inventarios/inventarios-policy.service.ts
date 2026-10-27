import { ConflictException, Injectable } from "@nestjs/common";
import { InventariosRepository } from "./inventarios.repository";

@Injectable()
export class InventariosPolicyService {
  constructor(private readonly inventarios: InventariosRepository) {}

  async exigirSetorPodeSerInativado(setorId: string): Promise<void> {
    if ((await this.inventarios.existeSetorEmInventarioAberto(setorId)) > 0) {
      throw new ConflictException({
        codigo: "SETOR_PARTICIPANTE_INVENTARIO_ABERTO",
        mensagem:
          "O setor não pode ser inativado enquanto participar de um inventário não finalizado.",
        erros: [],
      });
    }
  }

  async exigirPatrimonioPodeSerBaixado(patrimonioId: string): Promise<void> {
    if (
      (await this.inventarios.existePatrimonioEmInventarioAberto(
        patrimonioId,
      )) > 0
    ) {
      throw new ConflictException({
        codigo: "PATRIMONIO_EM_INVENTARIO_ABERTO",
        mensagem:
          "O patrimônio não pode ser baixado enquanto participar de um inventário não finalizado.",
        erros: [],
      });
    }
  }
}
