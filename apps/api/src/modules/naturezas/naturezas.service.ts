import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AlterarNaturezaData,
  CriarNaturezaData,
  IdentidadeAutenticada,
  ListarNaturezasQueryData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { NaturezaPersistenceMapper } from "./mappers";
import { NaturezasRepository } from "./naturezas.repository";
import type { ListarNaturezasResultado, NaturezaDetalhePayload } from "./types";

@Injectable()
export class NaturezasService {
  constructor(private readonly naturezas: NaturezasRepository) {}

  async criar(
    dados: CriarNaturezaData,
    identidade: IdentidadeAutenticada,
  ): Promise<NaturezaDetalhePayload> {
    const nomeNormalizado = this.normalizarNome(dados.nome);
    await this.verificarNomeDisponivel(nomeNormalizado);

    try {
      return await this.naturezas.criar(
        NaturezaPersistenceMapper.paraCriacao(
          dados,
          nomeNormalizado,
          identidade.id,
        ),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  async listar(
    query: ListarNaturezasQueryData,
  ): Promise<ListarNaturezasResultado> {
    const buscaNormalizada =
      query.busca === undefined ? undefined : this.normalizarNome(query.busca);
    const where = NaturezaPersistenceMapper.paraFiltro(query, buscaNormalizada);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.naturezas.listar({ where, skip, take: query.limite }),
      this.naturezas.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(naturezaId: string): Promise<NaturezaDetalhePayload> {
    const natureza = await this.naturezas.buscarPorId(naturezaId);
    if (natureza === null) throw this.naturezaNaoEncontrada();
    return natureza;
  }

  async alterar(
    naturezaId: string,
    dados: AlterarNaturezaData,
  ): Promise<NaturezaDetalhePayload> {
    if ((await this.naturezas.buscarPorId(naturezaId)) === null) {
      throw this.naturezaNaoEncontrada();
    }

    const nomeNormalizado =
      dados.nome === undefined ? undefined : this.normalizarNome(dados.nome);
    if (nomeNormalizado !== undefined) {
      await this.verificarNomeDisponivel(nomeNormalizado, naturezaId);
    }

    try {
      return await this.naturezas.alterar(
        naturezaId,
        NaturezaPersistenceMapper.paraAtualizacao(dados, nomeNormalizado),
      );
    } catch (erro: unknown) {
      this.traduzirErroPersistencia(erro);
    }
  }

  private normalizarNome(nome: string): string {
    return nome.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
  }

  private async verificarNomeDisponivel(
    nomeNormalizado: string,
    naturezaIdAtual?: string,
  ): Promise<void> {
    const naturezaId =
      await this.naturezas.buscarIdPorNomeNormalizado(nomeNormalizado);
    if (naturezaId !== null && naturezaId !== naturezaIdAtual) {
      throw this.nomeDuplicado();
    }
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (this.ehErroPrisma(erro, "P2002")) throw this.nomeDuplicado();
    if (this.ehErroPrisma(erro, "P2025")) throw this.naturezaNaoEncontrada();
    throw erro;
  }

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private nomeDuplicado(): ConflictException {
    return new ConflictException({
      codigo: "NOME_NATUREZA_JA_EXISTENTE",
      mensagem: "Já existe uma natureza com o nome informado.",
      erros: [
        {
          campo: "nome",
          codigo: "VALOR_JA_EXISTENTE",
          mensagem: "Já existe uma natureza com este nome.",
        },
      ],
    });
  }

  private naturezaNaoEncontrada(): NotFoundException {
    return new NotFoundException({
      codigo: "NATUREZA_NAO_ENCONTRADA",
      mensagem: "A natureza informada não foi encontrada.",
      erros: [],
    });
  }
}
