import { Injectable } from "@nestjs/common";
import {
  DominiosBuscaGlobal,
  type BuscaGlobal,
  type DominioBuscaGlobal,
  type GrupoBuscaGlobal,
} from "@repo/contracts";
import { BuscaRepository } from "./busca.repository";

const configuracao: Record<
  DominioBuscaGlobal,
  { rotulo: string; lista: string | null }
> = {
  PATRIMONIOS: { rotulo: "Patrimônios", lista: "/patrimonios" },
  REAVALIACOES: { rotulo: "Reavaliações", lista: "/reavaliacoes" },
  DEPRECIACOES: { rotulo: "Depreciações", lista: null },
  MOVIMENTACOES: { rotulo: "Movimentações", lista: "/movimentacoes" },
  EMPRESTIMOS: { rotulo: "Empréstimos", lista: "/emprestimos" },
  BAIXAS: { rotulo: "Baixas", lista: null },
  INVENTARIOS: { rotulo: "Inventários", lista: "/inventarios" },
  MANUTENCOES: { rotulo: "Manutenções", lista: "/manutencoes" },
  PROCESSOS_COMPRA: {
    rotulo: "Processos de compra",
    lista: "/processos-compra",
  },
  FORNECEDORES: { rotulo: "Fornecedores", lista: "/fornecedores" },
  SETORES: { rotulo: "Setores", lista: "/setores" },
  RESPONSAVEIS: { rotulo: "Responsáveis", lista: "/responsaveis" },
  COMISSOES: { rotulo: "Comissões", lista: "/comissoes" },
  NATUREZAS: { rotulo: "Naturezas", lista: "/naturezas" },
  ESPECIES: { rotulo: "Espécies", lista: "/especies" },
};

@Injectable()
export class BuscaService {
  constructor(private readonly repository: BuscaRepository) {}

  async buscar(termo: string, limite: number): Promise<BuscaGlobal> {
    const linhas = await this.repository.buscar(termo, limite);
    const grupos = DominiosBuscaGlobal.map((dominio): GrupoBuscaGlobal => {
      const correspondencias = linhas.filter(
        (linha) => linha.dominio === dominio,
      );
      const total = Number(correspondencias[0]?.total ?? 0n);
      const lista = configuracao[dominio].lista;
      return {
        dominio,
        rotulo: configuracao[dominio].rotulo,
        total,
        truncado: total > limite,
        verTodosDestino:
          total > limite && lista
            ? `${lista}?${new URLSearchParams({ busca: termo }).toString()}`
            : null,
        itens: correspondencias.map(
          ({ id, identificador, titulo, complemento, destino }) => ({
            id,
            identificador,
            titulo,
            complemento,
            destino,
          }),
        ),
      };
    });
    return { termo, grupos };
  }
}
