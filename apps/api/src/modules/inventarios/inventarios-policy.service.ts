import type { Prisma } from "@repo/database";
import type { ItemMovimentacaoBodyData, ErroCampo } from "@repo/contracts";
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

  async coordenarMovimentacao(
    itens: ItemMovimentacaoBodyData[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await this.inventarios.bloquearInventariosMovimentacao(
      itens.map((item) => item.patrimonioId),
      [
        ...new Set(
          itens.flatMap((item) => [
            item.setorOrigemEsperadoId,
            item.setorDestinoId,
          ]),
        ),
      ],
      tx,
    );
  }
  async impedimentosMovimentacao(
    itens: ItemMovimentacaoBodyData[],
    tx: Prisma.TransactionClient,
  ): Promise<ErroCampo[]> {
    const setores = [
      ...new Set(
        itens.flatMap((item) => [
          item.setorOrigemEsperadoId,
          item.setorDestinoId,
        ]),
      ),
    ];
    const bloqueios = await this.inventarios.consultarBloqueiosMovimentacao(
      itens.map((item) => item.patrimonioId),
      setores,
      tx,
    );
    const fora = await this.inventarios.consultarDestinosForaInventario(
      itens,
      tx,
    );
    const erros: ErroCampo[] = [];
    itens.forEach((item, indice) => {
      for (const [campo, id] of [
        ["setorOrigemEsperadoId", item.setorOrigemEsperadoId],
        ["setorDestinoId", item.setorDestinoId],
      ]) {
        for (const bloqueio of bloqueios.filter((b) => b.setorId === id))
          erros.push({
            campo: `itens.${indice}.${campo}`,
            codigo: `SETOR_EM_INVENTARIO_${bloqueio.status}`,
            mensagem:
              "O setor possui conferência pendente ou em andamento em inventário aberto.",
          });
      }
      if (fora.some((linha) => linha.patrimonioId === item.patrimonioId))
        erros.push({
          campo: `itens.${indice}.setorDestinoId`,
          codigo: "DESTINO_FORA_INVENTARIO_ABERTO",
          mensagem:
            "O patrimônio não pode sair dos setores de seu inventário aberto.",
        });
    });
    return erros;
  }
}
