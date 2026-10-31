import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CriarMovimentacaoBodyData,
  ErroCampo,
  IdentidadeAutenticada,
  ListarMovimentacoesQueryData,
  ListarOpcoesMovimentacaoQueryData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import {
  calcularHashIdempotencia,
  construirConflitoIdempotencia,
} from "../../common/utils/idempotencia";
import { PatrimoniosService } from "../patrimonios/patrimonios.service";
import { SetoresService } from "../setores/setores.service";
import { ComissoesService } from "../comissoes/comissoes.service";
import { InventariosPolicyService } from "../inventarios/inventarios-policy.service";
import { MovimentacoesRepository } from "./movimentacoes.repository";
import { MovimentacaoPersistenceMapper } from "./mappers/movimentacao-persistence.mapper";
import { diaSaoPaulo } from "./datas-movimentacao";
import type { MovimentacaoPayload } from "./types";
@Injectable()
export class MovimentacoesService {
  constructor(
    private readonly movimentacoes: MovimentacoesRepository,
    private readonly patrimonios: PatrimoniosService,
    private readonly setores: SetoresService,
    private readonly comissoes: ComissoesService,
    private readonly inventarios: InventariosPolicyService,
  ) {}
  async listar(query: ListarMovimentacoesQueryData) {
    const where = MovimentacaoPersistenceMapper.paraFiltro(query);
    const [items, total] = await Promise.all([
      this.movimentacoes.listar(
        where,
        (query.pagina - 1) * query.limite,
        query.limite,
      ),
      this.movimentacoes.contar(where),
    ]);
    return this.pagina(items, total, query);
  }
  async consultar(id: string) {
    const item = await this.movimentacoes.consultar(id);
    if (!item)
      throw new NotFoundException({
        codigo: "MOVIMENTACAO_NAO_ENCONTRADA",
        mensagem: "Movimentação não encontrada.",
        erros: [],
      });
    return item;
  }
  async listarSetores(
    query: ListarOpcoesMovimentacaoQueryData,
    identidade: IdentidadeAutenticada,
  ) {
    this.autorizarContexto(query, identidade);
    const { items, total } = await this.setores.listarOpcoesMovimentacao(
      query.busca,
      query.contexto === "REGISTRO",
      (query.pagina - 1) * query.limite,
      query.limite,
    );
    return this.pagina(items, total, query);
  }
  async listarComissoes(
    query: ListarOpcoesMovimentacaoQueryData,
    identidade: IdentidadeAutenticada,
  ) {
    this.autorizarContexto(query, identidade);
    const dia =
      query.contexto === "REGISTRO"
        ? new Date(`${diaSaoPaulo(new Date())}T00:00:00.000Z`)
        : undefined;
    const { items, total } = await this.comissoes.listarOpcoesMovimentacao(
      query.busca,
      dia,
      (query.pagina - 1) * query.limite,
      query.limite,
    );
    return this.pagina(items, total, query);
  }
  async criar(
    dados: CriarMovimentacaoBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<MovimentacaoPayload[]> {
    if (identidade.perfil !== "DIRETOR_PATRIMONIO")
      throw new ForbiddenException();
    const hash = calcularHashIdempotencia({
      comissaoId: dados.comissaoId,
      observacao: dados.observacao,
      itens: dados.itens.map((item) => ({
        patrimonioId: item.patrimonioId,
        setorOrigemEsperadoId: item.setorOrigemEsperadoId,
        setorDestinoId: item.setorDestinoId,
      })),
    });
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        return await this.movimentacoes.executarTransacao(
          async (repository, tx) => {
            if (
              !(await repository.tentarBloquearChave(
                identidade.id,
                dados.chaveIdempotencia,
              ))
            )
              throw this.conflitoIdempotencia("OPERACAO_EM_PROCESSAMENTO");
            const anterior = await repository.buscarIdempotencia(
              identidade.id,
              dados.chaveIdempotencia,
            );
            if (anterior) return this.recuperar(anterior, hash);
            const comissao = await this.comissoes.bloquearParaMovimentacao(
              dados.comissaoId,
              tx,
            );
            await this.inventarios.coordenarMovimentacao(dados.itens, tx);
            const destinos = await this.setores.bloquearParaMovimentacao(
              [
                ...new Set(dados.itens.map((item) => item.setorDestinoId)),
              ].sort(),
              tx,
            );
            const bens = await this.patrimonios.bloquearParaMovimentacao(
              dados.itens.map((item) => item.patrimonioId).sort(),
              tx,
            );
            const instante = new Date();
            const dia = new Date(`${diaSaoPaulo(instante)}T00:00:00.000Z`);
            const erros: ErroCampo[] = [];
            const erro = (campo: string, codigo: string, mensagem: string) =>
              erros.push({ campo, codigo, mensagem });
            if (!comissao)
              erro(
                "comissaoId",
                "COMISSAO_NAO_ENCONTRADA",
                "Comissão não encontrada.",
              );
            else if (
              comissao.dataVigenciaInicio > dia ||
              comissao.dataVigenciaFim < dia
            )
              erro(
                "comissaoId",
                "COMISSAO_FORA_DA_VIGENCIA",
                "A comissão não está vigente no dia da confirmação em São Paulo.",
              );
            dados.itens.forEach((item, indice) => {
              const bem = bens.find((b) => b.id === item.patrimonioId);
              const destino = destinos.find(
                (s) => s.id === item.setorDestinoId,
              );
              if (!bem)
                erro(
                  `itens.${indice}.patrimonioId`,
                  "PATRIMONIO_NAO_ENCONTRADO",
                  "Patrimônio não encontrado.",
                );
              else {
                if (bem.status !== "ATIVO")
                  erro(
                    `itens.${indice}.patrimonioId`,
                    "PATRIMONIO_NAO_ATIVO",
                    "Somente patrimônios ativos podem ser transferidos.",
                  );
                if (bem.setorAtualId !== item.setorOrigemEsperadoId)
                  erro(
                    `itens.${indice}.setorOrigemEsperadoId`,
                    "ORIGEM_ALTERADA",
                    "O setor mudou. Atualize o patrimônio e confira novamente.",
                  );
                if (bem.setorAtualId === item.setorDestinoId)
                  erro(
                    `itens.${indice}.setorDestinoId`,
                    "DESTINO_IGUAL_ORIGEM",
                    "O destino é igual à origem atual.",
                  );
              }
              if (!destino)
                erro(
                  `itens.${indice}.setorDestinoId`,
                  "DESTINO_NAO_ENCONTRADO",
                  "Destino não encontrado.",
                );
              else if (!destino.ativo)
                erro(
                  `itens.${indice}.setorDestinoId`,
                  "DESTINO_INATIVO",
                  "O destino está inativo.",
                );
            });
            erros.push(
              ...(await this.inventarios.impedimentosMovimentacao(
                dados.itens,
                tx,
              )),
            );
            if (erros.length)
              throw new ConflictException({
                codigo: "MOVIMENTACAO_IMPEDIDA",
                mensagem:
                  "Nenhuma transferência foi registrada. Revise os campos indicados.",
                erros,
              });
            const registros: MovimentacaoPayload[] = [];
            for (const item of dados.itens) {
              const bem = bens.find((b) => b.id === item.patrimonioId)!;
              await this.patrimonios.atualizarSetorMovimentacao(
                bem.id,
                item.setorDestinoId,
                instante,
                tx,
              );
              registros.push(
                await repository.criar({
                  patrimonioId: bem.id,
                  setorAntigoId: bem.setorAtualId,
                  setorAtualId: item.setorDestinoId,
                  comissaoId: dados.comissaoId,
                  observacao: dados.observacao,
                  dataTransferencia: instante,
                  createdAt: instante,
                  createdById: identidade.id,
                }),
              );
            }
            await repository.salvarIdempotencia({
              usuarioId: identidade.id,
              chave: dados.chaveIdempotencia,
              payloadHash: hash,
            });
            return registros;
          },
        );
      } catch (erro: unknown) {
        if (
          erro instanceof Prisma.PrismaClientKnownRequestError &&
          (["P2034", "P2002"].includes(erro.code) ||
            (erro.code === "P2010" &&
              ["40001", "40P01"].some(
                (codigo) =>
                  erro.meta?.code === codigo || erro.message.includes(codigo),
              )))
        ) {
          const anterior = await this.movimentacoes.buscarIdempotencia(
            identidade.id,
            dados.chaveIdempotencia,
          );
          if (anterior) return this.recuperar(anterior, hash);
          if (tentativa < 2) continue;
          throw this.conflito(
            "CONFLITO_CONCORRENTE_MOVIMENTACAO",
            "Houve uma alteração concorrente. Confira os dados e reenvie a mesma confirmação.",
          );
        }
        throw erro;
      }
    }
    throw this.conflito(
      "CONFLITO_CONCORRENTE_MOVIMENTACAO",
      "Não foi possível confirmar agora. Reenvie o mesmo pedido.",
    );
  }
  private recuperar(anterior: { payloadHash: string }, hash: string): never {
    if (anterior.payloadHash !== hash)
      throw this.conflitoIdempotencia("CHAVE_IDEMPOTENCIA_REUTILIZADA");
    throw this.conflitoIdempotencia("OPERACAO_JA_PROCESSADA");
  }
  private autorizarContexto(
    query: ListarOpcoesMovimentacaoQueryData,
    identidade: IdentidadeAutenticada,
  ) {
    if (
      query.contexto === "REGISTRO" &&
      identidade.perfil !== "DIRETOR_PATRIMONIO"
    )
      throw new ForbiddenException();
  }
  private conflito(codigo: string, mensagem: string) {
    return new ConflictException({
      codigo,
      mensagem,
      erros: [{ campo: "chaveIdempotencia", codigo, mensagem }],
    });
  }
  private conflitoIdempotencia(
    codigo:
      | "OPERACAO_JA_PROCESSADA"
      | "CHAVE_IDEMPOTENCIA_REUTILIZADA"
      | "OPERACAO_EM_PROCESSAMENTO",
  ) {
    return new ConflictException(construirConflitoIdempotencia(codigo));
  }
  private pagina<T>(
    items: T[],
    total: number,
    query: { pagina: number; limite: number },
  ) {
    return {
      items,
      total,
      pagina: query.pagina,
      limite: query.limite,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
    };
  }
}
