import { Inject, Injectable } from "@nestjs/common";
import {
  ConcluirPrimeiroAcessoBodySchema,
  CriarComissaoBodySchema,
  CriarFornecedorSchema,
  CriarInventarioBodySchema,
  CriarManutencaoBodySchema,
  CriarNaturezaSchema,
  CriarPatrimonioBodySchema,
  CriarResponsavelSchema,
  CriarSetorSchema,
  CriarUsuarioSchema,
  CriarEspecieSchema,
  DadosDocumentoManutencaoSchema,
  FinalizarInventarioBodySchema,
  RegistrarRetornoManutencaoBodySchema,
  VerificarItemInventarioBodySchema,
  type IdentidadeAutenticada,
} from "@repo/contracts";
import type { DatabaseClient } from "@repo/database";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import { DATABASE_CLIENT } from "../../common/database/database.constants";
import { SenhaHasher } from "../../common/security/senha-hasher";
import {
  ARMAZENAMENTO_DOCUMENTOS,
  type ArmazenamentoDocumentosPorta,
} from "../../common/storage/armazenamento-documentos.port";
import type { EnvironmentVariables } from "../../environment";
import { AuthService } from "../../modules/auth/auth.service";
import { provisionarPrimeiroAdministrador } from "../../modules/auth/provisionamento-admin";
import { ComissoesService } from "../../modules/comissoes/comissoes.service";
import { EspeciesService } from "../../modules/especies/especies.service";
import { FornecedoresService } from "../../modules/fornecedores/fornecedores.service";
import { InventariosService } from "../../modules/inventarios/inventarios.service";
import { ManutencoesService } from "../../modules/manutencoes/manutencoes.service";
import { NaturezasService } from "../../modules/naturezas/naturezas.service";
import { PatrimoniosService } from "../../modules/patrimonios/patrimonios.service";
import { ProcessosCompraService } from "../../modules/processos-compra/processos-compra.service";
import { ResponsaveisService } from "../../modules/responsaveis/responsaveis.service";
import { SetoresService } from "../../modules/setores/setores.service";
import { UsuariosService } from "../../modules/usuarios/usuarios.service";
import type { ConfiguracaoSeedGeral } from "./seed-geral.config";
import {
  criarCnpjSintetico,
  dataCivilSaoPaulo,
  deslocarDataCivil,
  ITENS_DEMO,
  NATUREZAS_ESPECIES_DEMO,
  SETORES_DEMO,
} from "./seed-geral.matriz";
import {
  exigirBancoDominioVazio,
  exigirMigrationsAtuais,
  type EstadoMigrationSeed,
} from "./seed-geral.preflight";

@Injectable()
export class SeedGeralService {
  private readonly dataBase = dataCivilSaoPaulo();
  private diretor!: IdentidadeAutenticada;
  private administrador!: IdentidadeAutenticada;
  private temporarios: string[] = [];

  constructor(
    @Inject(DATABASE_CLIENT) private readonly db: DatabaseClient,
    @Inject(ARMAZENAMENTO_DOCUMENTOS)
    private readonly armazenamento: ArmazenamentoDocumentosPorta,
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly senhaHasher: SenhaHasher,
    private readonly auth: AuthService,
    private readonly usuarios: UsuariosService,
    private readonly responsaveis: ResponsaveisService,
    private readonly setores: SetoresService,
    private readonly naturezas: NaturezasService,
    private readonly especies: EspeciesService,
    private readonly fornecedores: FornecedoresService,
    private readonly comissoes: ComissoesService,
    private readonly processos: ProcessosCompraService,
    private readonly patrimonios: PatrimoniosService,
    private readonly inventarios: InventariosService,
    private readonly manutencoes: ManutencoesService,
  ) {}

  async executar(configuracao: ConfiguracaoSeedGeral): Promise<void> {
    await this.verificarPreCondicoes();
    try {
      await this.criarUsuarios(configuracao);
      const responsaveis = await this.criarResponsaveis();
      const setores = await this.criarSetores(responsaveis);
      const especies = await this.criarNaturezasEspecies();
      const fornecedores = await this.criarFornecedores();
      const comissoes = await this.criarComissoes(responsaveis);
      const processos = await this.criarProcessos(fornecedores);
      const patrimonios = await this.criarPatrimonios(
        setores,
        especies,
        processos,
      );
      await this.criarInventario(comissoes[2]!, setores);
      await this.criarManutencoes(comissoes[2]!, fornecedores, patrimonios);
      await this.auditarEstadoFinal();
    } finally {
      await Promise.all(
        this.temporarios.map((arquivo) => rm(arquivo, { force: true })),
      );
    }
  }

  private async verificarPreCondicoes(): Promise<void> {
    const migrations = await this.db.$queryRaw<
      EstadoMigrationSeed[]
    >`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at`;
    exigirMigrationsAtuais(migrations);
    const contagens = await Promise.all([
      this.db.usuario.count(),
      this.db.responsavel.count(),
      this.db.setor.count(),
      this.db.natureza.count(),
      this.db.especie.count(),
      this.db.fornecedor.count(),
      this.db.comissao.count(),
      this.db.processoCompra.count(),
      this.db.notaFiscal.count(),
      this.db.patrimonio.count(),
      this.db.inventario.count(),
      this.db.manutencao.count(),
      this.db.transferenciaPatrimonio.count(),
      this.db.baixaPatrimonio.count(),
      this.db.depreciacaoPatrimonio.count(),
      this.db.reavaliacaoPatrimonio.count(),
    ]);
    exigirBancoDominioVazio(contagens);
  }

  private async criarUsuarios(configuracao: ConfiguracaoSeedGeral) {
    const adminInicial = CriarUsuarioSchema.parse({
      nome: "Administrador da Demonstração",
      email: "admin.demo@example.test",
      senha: configuracao.senhaAdministrador,
      perfil: "ADMINISTRADOR",
    });
    await provisionarPrimeiroAdministrador(
      this.db,
      this.senhaHasher,
      adminInicial,
    );
    const admin = await this.db.usuario.findUniqueOrThrow({
      where: { email: adminInicial.email },
    });
    await this.auth.concluirPrimeiroAcesso(
      admin.id,
      ConcluirPrimeiroAcessoBodySchema.parse({
        novaSenha: configuracao.senhaAdministrador,
        confirmacaoNovaSenha: configuracao.senhaAdministrador,
      }),
    );
    this.administrador = this.identidade({
      ...admin,
      trocaSenhaObrigatoria: false,
    });

    const diretorDados = CriarUsuarioSchema.parse({
      nome: "Diretor de Patrimônio da Demonstração",
      email: "diretor.demo@example.test",
      senha: configuracao.senhaDiretor,
      perfil: "DIRETOR_PATRIMONIO",
    });
    const diretor = await this.usuarios.criar(diretorDados, this.administrador);
    await this.auth.concluirPrimeiroAcesso(
      diretor.id,
      ConcluirPrimeiroAcessoBodySchema.parse({
        novaSenha: configuracao.senhaDiretor,
        confirmacaoNovaSenha: configuracao.senhaDiretor,
      }),
    );
    this.diretor = this.identidade({
      ...diretor,
      trocaSenhaObrigatoria: false,
    });
  }

  private identidade(usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: "ADMINISTRADOR" | "DIRETOR_PATRIMONIO";
    trocaSenhaObrigatoria: boolean;
  }): IdentidadeAutenticada {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      trocaSenhaObrigatoria: usuario.trocaSenhaObrigatoria,
    };
  }

  private async criarResponsaveis() {
    return Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        this.responsaveis.criar(
          CriarResponsavelSchema.parse({
            nome: `Responsável Demonstração ${String(i + 1).padStart(2, "0")}`,
            matricula: `DEMO-${String(i + 1).padStart(4, "0")}`,
          }),
          this.administrador,
        ),
      ),
    );
  }

  private async criarSetores(responsaveis: { id: string }[]) {
    const resultado = [];
    for (const [i, nome] of SETORES_DEMO.entries()) {
      resultado.push(
        await this.setores.criar(
          CriarSetorSchema.parse({
            nome,
            sala: `Sala ${101 + i}`,
            ramal: String(2100 + i),
            responsavelId: responsaveis[i]!.id,
          }),
          this.administrador,
        ),
      );
    }
    return resultado;
  }

  private async criarNaturezasEspecies() {
    const resultado = [];
    for (const [nome, primeira, segunda] of NATUREZAS_ESPECIES_DEMO) {
      const natureza = await this.naturezas.criar(
        CriarNaturezaSchema.parse({
          nome,
          descricao: `Categoria sintética de demonstração: ${nome}.`,
        }),
        this.administrador,
      );
      for (const especie of [primeira, segunda]) {
        resultado.push(
          await this.especies.criar(
            CriarEspecieSchema.parse({
              nome: especie,
              descricao: `Espécie sintética de demonstração: ${especie}.`,
              naturezaId: natureza.id,
            }),
            this.administrador,
          ),
        );
      }
    }
    return resultado;
  }

  private async criarFornecedores() {
    const resultado = [];
    const nomes = [
      "Oficina Horizonte",
      "Suprimentos Aurora",
      "Tecnologia Lumen",
      "Mobiliário Ofício",
      "Climatização Brisa",
    ];
    for (const [i, nome] of nomes.entries()) {
      resultado.push(
        await this.fornecedores.criar(
          CriarFornecedorSchema.parse({
            razaoSocial: `${nome} Demonstração Ltda.`,
            nomeFantasia: nome,
            nomeRepresentante: `Representante Sintético ${i + 1}`,
            cnpj: criarCnpjSintetico(i + 1),
            email: `fornecedor${i + 1}@example.test`,
            telefone: `+55 34 3000-${String(4100 + i)}`,
            endereco: `Avenida Exemplo, ${100 + i}, Bairro Demonstração, Cidade Exemplo/MG`,
          }),
          this.administrador,
        ),
      );
    }
    return resultado;
  }

  private async criarComissoes(responsaveis: { id: string }[]) {
    const periodos = [
      [
        deslocarDataCivil(this.dataBase, -900),
        deslocarDataCivil(this.dataBase, -700),
      ],
      [
        deslocarDataCivil(this.dataBase, -500),
        deslocarDataCivil(this.dataBase, -300),
      ],
      [
        deslocarDataCivil(this.dataBase, -30),
        deslocarDataCivil(this.dataBase, 365),
      ],
    ];
    const grupos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
    ];
    const resultado = [];
    for (let i = 0; i < 3; i += 1) {
      resultado.push(
        await this.comissoes.criar(
          CriarComissaoBodySchema.parse({
            nome: `Comissão de Patrimônio Demonstração ${i + 1}`,
            descricao:
              "Comissão composta exclusivamente por dados sintéticos de demonstração.",
            numeroAto: `ATO-DEMO-${String(i + 1).padStart(3, "0")}/${this.dataBase.slice(0, 4)}`,
            dataVigenciaInicio: periodos[i]![0],
            dataVigenciaFim: periodos[i]![1],
            membros: grupos[i]!.map((indice, posicao) => ({
              responsavelId: responsaveis[indice]!.id,
              papel: posicao === 0 ? "PRESIDENTE" : "MEMBRO",
            })),
          }),
          this.administrador,
        ),
      );
    }
    return resultado;
  }

  private async criarProcessos(fornecedores: { id: string }[]) {
    const resultado = [];
    for (let i = 0; i < 10; i += 1) {
      const arquivos = [
        await this.criarPdf(`Nota fiscal ${i * 2 + 1}`),
        await this.criarPdf(`Nota fiscal ${i * 2 + 2}`),
      ];
      const valorTotal = Array.from(
        { length: 5 },
        (_, j) => 1200 + (i * 5 + j) * 137,
      )
        .reduce((a, b) => a + b, 0)
        .toFixed(7);
      resultado.push(
        await this.processos.criar(
          {
            dados: JSON.stringify({
              numeroProcesso: `DEMO-${this.dataBase.slice(0, 4)}-${String(i + 1).padStart(3, "0")}`,
              anoProcesso: Number(this.dataBase.slice(0, 4)),
              numeroEmpenho: `EMP-DEMO-${String(i + 1).padStart(3, "0")}`,
              anoEmpenho: Number(this.dataBase.slice(0, 4)),
              valorTotal,
              observacao:
                "Processo sintético criado pelo seed geral para demonstração.",
              notas: [0, 1].map((j) => ({
                numeroNotaFiscal: `NF-DEMO-${String(i * 2 + j + 1).padStart(4, "0")}`,
                anoNotaFiscal: Number(this.dataBase.slice(0, 4)),
                dataEmissao: deslocarDataCivil(this.dataBase, -120 + i),
                fornecedorId: fornecedores[(i + j) % fornecedores.length]!.id,
                anexoIndice: j,
              })),
            }),
          },
          arquivos,
          this.administrador,
        ),
      );
    }
    return resultado;
  }

  private async criarPatrimonios(
    setores: { id: string }[],
    especies: { id: string }[],
    processos: { id: string }[],
  ) {
    const resultado = [];
    for (let i = 0; i < 50; i += 1) {
      const [descricao, marca, modelo] = ITENS_DEMO[i % ITENS_DEMO.length]!;
      const valor = (1200 + i * 137).toFixed(7);
      resultado.push(
        await this.patrimonios.criar(
          CriarPatrimonioBodySchema.parse({
            semNumeroOficial: i % 5 === 4,
            dataTombamento: deslocarDataCivil(
              this.dataBase,
              -90 + Math.floor(i / 5),
            ),
            tipoIncorporacao: "AQUISICAO",
            descricao: `${descricao} — unidade de demonstração ${String(i + 1).padStart(2, "0")}`,
            marca,
            modelo,
            numeroSerie: `DEMO-${this.dataBase.replace(/-/g, "")}-${String(i + 1).padStart(4, "0")}`,
            valorIncorporacao: valor,
            especieId: especies[i % especies.length]!.id,
            setorAtualId: setores[Math.floor(i / 5)]!.id,
            processoCompraId: processos[Math.floor(i / 5)]!.id,
            ...(i % 3 === 0
              ? {
                  parametrosDepreciacao: {
                    metodo: "LINEAR",
                    vidaUtilInicialMeses: 60,
                    percentualResidual: "10.00",
                    valorResidual: (Number(valor) * 0.1).toFixed(7),
                    valorBaseInicial: valor,
                    dataInicio: deslocarDataCivil(
                      this.dataBase,
                      -90 + Math.floor(i / 5),
                    ),
                  },
                }
              : {}),
          }),
          this.diretor,
        ),
      );
    }
    return resultado;
  }

  private async criarInventario(
    comissao: { id: string },
    setores: { id: string }[],
  ) {
    const inventario = await this.inventarios.criar(
      CriarInventarioBodySchema.parse({
        nome: `Inventário Geral Demonstração ${this.dataBase}`,
        descricao: "Inventário sintético completo para validação manual.",
        observacao: "Três divergências permanecem intencionalmente pendentes.",
        comissaoId: comissao.id,
      }),
      this.diretor,
    );
    const setoresInventario = await this.db.setorInventario.findMany({
      where: { inventarioId: inventario.id },
      orderBy: { setor: { nome: "asc" } },
      include: {
        itens: {
          orderBy: { patrimonio: { numeroPatrimonio: "asc" } },
          include: { patrimonio: true },
        },
      },
    });
    if (setoresInventario.length !== setores.length)
      throw new Error("População de setores do inventário divergente.");
    const divergentes = setoresInventario
      .slice(7)
      .map((setor) => setor.itens[4]!);
    for (let i = 0; i < setoresInventario.length; i += 1) {
      const setor = setoresInventario[i]!;
      await this.inventarios.iniciarSetor(
        inventario.id,
        setor.id,
        this.diretor,
      );
      for (const item of setor.itens.slice(0, 4)) {
        await this.inventarios.verificarItem(
          inventario.id,
          setor.id,
          VerificarItemInventarioBodySchema.parse({
            numeroPatrimonial: item.patrimonio.numeroPatrimonio,
          }),
          this.diretor,
        );
      }
      if (i === 6) {
        for (const divergente of divergentes) {
          await this.inventarios.verificarItem(
            inventario.id,
            setor.id,
            VerificarItemInventarioBodySchema.parse({
              numeroPatrimonial: divergente.patrimonio.numeroPatrimonio,
            }),
            this.diretor,
          );
        }
      }
      await this.inventarios.concluirSetor(
        inventario.id,
        setor.id,
        this.diretor,
      );
    }
    await this.inventarios.finalizar(
      inventario.id,
      FinalizarInventarioBodySchema.parse({
        confirmarCorrecoesPendentes: true,
      }),
      this.diretor,
    );
  }

  private async criarManutencoes(
    comissao: { id: string },
    fornecedores: { id: string }[],
    patrimonios: { id: string }[],
  ) {
    const dataEnvio = deslocarDataCivil(this.dataBase, -10);
    const concluida = await this.manutencoes.criar(
      CriarManutencaoBodySchema.parse({
        chaveIdempotencia: "00000000-0000-4000-8000-000000000001",
        dataEnvio,
        comissaoId: comissao.id,
        justificativa:
          "Revisão corretiva sintética após o inventário de demonstração.",
        itens: patrimonios.slice(0, 3).map((bem, i) => ({
          patrimonioId: bem.id,
          tipo: i === 1 ? "PREVENTIVA" : "CORRETIVA",
          fornecedorId: fornecedores[i]!.id,
          previsaoRetorno: deslocarDataCivil(this.dataBase, -2),
          descricaoProblema: `Diagnóstico sintético do equipamento ${i + 1}.`,
          orcamentoInicial: {
            dataOrcamento: deslocarDataCivil(this.dataBase, -8),
            descricaoOrcamento: `Orçamento sintético para revisão ${i + 1}.`,
            valorOrcamento: (350 + i * 75).toFixed(7),
          },
        })),
      }),
      this.diretor,
    );
    await this.enviarDocumento(
      concluida.id,
      "PEDIDO",
      undefined,
      "00000000-0000-4000-8000-000000000010",
    );
    for (const [i, item] of concluida.itens.entries()) {
      await this.enviarDocumento(
        concluida.id,
        "ENVIO",
        item.id,
        `00000000-0000-4000-8000-00000000002${i}`,
      );
      await this.manutencoes.registrarRetorno(
        concluida.id,
        item.id,
        RegistrarRetornoManutencaoBodySchema.parse({
          chaveIdempotencia: `00000000-0000-4000-8000-00000000003${i}`,
          dataRetorno: deslocarDataCivil(this.dataBase, -1),
          descricaoServicoRealizado: `Serviço sintético concluído no item ${i + 1}.`,
          valorRealizado: (330 + i * 70).toFixed(7),
          garantia: {
            descricao: "Garantia sintética de 90 dias.",
            dataFim: deslocarDataCivil(this.dataBase, 89),
          },
        }),
        this.diretor,
      );
      await this.enviarDocumento(
        concluida.id,
        "RECEBIMENTO",
        item.id,
        `00000000-0000-4000-8000-00000000004${i}`,
      );
    }
    const aberta = await this.manutencoes.criar(
      CriarManutencaoBodySchema.parse({
        chaveIdempotencia: "00000000-0000-4000-8000-000000000002",
        dataEnvio: deslocarDataCivil(this.dataBase, -1),
        comissaoId: comissao.id,
        justificativa:
          "Manutenção sintética em andamento para validação de estados.",
        itens: [
          {
            patrimonioId: patrimonios[10]!.id,
            tipo: "CORRETIVA",
            fornecedorId: fornecedores[0]!.id,
            previsaoRetorno: deslocarDataCivil(this.dataBase, 7),
            descricaoProblema: "Falha intermitente sintética.",
            orcamentoInicial: {
              dataOrcamento: this.dataBase,
              descricaoOrcamento: "Orçamento completo de demonstração.",
              valorOrcamento: "480.0000000",
            },
          },
          {
            patrimonioId: patrimonios[11]!.id,
            tipo: "PREVENTIVA",
            descricaoProblema: "Aguardando orçamento de demonstração.",
          },
          {
            patrimonioId: patrimonios[12]!.id,
            tipo: "CORRETIVA",
            fornecedorId: fornecedores[1]!.id,
            previsaoRetorno: deslocarDataCivil(this.dataBase, 12),
            descricaoProblema:
              "Fornecedor e previsão definidos para demonstração.",
          },
        ],
      }),
      this.diretor,
    );
    await this.enviarDocumento(
      aberta.id,
      "PEDIDO",
      undefined,
      "00000000-0000-4000-8000-000000000050",
    );
  }

  private async enviarDocumento(
    pedidoId: string,
    fase: "PEDIDO" | "ENVIO" | "RECEBIMENTO",
    itemId: string | undefined,
    chaveIdempotencia: string,
  ) {
    const dados = DadosDocumentoManutencaoSchema.parse({
      chaveIdempotencia,
      fase,
      ...(itemId ? { itemId } : {}),
    });
    const arquivo = await this.criarPdf(`Documento de manutenção ${fase}`);
    await this.manutencoes.enviarDocumento(
      pedidoId,
      { dados: JSON.stringify(dados) },
      arquivo,
      this.diretor,
    );
  }

  private async criarPdf(titulo: string) {
    const raiz = this.config.getOrThrow("UPLOADS_ROOT_PATH", { infer: true });
    const diretorio = path.join(raiz, ".staging", "seed-geral");
    await mkdir(diretorio, { recursive: true });
    const arquivo = path.join(diretorio, `${randomUUID()}.pdf`);
    const conteudo = Buffer.from(
      `%PDF-1.4\n% SIPAT DEMO\n1 0 obj<</Type/Catalog>>endobj\n% ${titulo}\n%%EOF\n`,
      "utf8",
    );
    await writeFile(arquivo, conteudo, { flag: "wx", mode: 0o600 });
    this.temporarios.push(arquivo);
    return {
      originalname: "documento-demonstracao.pdf",
      mimetype: "application/pdf",
      path: arquivo,
      size: conteudo.length,
    };
  }

  private async auditarEstadoFinal() {
    const [
      usuarios,
      responsaveis,
      setores,
      naturezas,
      especies,
      fornecedores,
      comissoes,
      membros,
      processos,
      notas,
      patrimonios,
      oficiais,
      provisoria,
      ativos,
      manutencao,
      inventarios,
      itens,
      corretos,
      ausentes,
      divergentes,
      manutencoes,
      transferencias,
      baixas,
      depreciacoes,
      reavaliacoes,
    ] = await Promise.all([
      this.db.usuario.count(),
      this.db.responsavel.count(),
      this.db.setor.count(),
      this.db.natureza.count(),
      this.db.especie.count(),
      this.db.fornecedor.count(),
      this.db.comissao.count(),
      this.db.membroComissao.count(),
      this.db.processoCompra.count(),
      this.db.notaFiscal.count(),
      this.db.patrimonio.count(),
      this.db.patrimonio.count({ where: { tipoNumeroPatrimonial: "OFICIAL" } }),
      this.db.patrimonio.count({
        where: { tipoNumeroPatrimonial: "SEM_NUMERO_OFICIAL" },
      }),
      this.db.patrimonio.count({ where: { status: "ATIVO" } }),
      this.db.patrimonio.count({ where: { status: "EM_MANUTENCAO" } }),
      this.db.inventario.count({ where: { status: "FINALIZADO" } }),
      this.db.itemInventario.count(),
      this.db.itemInventario.count({ where: { situacao: "CORRETO" } }),
      this.db.itemInventario.count({ where: { situacao: "NAO_LOCALIZADO" } }),
      this.db.itemInventario.count({ where: { situacao: "DIVERGENCIA" } }),
      this.db.manutencao.count(),
      this.db.transferenciaPatrimonio.count(),
      this.db.baixaPatrimonio.count(),
      this.db.depreciacaoPatrimonio.count(),
      this.db.reavaliacaoPatrimonio.count(),
    ]);
    const esperado = [
      2, 10, 10, 5, 10, 5, 3, 9, 10, 20, 50, 40, 10, 47, 3, 1, 50, 40, 7, 3, 2,
      0, 0, 0, 0,
    ];
    const obtido = [
      usuarios,
      responsaveis,
      setores,
      naturezas,
      especies,
      fornecedores,
      comissoes,
      membros,
      processos,
      notas,
      patrimonios,
      oficiais,
      provisoria,
      ativos,
      manutencao,
      inventarios,
      itens,
      corretos,
      ausentes,
      divergentes,
      manutencoes,
      transferencias,
      baixas,
      depreciacoes,
      reavaliacoes,
    ];
    if (obtido.some((valor, i) => valor !== esperado[i]))
      throw new Error(`Auditoria final divergente: ${JSON.stringify(obtido)}.`);
    const [setoresDistribuicao, processosDistribuicao, comissoesDistribuicao] =
      await Promise.all([
        this.db.setor.findMany({
          select: {
            _count: { select: { patrimoniosAtuais: true } },
            patrimoniosAtuais: {
              select: { tipoNumeroPatrimonial: true },
            },
          },
        }),
        this.db.processoCompra.findMany({
          select: {
            valorTotal: true,
            _count: { select: { notasFiscais: true, patrimonios: true } },
            patrimonios: { select: { valorIncorporacao: true } },
          },
        }),
        this.db.comissao.findMany({
          select: { membros: { select: { tipoMembroComissao: true } } },
        }),
      ]);
    const distribuicoesInvalidas =
      setoresDistribuicao.some(
        (setor) =>
          setor._count.patrimoniosAtuais !== 5 ||
          setor.patrimoniosAtuais.filter(
            (bem) => bem.tipoNumeroPatrimonial === "OFICIAL",
          ).length !== 4,
      ) ||
      processosDistribuicao.some((processo) => {
        const primeiro = processo.patrimonios[0];
        if (!primeiro) return true;
        const soma = processo.patrimonios.reduce(
          (total, bem) => total.plus(bem.valorIncorporacao),
          primeiro.valorIncorporacao.minus(primeiro.valorIncorporacao),
        );
        return (
          processo._count.notasFiscais !== 2 ||
          processo._count.patrimonios !== 5 ||
          !processo.valorTotal?.equals(soma)
        );
      }) ||
      comissoesDistribuicao.some(
        (comissao) =>
          comissao.membros.length !== 3 ||
          comissao.membros.filter(
            (membro) => membro.tipoMembroComissao === "PRESIDENTE",
          ).length !== 1,
      );
    const notasComArquivo = await this.db.notaFiscal.findMany({
      select: { caminhoAnexoNotaFiscal: true },
    });
    if (
      distribuicoesInvalidas ||
      notasComArquivo.some((nota) => nota.caminhoAnexoNotaFiscal === null)
    )
      throw new Error(
        "Auditoria de relações e documentos do seed geral falhou.",
      );
    for (const nota of notasComArquivo) {
      const aberto = await this.armazenamento.abrir(
        nota.caminhoAnexoNotaFiscal!,
      );
      aberto.conteudo.destroy();
      if (aberto.tamanho < 5)
        throw new Error("PDF de nota fiscal vazio na auditoria final.");
    }
  }
}
