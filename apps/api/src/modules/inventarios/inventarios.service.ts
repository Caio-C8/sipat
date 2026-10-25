import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CriarInventarioBodyData,
  IdentidadeAutenticada,
  ListarInventariosQueryData,
  ListarItensInventarioQueryData,
  ListarSetoresInventarioQueryData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { ComissoesService } from "../comissoes/comissoes.service";
import { InventarioPersistenceMapper } from "./mappers";
import { InventariosRepository } from "./inventarios.repository";
import type {
  ComProgresso,
  InventarioDetalhePayload,
  InventarioResumoPayload,
  ItemInventarioPayload,
  ProgressoInventarioPayload,
  ProgressoSetorPayload,
  ResultadoPaginado,
  SetorInventarioResumoPayload,
} from "./types";

@Injectable()
export class InventariosService {
  constructor(
    private readonly inventarios: InventariosRepository,
    private readonly comissoes: ComissoesService,
  ) {}

  async criar(
    dados: CriarInventarioBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<
    ComProgresso<InventarioDetalhePayload, ProgressoInventarioPayload>
  > {
    const dataOperacao = new Date().toISOString().slice(0, 10);
    await this.comissoes.consultarVigente(dados.comissaoId, dataOperacao);

    for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
      try {
        return await this.inventarios.executarTransacao(async (repository) => {
          const comissao = await repository.bloquearComissao(dados.comissaoId);
          const data = new Date(`${dataOperacao}T00:00:00.000Z`);
          if (
            comissao === null ||
            comissao.dataVigenciaInicio > data ||
            comissao.dataVigenciaFim < data
          ) {
            throw new ConflictException({
              codigo: "COMISSAO_FORA_DA_VIGENCIA",
              mensagem: "A comissão não está vigente na data da operação.",
              erros: [],
            });
          }

          const setores = await repository.bloquearSetoresAtivos();
          if (setores.length === 0) {
            throw new ConflictException({
              codigo: "INVENTARIO_SEM_SETOR_ATIVO",
              mensagem:
                "Não é possível criar um inventário sem ao menos um setor ativo.",
              erros: [],
            });
          }

          const patrimonios = await repository.bloquearPatrimoniosAtivos();
          const setoresAtivos = new Set(setores.map(({ id }) => id));
          if (
            patrimonios.some(
              ({ setorAtualId }) => !setoresAtivos.has(setorAtualId),
            )
          ) {
            throw new ConflictException({
              codigo: "PATRIMONIO_ATIVO_EM_SETOR_INATIVO",
              mensagem:
                "Existe patrimônio ativo vinculado a um setor inativo; corrija o cadastro antes de iniciar o inventário.",
              erros: [],
            });
          }

          const inventario = await repository.criarInventario(
            InventarioPersistenceMapper.paraCriacao(dados, identidade.id),
          );
          const setoresCriados = await repository.criarSetores(
            inventario.id,
            setores,
          );
          await repository.criarItens(
            inventario.id,
            patrimonios,
            new Map(
              setoresCriados.map(({ setorId, id }) => [setorId, id] as const),
            ),
          );
          const progressos = await repository.obterProgressosInventarios([
            inventario.id,
          ]);
          return {
            ...inventario,
            progresso: this.exigirProgresso(
              progressos.get(inventario.id),
              inventario.id,
            ),
          };
        });
      } catch (erro: unknown) {
        if (this.ehErroPrisma(erro, "P2034") && tentativa < 3) continue;
        this.traduzirErroPersistencia(erro);
      }
    }
    throw this.conflitoConcorrente();
  }

  async listar(
    query: ListarInventariosQueryData,
  ): Promise<
    ResultadoPaginado<
      ComProgresso<InventarioResumoPayload, ProgressoInventarioPayload>
    >
  > {
    const where = InventarioPersistenceMapper.paraFiltroInventarios(query);
    const [items, total] = await Promise.all([
      this.inventarios.listarInventarios({
        where,
        skip: (query.pagina - 1) * query.limite,
        take: query.limite,
      }),
      this.inventarios.contarInventarios(where),
    ]);
    const progressos = await this.inventarios.obterProgressosInventarios(
      items.map(({ id }) => id),
    );
    return this.paginar(
      items.map((item) => ({
        ...item,
        progresso: this.exigirProgresso(progressos.get(item.id), item.id),
      })),
      total,
      query,
    );
  }

  async consultar(
    inventarioId: string,
  ): Promise<
    ComProgresso<InventarioDetalhePayload, ProgressoInventarioPayload>
  > {
    const inventario = await this.inventarios.buscarInventario(inventarioId);
    if (inventario === null) throw this.inventarioNaoEncontrado();
    const progressos = await this.inventarios.obterProgressosInventarios([
      inventarioId,
    ]);
    return {
      ...inventario,
      progresso: this.exigirProgresso(
        progressos.get(inventarioId),
        inventarioId,
      ),
    };
  }

  async listarSetores(
    inventarioId: string,
    query: ListarSetoresInventarioQueryData,
  ): Promise<
    ResultadoPaginado<
      ComProgresso<SetorInventarioResumoPayload, ProgressoSetorPayload>
    >
  > {
    await this.exigirInventario(inventarioId);
    const where = InventarioPersistenceMapper.paraFiltroSetores(query);
    const [items, total] = await Promise.all([
      this.inventarios.listarSetores(inventarioId, {
        where,
        skip: (query.pagina - 1) * query.limite,
        take: query.limite,
      }),
      this.inventarios.contarSetores(inventarioId, where),
    ]);
    const progressos = await this.inventarios.obterProgressosSetores(
      items.map(({ id }) => id),
    );
    return this.paginar(
      items.map((item) => ({
        ...item,
        progresso: this.exigirProgresso(progressos.get(item.id), item.id),
      })),
      total,
      query,
    );
  }

  async listarItens(
    inventarioId: string,
    query: ListarItensInventarioQueryData,
  ): Promise<ResultadoPaginado<ItemInventarioPayload>> {
    await this.exigirInventario(inventarioId);
    const where = InventarioPersistenceMapper.paraFiltroItens(query);
    const [items, total] = await Promise.all([
      this.inventarios.listarItens(inventarioId, {
        where,
        skip: (query.pagina - 1) * query.limite,
        take: query.limite,
      }),
      this.inventarios.contarItens(inventarioId, where),
    ]);
    return this.paginar(items, total, query);
  }

  private async exigirInventario(inventarioId: string): Promise<void> {
    if ((await this.inventarios.buscarInventario(inventarioId)) === null) {
      throw this.inventarioNaoEncontrado();
    }
  }

  private paginar<T>(
    items: T[],
    total: number,
    query: { pagina: number; limite: number },
  ): ResultadoPaginado<T> {
    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  private exigirProgresso<T>(progresso: T | undefined, id: string): T {
    if (progresso === undefined) {
      throw new Error(`Agregados do inventário não encontrados para ${id}.`);
    }
    return progresso;
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (erro instanceof ConflictException) throw erro;
    if (this.ehErroPrisma(erro, "P2034") || this.ehErroPrisma(erro, "P2002")) {
      throw this.conflitoConcorrente();
    }
    throw erro;
  }

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private inventarioNaoEncontrado(): NotFoundException {
    return new NotFoundException({
      codigo: "INVENTARIO_NAO_ENCONTRADO",
      mensagem: "O inventário informado não foi encontrado.",
      erros: [],
    });
  }

  private conflitoConcorrente(): ConflictException {
    return new ConflictException({
      codigo: "CONFLITO_CONCORRENTE_INVENTARIO",
      mensagem:
        "O inventário não pôde ser persistido devido a uma alteração concorrente.",
      erros: [],
    });
  }
}
