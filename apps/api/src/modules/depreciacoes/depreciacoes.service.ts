import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  ExecutarDepreciacaoPatrimonioBodyData,
  ExecutarDepreciacoesEmMassaBodyData,
  IdentidadeAutenticada,
  ListarDepreciacoesPendentesQueryData,
  MotivoInelegibilidadeDepreciacao,
  ResultadoDepreciacaoIndividual,
  ResultadoDepreciacoesEmMassa,
  ListarCompetenciasDepreciacaoResponse,
  ResumoPendenciasDepreciacaoResponse,
} from "@repo/contracts";
import { Prisma } from "@repo/database";
import { diaSaoPaulo } from "../../common/utils/datas-institucionais";
import { ComissoesService } from "../comissoes/comissoes.service";
import {
  calcularDepreciacao,
  EstadoContabilDepreciacaoInconsistenteError,
} from "./depreciacao-calculo";
import { DepreciacoesRepository } from "./depreciacoes.repository";
import { DepreciacaoResponseMapper } from "./mappers";
import type {
  ComissaoBloqueadaDepreciacao,
  DepreciacaoCalculadaComLinha,
  LinhaDepreciacao,
  ResultadoPaginaPendentes,
} from "./types";

type ContagensInelegiveis =
  ResultadoDepreciacoesEmMassa["quantidadesInelegiveis"];

@Injectable()
export class DepreciacoesService {
  constructor(
    private readonly depreciacoes: DepreciacoesRepository,
    private readonly comissoes: ComissoesService,
  ) {}

  async listarPendentes(
    query: ListarDepreciacoesPendentesQueryData,
  ): Promise<ResultadoPaginaPendentes> {
    const competencia = this.validarCompetenciaSelecionavel(query.competencia);
    const [linhas, resumo] = await Promise.all([
      this.depreciacoes.listarPendentes(
        competencia,
        (query.pagina - 1) * query.limite,
        query.limite,
      ),
      this.depreciacoes.obterResumoPendentes(competencia),
    ]);
    const total = resumo.totalPendentes;
    return {
      items: linhas.map((linha) => this.calcularOuFalhar(linha)),
      total,
      totalNoValorResidual: resumo.totalNoValorResidual,
      pagina: query.pagina,
      ultimaPagina: Math.max(1, Math.ceil(total / query.limite)),
      limite: query.limite,
    };
  }

  async listarCompetencias(): Promise<
    ListarCompetenciasDepreciacaoResponse["dados"]
  > {
    const atualTexto = this.competenciaAtual(new Date());
    const atual = this.paraCompetencia(atualTexto);
    const linhas = await this.depreciacoes.listarCompetencias(atual);
    return {
      competenciaAtual: atualTexto,
      competenciaMaisAntigaPendente: linhas[0]
        ? this.competenciaTexto(linhas[0].competencia)
        : null,
      competencias: linhas.map((linha) => ({
        competencia: this.competenciaTexto(linha.competencia),
        quantidadePendente: Number(linha.quantidadePendente),
        quantidadeBloqueadaPorAnterior: Number(
          linha.quantidadeBloqueadaPorAnterior,
        ),
      })),
    };
  }

  async resumoPendencias(): Promise<
    ResumoPendenciasDepreciacaoResponse["dados"]
  > {
    const resumo = await this.depreciacoes.resumoPendencias(
      this.paraCompetencia(this.competenciaAtual(new Date())),
    );
    return {
      totalPendencias: Number(resumo.totalPendencias),
      totalPatrimonios: Number(resumo.totalPatrimonios),
      competenciaMaisAntiga:
        resumo.competenciaMaisAntiga === null
          ? null
          : this.competenciaTexto(resumo.competenciaMaisAntiga),
    };
  }

  async executarIndividual(
    patrimonioId: string,
    dados: ExecutarDepreciacaoPatrimonioBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<ResultadoDepreciacaoIndividual> {
    await this.validarComissaoPublicamente(dados);
    try {
      return await this.depreciacoes.executarTransacao(async (repository) => {
        const contexto = await this.prepararTransacao(repository, dados);
        const linhas = await repository.bloquearAcervo(
          contexto.competencia,
          patrimonioId,
        );
        const linha = linhas[0];
        if (linha === undefined) {
          throw new NotFoundException({
            codigo: "PATRIMONIO_NAO_ENCONTRADO",
            mensagem: "O patrimônio informado não foi encontrado.",
            erros: [],
          });
        }
        const motivo = this.classificar(linha, contexto.competencia);
        if (motivo !== null) {
          if (
            motivo === "VALOR_RESIDUAL_ATINGIDO" &&
            !dados.confirmarIgnorarValorResidual
          ) {
            throw this.confirmacaoResidualNecessaria(1);
          }
          return { resultado: "INELEGIVEL", motivo };
        }
        const calculo = this.calcularOuFalhar(linha);
        const [persistida] = await repository.persistirEmLote({
          calculos: [calculo],
          competencia: contexto.competencia,
          instante: contexto.instante,
          comissaoId: contexto.comissao.id,
          usuarioId: identidade.id,
        });
        if (persistida === undefined)
          throw new Error("Depreciação não persistida.");
        return DepreciacaoResponseMapper.paraRealizada(
          persistida,
          dados.competencia,
        );
      });
    } catch (erro: unknown) {
      this.traduzirErro(erro);
    }
  }

  async executarEmMassa(
    dados: ExecutarDepreciacoesEmMassaBodyData,
    identidade: IdentidadeAutenticada,
  ): Promise<ResultadoDepreciacoesEmMassa> {
    await this.validarComissaoPublicamente(dados);
    try {
      return await this.depreciacoes.executarTransacao(async (repository) => {
        const contexto = await this.prepararTransacao(repository, dados);
        const linhas = await repository.bloquearAcervo(contexto.competencia);
        const contagens = this.contagensVazias();
        const calculos: DepreciacaoCalculadaComLinha[] = [];
        for (const linha of linhas) {
          const motivo = this.classificar(linha, contexto.competencia);
          if (motivo === null) calculos.push(this.calcularOuFalhar(linha));
          else this.contarMotivo(contagens, motivo);
        }
        if (
          contagens.valorResidualAtingido > 0 &&
          !dados.confirmarIgnorarValorResidual
        ) {
          throw this.confirmacaoResidualNecessaria(
            contagens.valorResidualAtingido,
          );
        }
        await repository.persistirEmLote({
          calculos,
          competencia: contexto.competencia,
          instante: contexto.instante,
          comissaoId: contexto.comissao.id,
          usuarioId: identidade.id,
        });
        return {
          competencia: dados.competencia,
          comissao: { id: contexto.comissao.id, nome: contexto.comissao.nome },
          dataDepreciacao: contexto.instante.toISOString(),
          quantidadeProcessada: calculos.length,
          quantidadeAtingiuValorResidual: calculos.filter(
            (item) => item.atingiraValorResidual,
          ).length,
          quantidadesInelegiveis: contagens,
        };
      });
    } catch (erro: unknown) {
      this.traduzirErro(erro);
    }
  }

  private async prepararTransacao(
    repository: DepreciacoesRepository,
    dados: { competencia: string; comissaoId: string },
  ): Promise<{
    competencia: Date;
    instante: Date;
    comissao: ComissaoBloqueadaDepreciacao;
  }> {
    const instante = new Date();
    const competencia = this.validarCompetenciaSelecionavel(
      dados.competencia,
      instante,
    );
    const comissao = await repository.bloquearComissao(dados.comissaoId);
    this.comissoes.validarVigenciaBloqueada(
      comissao,
      this.dataCivilAtual(instante),
      "COMISSAO_INVALIDA",
    );
    return { competencia, instante, comissao: comissao! };
  }

  private async validarComissaoPublicamente(dados: {
    competencia: string;
    comissaoId: string;
  }): Promise<void> {
    const agora = new Date();
    this.validarCompetenciaSelecionavel(dados.competencia, agora);
    try {
      await this.comissoes.consultarVigente(
        dados.comissaoId,
        this.dataCivilTexto(agora),
      );
    } catch (erro: unknown) {
      if (
        erro instanceof ConflictException ||
        erro instanceof NotFoundException
      ) {
        throw new ConflictException({
          codigo: "COMISSAO_INVALIDA",
          mensagem: "A comissão deve existir e estar vigente no processamento.",
          erros: [],
        });
      }
      throw erro;
    }
  }

  private classificar(
    linha: LinhaDepreciacao,
    competencia: Date,
  ): MotivoInelegibilidadeDepreciacao | null {
    if (linha.situacaoContabilId === null) this.falharEstadoContabil();
    if (linha.quantidadeParametrosVigentes > 1n) this.falharEstadoContabil();
    if (linha.status === "BAIXADO") return "BAIXADO";
    if (!linha.depreciavel) return "NAO_DEPRECIAVEL";
    if (linha.disponibilidadeId === null) return "INDISPONIVEL_PARA_USO";
    if (linha.parametroDepreciacaoId === null) return "SEM_PARAMETRO_VIGENTE";
    if (linha.dataInicio === null || linha.dataInicio >= competencia) {
      return "DATA_INICIO_NAO_ATINGIDA";
    }
    if (linha.jaDepreciadoNaCompetencia) {
      return "JA_DEPRECIADO_NA_COMPETENCIA";
    }
    if (
      linha.competenciaEsperada !== null &&
      linha.competenciaEsperada < competencia
    ) {
      return "COMPETENCIA_ANTERIOR_PENDENTE";
    }
    if (
      linha.competenciaEsperada !== null &&
      linha.competenciaEsperada > competencia
    ) {
      return "JA_DEPRECIADO_NA_COMPETENCIA";
    }
    const calculo = this.calcularOuFalhar(linha);
    if (calculo.valorContabilAnterior.equals(linha.valorResidual!)) {
      return "VALOR_RESIDUAL_ATINGIDO";
    }
    return null;
  }

  private calcularOuFalhar(
    linha: LinhaDepreciacao,
  ): DepreciacaoCalculadaComLinha {
    try {
      return calcularDepreciacao(linha);
    } catch (erro) {
      if (erro instanceof EstadoContabilDepreciacaoInconsistenteError) {
        this.falharEstadoContabil();
      }
      throw erro;
    }
  }

  private validarCompetenciaSelecionavel(
    competencia: string,
    agora = new Date(),
  ): Date {
    if (competencia > this.competenciaAtual(agora)) {
      throw new ConflictException({
        codigo: "COMPETENCIA_FORA_INTERVALO",
        mensagem: "A competência não pode ser futura.",
        erros: [],
      });
    }
    return this.paraCompetencia(competencia);
  }

  private competenciaAtual(data: Date): string {
    return diaSaoPaulo(data).slice(0, 7);
  }

  private dataCivilTexto(data: Date): string {
    return diaSaoPaulo(data);
  }

  private dataCivilAtual(data: Date): Date {
    return new Date(`${diaSaoPaulo(data)}T00:00:00.000Z`);
  }

  private contagensVazias(): ContagensInelegiveis {
    return {
      baixado: 0,
      semParametroVigente: 0,
      dataInicioNaoAtingida: 0,
      jaDepreciadoNaCompetencia: 0,
      valorResidualAtingido: 0,
      naoDepreciavel: 0,
      indisponivelParaUso: 0,
      competenciaAnteriorPendente: 0,
    };
  }

  private contarMotivo(
    contagens: ContagensInelegiveis,
    motivo: MotivoInelegibilidadeDepreciacao,
  ): void {
    const chaves: Record<
      MotivoInelegibilidadeDepreciacao,
      keyof ContagensInelegiveis
    > = {
      BAIXADO: "baixado",
      SEM_PARAMETRO_VIGENTE: "semParametroVigente",
      DATA_INICIO_NAO_ATINGIDA: "dataInicioNaoAtingida",
      JA_DEPRECIADO_NA_COMPETENCIA: "jaDepreciadoNaCompetencia",
      VALOR_RESIDUAL_ATINGIDO: "valorResidualAtingido",
      NAO_DEPRECIAVEL: "naoDepreciavel",
      INDISPONIVEL_PARA_USO: "indisponivelParaUso",
      COMPETENCIA_ANTERIOR_PENDENTE: "competenciaAnteriorPendente",
    };
    contagens[chaves[motivo]] += 1;
  }

  private confirmacaoResidualNecessaria(quantidade: number): ConflictException {
    return new ConflictException({
      codigo: "CONFIRMACAO_VALOR_RESIDUAL_NECESSARIA",
      mensagem: `${quantidade} patrimônio(s) já está(ão) no valor residual; confirme para ignorá-lo(s).`,
      erros: [],
    });
  }

  private falharEstadoContabil(): never {
    throw new ConflictException({
      codigo: "ESTADO_CONTABIL_INCONSISTENTE",
      mensagem: "O estado contábil de um patrimônio está inconsistente.",
      erros: [],
    });
  }

  private traduzirErro(erro: unknown): never {
    if (
      erro instanceof ConflictException ||
      erro instanceof NotFoundException
    ) {
      throw erro;
    }
    if (this.ehErroPrisma(erro, "P2002") || this.ehErroPrisma(erro, "P2034")) {
      throw new ConflictException({
        codigo: "CONFLITO_CONCORRENTE",
        mensagem:
          "A depreciação concorreu com outra alteração; tente novamente.",
        erros: [],
      });
    }
    throw erro;
  }

  private ehErroPrisma(erro: unknown, codigo: string): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === codigo
    );
  }

  private paraCompetencia(competencia: string): Date {
    const [ano, mes] = competencia.split("-").map(Number);
    return new Date(Date.UTC(ano!, mes! - 1, 1));
  }

  private competenciaTexto(data: Date): string {
    return data.toISOString().slice(0, 7);
  }
}
