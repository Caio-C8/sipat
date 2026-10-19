import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AlterarEspecieData,
  CriarEspecieData,
  IdentidadeAutenticada,
  ListarEspeciesQueryData,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { NaturezasService } from "../naturezas/naturezas.service";
import { EspeciePersistenceMapper } from "./mappers";
import { EspeciesRepository } from "./especies.repository";
import type { EspecieDetalhePayload, ListarEspeciesResultado } from "./types";

@Injectable()
export class EspeciesService {
  constructor(
    private readonly especies: EspeciesRepository,
    private readonly naturezas: NaturezasService,
  ) {}

  async criar(
    dados: CriarEspecieData,
    identidade: IdentidadeAutenticada,
  ): Promise<EspecieDetalhePayload> {
    const nomeNormalizado = this.normalizarNome(dados.nome);
    await Promise.all([
      this.verificarNomeDisponivel(nomeNormalizado),
      this.naturezas.consultar(dados.naturezaId),
    ]);

    try {
      return await this.especies.criar(
        EspeciePersistenceMapper.paraCriacao(
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
    query: ListarEspeciesQueryData,
  ): Promise<ListarEspeciesResultado> {
    const buscaNormalizada =
      query.busca === undefined ? undefined : this.normalizarNome(query.busca);
    const where = EspeciePersistenceMapper.paraFiltro(query, buscaNormalizada);
    const skip = (query.pagina - 1) * query.limite;
    const [items, total] = await Promise.all([
      this.especies.listar({ where, skip, take: query.limite }),
      this.especies.contar(where),
    ]);

    return {
      items,
      total,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async consultar(especieId: string): Promise<EspecieDetalhePayload> {
    const especie = await this.especies.buscarPorId(especieId);
    if (especie === null) throw this.especieNaoEncontrada();
    return especie;
  }

  async alterar(
    especieId: string,
    dados: AlterarEspecieData,
  ): Promise<EspecieDetalhePayload> {
    if ((await this.especies.buscarPorId(especieId)) === null) {
      throw this.especieNaoEncontrada();
    }

    const nomeNormalizado =
      dados.nome === undefined ? undefined : this.normalizarNome(dados.nome);
    const verificacoes: Promise<unknown>[] = [];
    if (nomeNormalizado !== undefined) {
      verificacoes.push(
        this.verificarNomeDisponivel(nomeNormalizado, especieId),
      );
    }
    if (dados.naturezaId !== undefined) {
      verificacoes.push(this.naturezas.consultar(dados.naturezaId));
    }
    await Promise.all(verificacoes);

    try {
      return await this.especies.alterar(
        especieId,
        EspeciePersistenceMapper.paraAtualizacao(dados, nomeNormalizado),
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
    especieIdAtual?: string,
  ): Promise<void> {
    const especieId =
      await this.especies.buscarIdPorNomeNormalizado(nomeNormalizado);
    if (especieId !== null && especieId !== especieIdAtual) {
      throw this.nomeDuplicado();
    }
  }

  private traduzirErroPersistencia(erro: unknown): never {
    if (this.ehErroPrisma(erro, "P2002")) throw this.nomeDuplicado();
    if (this.ehErroPrisma(erro, "P2025")) throw this.especieNaoEncontrada();
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
      codigo: "NOME_ESPECIE_JA_EXISTENTE",
      mensagem: "Já existe uma espécie com o nome informado.",
      erros: [
        {
          campo: "nome",
          codigo: "VALOR_JA_EXISTENTE",
          mensagem: "Já existe uma espécie com este nome.",
        },
      ],
    });
  }

  private especieNaoEncontrada(): NotFoundException {
    return new NotFoundException({
      codigo: "ESPECIE_NAO_ENCONTRADA",
      mensagem: "A espécie informada não foi encontrada.",
      erros: [],
    });
  }
}
