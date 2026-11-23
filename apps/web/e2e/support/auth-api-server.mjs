import movimentacoesFixtures from "./movimentacoes-fixtures.json" with { type: "json" };
import webDomainFixtures from "./web-domain-fixtures.json" with { type: "json" };
import { createServer } from "node:http";

const port = Number(process.env.PLAYWRIGHT_API_PORT ?? 3201);

const identities = {
  active: {
    id: "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    nome: "Maria da Silva",
    email: "maria@example.com",
    perfil: "ADMINISTRADOR",
    trocaSenhaObrigatoria: false,
  },
  director: {
    id: "dcebc286-aa55-4a36-9f2e-f8f885d2126c",
    nome: "João Diretor",
    email: "joao@example.com",
    perfil: "DIRETOR_PATRIMONIO",
    trocaSenhaObrigatoria: false,
  },
  pending: {
    id: "dcebc286-aa55-4a36-9f2e-f8f885d2126c",
    nome: "João Diretor",
    email: "joao@example.com",
    perfil: "DIRETOR_PATRIMONIO",
    trocaSenhaObrigatoria: true,
  },
};

const patrimonioTotals = {
  ATIVO: 28,
  BAIXADO: 2,
  EMPRESTADO: 1,
  EM_MANUTENCAO: 1,
};

const comissaoDepreciacao = {
  id: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
  nome: "Comissão patrimonial vigente",
  dataVigenciaInicio: "2026-01-01",
  dataVigenciaFim: "2026-12-31",
};

const inventarioPendenteId = "10000000-0000-4000-8000-000000000001";
const inventarioAndamentoId = "10000000-0000-4000-8000-000000000002";
const progressoInventario = {
  totalSetores: 2,
  setoresPendentes: 2,
  setoresEmAndamento: 0,
  setoresConcluidos: 0,
  totalItens: 2,
  itensPendentes: 2,
  itensVerificados: 0,
  corretos: 0,
  divergencias: 0,
  naoLocalizados: 0,
  correcoesPendentes: 0,
  correcoesCorrigidas: 0,
};
const inventarioPendente = {
  id: inventarioPendenteId,
  nome: "Inventário anual 2026",
  descricao: "Conferência patrimonial anual.",
  observacao: null,
  status: "PENDENTE",
  dataInicio: null,
  dataFim: null,
  iniciadoPorId: null,
  finalizadoPorId: null,
  createdById: identities.director.id,
  comissao: { id: comissaoDepreciacao.id, nome: comissaoDepreciacao.nome },
  progresso: progressoInventario,
  createdAt: "2026-11-16T12:00:00.000Z",
  updatedAt: null,
};
const inventarioAndamento = {
  ...inventarioPendente,
  id: inventarioAndamentoId,
  nome: "Inventário em conclusão",
  status: "EM_ANDAMENTO",
  dataInicio: "2026-11-15",
  iniciadoPorId: identities.director.id,
  progresso: {
    ...progressoInventario,
    setoresPendentes: 0,
    setoresConcluidos: 2,
    itensPendentes: 0,
    itensVerificados: 2,
    corretos: 1,
    divergencias: 1,
    correcoesPendentes: 1,
  },
};

const patrimonioBaixaId = "7041c62b-5f83-432c-a178-889977d839b1";
const baixaId = "47c53ba5-2ea3-494a-b5ea-b1b52181b752";
const patrimonioBaixa = {
  id: patrimonioBaixaId,
  numeroPatrimonio: "123",
  tipoNumeroPatrimonial: "OFICIAL",
  descricao: "Notebook corporativo com descrição longa para validar reflow",
  marca: "Dell",
  modelo: "Latitude",
  numeroSerie: "SERIE-123",
  status: "ATIVO",
  depreciavel: true,
  situacaoContabil: {
    valorBrutoAtual: "5490.0000000",
    depreciacaoAcumuladaAtual: "500.0000000",
  },
  setorAtual: {
    id: "d4f7ccde-d880-4881-a547-a5c34bf263b2",
    nome: "Tecnologia da Informação",
    responsavel: {
      id: "5c0945b2-7d3c-4b75-8bc6-5b0bf04086ab",
      nome: "Responsável patrimonial",
    },
  },
  especie: {
    id: "945fd1c9-dc0b-4308-a674-ece87adaf47d",
    nome: "Notebook",
    natureza: {
      id: "9579270d-072b-4c43-a3cb-7c9ac8107ea8",
      nome: "Equipamento de informática",
    },
  },
};
const reavaliacaoId = "8d67c3c2-5fd2-4f90-8d3d-64fb7ca129e8";
const patrimonioReavaliacao = {
  ...patrimonioBaixa,
  id: "925f5775-3027-4bc5-b658-293ea0663be1",
  numeroPatrimonio: "125",
  descricao: "Notebook disponível para reavaliação",
};
const patrimonioReavaliacaoDetalhe = {
  ...patrimonioReavaliacao,
  dataTombamento: "2025-01-15",
  tipoIncorporacao: "AQUISICAO",
  valorIncorporacao: "5490.0000000",
  processoCompra: null,
  cadastradoPor: {
    id: identities.director.id,
    nome: identities.director.nome,
  },
  parametroDepreciacaoAtual: null,
  disponibilidadeUso: null,
  resumoDepreciacao: {
    primeiraCompetencia: null,
    ultimaCompetenciaProcessada: null,
    proximaCompetencia: null,
    quantidadePendencias: 0,
  },
  createdAt: "2025-01-15T12:00:00.000Z",
  updatedAt: null,
};
const reavaliacaoResumo = {
  id: reavaliacaoId,
  dataReferencia: "2026-11-10",
  dataReavaliacao: "2026-11-10T15:30:00.000Z",
  patrimonio: {
    id: patrimonioReavaliacao.id,
    numeroPatrimonio: patrimonioReavaliacao.numeroPatrimonio,
    descricao: patrimonioReavaliacao.descricao,
  },
  comissao: {
    id: comissaoDepreciacao.id,
    nome: comissaoDepreciacao.nome,
  },
  valorLiquidoAnterior: "4990.0000000",
  valorBrutoNovo: "6000.0000000",
  vidaUtilNovaMeses: 60,
  valorResidualNovo: "600.0000000",
};
const reavaliacaoDetalhe = {
  ...reavaliacaoResumo,
  contabilAnterior: {
    valorBrutoAnterior: "5490.0000000",
    depreciacaoAcumuladaAnterior: "500.0000000",
  },
  anterior: {
    valorBrutoAnterior: "5490.0000000",
    depreciacaoAcumuladaAnterior: "500.0000000",
    valorLiquidoAnterior: "4990.0000000",
    valorBaseAnterior: "4941.0000000",
    valorResidualAnterior: "549.0000000",
    percentualResidualAnterior: "10.00",
    vidaUtilInicialAnteriorMeses: 60,
    quantidadeDepreciacoesAnteriores: 5,
    vidaUtilRestanteAnteriorMeses: 55,
    parametroAnteriorId: "6042cdfc-54d4-43bc-9ddc-449388dc0960",
  },
  novo: {
    valorBrutoNovo: "6000.0000000",
    valorBaseNova: "5400.0000000",
    valorResidualNovo: "600.0000000",
    percentualResidualNovo: "10.00",
    vidaUtilNovaMeses: 60,
  },
  parametroNovoId: "3bcaf094-f9d8-42d6-aa56-cef2923a901a",
  registradoPor: {
    id: identities.director.id,
    nome: identities.director.nome,
  },
  createdAt: "2026-11-10T15:30:00.000Z",
};
const segundoPatrimonioBaixa = {
  ...patrimonioBaixa,
  id: "a1c78412-3fee-4e32-a4cb-67f962491730",
  numeroPatrimonio: "124",
  descricao: "Monitor adicional disponível para baixa",
};
const detalheBaixa = {
  id: baixaId,
  patrimonio: {
    id: patrimonioBaixaId,
    numeroPatrimonio: "123",
    descricao: patrimonioBaixa.descricao,
  },
  comissao: {
    id: comissaoDepreciacao.id,
    nome: comissaoDepreciacao.nome,
  },
  tipo: "ALIENACAO",
  dataBaixa: "2026-11-10",
  motivo: "Alienação autorizada após avaliação da comissão patrimonial.",
  observacao: "Documento comprobatório anexado ao registro.",
  createdById: identities.director.id,
  createdBy: {
    id: identities.director.id,
    nome: identities.director.nome,
  },
  createdAt: "2026-11-10T15:30:00.000Z",
  anexoUrl: `/api/patrimonios/${patrimonioBaixaId}/baixa/anexo`,
};

const pendenteDepreciacao = {
  patrimonioId: "7041c62b-5f83-432c-a178-889977d839b1",
  numeroPatrimonio: "1",
  descricao: "Notebook para depreciação",
  status: "ATIVO",
  valorBrutoAtual: "1200.0000000",
  depreciacaoAcumuladaAtual: "100.0000000",
  valorLiquidoAtual: "1100.0000000",
  valorResidual: "120.0000000",
  vidaUtilRestanteMeses: 55,
  quotaPrevista: "20.0000000",
  atingiraValorResidual: false,
  primeiraCompetencia: "2026-10",
  ultimaCompetenciaProcessada: null,
  competenciaEsperada: "2026-10",
};

const relacionadoTeste = {
  id: webDomainFixtures.manutencao.comissaoId,
  nome: "Comissão patrimonial vigente",
};
const manutencaoResumo = {
  id: webDomainFixtures.manutencao.id,
  numeroPedido: "1",
  numeroRequisicao: "MAN-2026-001",
  dataEnvio: "2026-11-10",
  dataRetorno: null,
  status: "EM_ANDAMENTO",
  totalItens: 2,
  itensPendentes: 1,
  itensRetornados: 1,
  temAnexoObservacao: true,
};
const manutencaoItem = {
  id: webDomainFixtures.manutencao.itemId,
  patrimonio: {
    id: webDomainFixtures.manutencao.patrimonioId,
    numeroPatrimonio: "101",
    descricao: "Notebook em manutenção",
    status: "EM_MANUTENCAO",
  },
  tipo: "CORRETIVA",
  fornecedor: {
    id: webDomainFixtures.manutencao.fornecedorId,
    nome: "Oficina credenciada",
  },
  previsaoRetorno: "2026-11-30",
  descricaoProblema: "Equipamento não inicializa.",
  versaoOrcamento: 1,
  orcamentoAtual: {
    id: "11111111-1111-4111-8111-111111111120",
    versao: 1,
    dataOrcamento: "2026-11-11",
    descricaoOrcamento: "Troca da placa principal.",
    valorOrcamento: "480.0000000",
    fornecedor: {
      id: webDomainFixtures.manutencao.fornecedorId,
      nome: "Oficina credenciada",
    },
    registradoPor: { id: identities.active.id, nome: identities.active.nome },
    createdAt: "2026-11-11T14:30:00.000Z",
  },
  revisoesOrcamento: [],
  dataRetorno: null,
  descricaoServicoRealizado: null,
  valorRealizado: null,
  garantia: null,
  recebidoPor: null,
  recebidoEm: null,
  anexoObservacao: null,
};
const manutencaoItemRetornado = {
  ...manutencaoItem,
  id: "11111111-1111-4111-8111-111111111121",
  patrimonio: {
    id: "11111111-1111-4111-8111-111111111122",
    numeroPatrimonio: "102",
    descricao: "Impressora revisada",
    status: "ATIVO",
  },
  descricaoProblema: "Falhas recorrentes de impressão.",
  versaoOrcamento: 0,
  orcamentoAtual: null,
  dataRetorno: "2026-11-15",
  descricaoServicoRealizado: "Limpeza e substituição do rolete.",
  valorRealizado: "150.0000000",
  garantia: { descricao: "Garantia de 90 dias", dataFim: "2027-02-13" },
  recebidoPor: { id: identities.director.id, nome: identities.director.nome },
  recebidoEm: "2026-11-15T16:20:00.000Z",
};
const manutencaoDetalhe = {
  ...manutencaoResumo,
  justificativa: "Correção necessária para continuidade do trabalho.",
  comissao: relacionadoTeste,
  criadoPor: { id: identities.director.id, nome: identities.director.nome },
  criadoEm: "2026-11-10T12:00:00.000Z",
  itens: [manutencaoItem, manutencaoItemRetornado],
  anexoObservacao: {
    url: `/api/backend/manutencoes/${webDomainFixtures.manutencao.id}/anexo-observacao`,
  },
};
const emprestimoResumo = {
  id: webDomainFixtures.emprestimo.id,
  modoAgrupamento: "EM_GRUPO",
  destinatario: "Instituição parceira",
  dataEmprestimo: "2026-11-10T12:00:00.000Z",
  dataPrevistaDevolucao: "2026-11-30T12:00:00.000Z",
  total: 1,
  pendentes: 1,
  situacao: "EM_ANDAMENTO",
  emAtraso: false,
  createdAt: "2026-11-10T12:00:00.000Z",
};
const emprestimoDetalhe = {
  ...emprestimoResumo,
  finalidade: "Atividade institucional",
  observacao: "Devolver no prazo previsto.",
  comissao: {
    id: webDomainFixtures.emprestimo.comissaoId,
    nome: "Comissão patrimonial vigente",
  },
  registradoPor: { id: identities.director.id, nome: identities.director.nome },
  itens: [
    {
      id: webDomainFixtures.emprestimo.itemId,
      patrimonio: {
        id: webDomainFixtures.emprestimo.patrimonioId,
        numeroPatrimonio: "201",
        descricao: "Projetor multimídia",
      },
      setorVinculo: {
        id: "22222222-2222-4222-8222-222222222225",
        nome: "Plenário",
      },
      pendente: true,
      devolucao: null,
    },
  ],
};
const tiposRelatorio = [
  ["patrimonios", "Relação de patrimônios"],
  ["ficha-bem", "Ficha individual do bem"],
  ["movimentacoes", "Movimentações"],
  ["manutencoes", "Manutenções"],
  ["depreciacoes", "Depreciações"],
  ["pendencias-depreciacao", "Pendências de depreciação"],
  ["reavaliacoes", "Reavaliações"],
  ["inventarios", "Inventário e inconsistências"],
  ["emprestimos", "Empréstimos"],
  ["baixas", "Baixas patrimoniais"],
].map(([tipo, titulo]) => ({
  tipo,
  titulo,
  disponivel: true,
  motivo: null,
  previa: true,
  pdf: true,
}));
const catalogoRelatorios = {
  status: 200,
  sucesso: true,
  mensagem: "Catálogo consultado.",
  dados: {
    tipos: tiposRelatorio,
    limites: {
      previaPadrao: 20,
      previaMaxima: 50,
      offsetMaximo: 50000,
      dias: 366,
      competencias: 12,
      linhasPdf: 1000,
      paginasPdf: 200,
      bytesPdf: 10485760,
      bytesDataset: 8388608,
      emissoesUsuario: 1,
      emissoesInstancia: 2,
      prazoMs: 20000,
      bancoMs: 10000,
    },
  },
};

let fornecedorCrud = null;

async function lerJson(request) {
  const partes = [];
  for await (const parte of request) partes.push(parte);
  return JSON.parse(Buffer.concat(partes).toString("utf8"));
}

function fornecedorCrudAtivo(cookie = "") {
  return cookie.includes("sipat_fornecedores_scenario=crud");
}

function detalheFornecedor(dados, anterior = {}) {
  const agora = new Date().toISOString();
  const valorOpcional = (campo) =>
    Object.hasOwn(dados, campo) ? dados[campo] : (anterior[campo] ?? null);
  return {
    id: anterior.id ?? "7041c62b-5f83-432c-a178-889977d839b1",
    razaoSocial: dados.razaoSocial ?? anterior.razaoSocial,
    nomeFantasia: valorOpcional("nomeFantasia"),
    nomeRepresentante: valorOpcional("nomeRepresentante"),
    cnpj:
      dados.cnpj === null
        ? null
        : (dados.cnpj ?? anterior.cnpj ?? null)?.replace(/[./-]/g, ""),
    email: valorOpcional("email"),
    telefone: valorOpcional("telefone"),
    endereco: valorOpcional("endereco"),
    ativo: dados.ativo ?? anterior.ativo ?? true,
    createdById: anterior.createdById ?? "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0",
    createdAt: anterior.createdAt ?? agora,
    updatedAt: anterior.id ? agora : null,
  };
}

function json(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Request-Id": "e2e-api-request",
  });
  response.end(JSON.stringify(body));
}

function sessionFromCookie(cookie = "") {
  const match = /(?:^|;\s*)sipat_session=(active|director|pending)(?:;|$)/.exec(
    cookie,
  );
  return match?.[1];
}

function dashboardScenarioFromCookie(cookie = "") {
  const match =
    /(?:^|;\s*)sipat_dashboard_scenario=(zero|error|slow)(?:;|$)/.exec(cookie);
  return match?.[1];
}

function baixaScenarioFromCookie(cookie = "") {
  return cookie.includes("sipat_baixas_scenario=1");
}

function reavaliacaoScenarioFromCookie(cookie = "") {
  return cookie.includes("sipat_reavaliacoes_scenario=1");
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(
    request.url ?? "/",
    `http://${request.headers.host}`,
  );

  if (request.method === "GET" && requestUrl.pathname === "/api/health") {
    json(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/auth/me") {
    if (request.headers.cookie?.includes("sipat_session=unavailable")) {
      json(response, 503, {
        status: 503,
        sucesso: false,
        codigo: "SERVICO_INDISPONIVEL",
        mensagem: "Serviço temporariamente indisponível.",
        erros: [],
        requisicaoId: "e2e-api-request",
      });
      return;
    }

    const session = sessionFromCookie(request.headers.cookie);
    const identity = session ? identities[session] : undefined;

    if (!identity) {
      json(response, 401, {
        status: 401,
        sucesso: false,
        codigo: "NAO_AUTENTICADO",
        mensagem: "Autenticação necessária.",
        erros: [],
        requisicaoId: "e2e-api-request",
      });
      return;
    }

    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Identidade autenticada consultada com sucesso.",
      dados: identity,
    });
    return;
  }

  if (
    request.method === "GET" &&
    request.headers.cookie?.includes("sipat_manutencoes_scenario=1")
  ) {
    if (requestUrl.pathname === "/api/manutencoes") {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Manutenções listadas.",
        dados: [manutencaoResumo],
        meta: { total: 1, pagina: 1, limite: 20, ultimaPagina: 1 },
      });
      return;
    }
    if (
      requestUrl.pathname ===
      `/api/manutencoes/${webDomainFixtures.manutencao.id}`
    ) {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Manutenção consultada.",
        dados: manutencaoDetalhe,
      });
      return;
    }
  }

  if (
    request.method === "GET" &&
    request.headers.cookie?.includes("sipat_emprestimos_scenario=1")
  ) {
    if (requestUrl.pathname === "/api/emprestimos") {
      const finalizados =
        requestUrl.searchParams.get("situacao") === "CONCLUIDO";
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Empréstimos listados.",
        dados: finalizados ? [] : [emprestimoResumo],
        meta: {
          total: finalizados ? 0 : 1,
          pagina: 1,
          limite: 20,
          ultimaPagina: 1,
        },
      });
      return;
    }
    if (
      requestUrl.pathname ===
      `/api/emprestimos/${webDomainFixtures.emprestimo.id}`
    ) {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Empréstimo consultado.",
        dados: emprestimoDetalhe,
      });
      return;
    }
  }

  if (
    request.method === "GET" &&
    request.headers.cookie?.includes("sipat_relatorios_scenario=1")
  ) {
    if (requestUrl.pathname === "/api/relatorios") {
      json(response, 200, catalogoRelatorios);
      return;
    }
    if (requestUrl.pathname.startsWith("/api/relatorios/opcoes/")) {
      const catalogo = requestUrl.pathname.split("/").at(-1);
      const rotulos = {
        patrimonios: "REL-301 · Notebook para relatório",
        setores: "Tecnologia da Informação",
        responsaveis: "Responsável patrimonial",
        naturezas: "Equipamento de informática",
        especies: "Notebook",
        comissoes: "Comissão patrimonial",
        fornecedores: "Fornecedor de teste",
        inventarios: "Inventário de teste",
      };
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Opções consultadas.",
        dados: [
          {
            id: webDomainFixtures.relatorio.patrimonioId,
            rotulo: rotulos[catalogo] ?? "Opção de relatório",
          },
        ],
        meta: { total: 1, pagina: 1, limite: 20, ultimaPagina: 1 },
      });
      return;
    }
    if (requestUrl.pathname === "/api/relatorios/patrimonios") {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Relatório consultado.",
        tipo: "patrimonios",
        dados: [
          {
            id: webDomainFixtures.relatorio.linhaId,
            patrimonioId: webDomainFixtures.relatorio.patrimonioId,
            numeroPatrimonio: "REL-301",
            tipoNumeroPatrimonial: "OFICIAL",
            descricao: "Notebook para relatório",
            especie: "Notebook",
            natureza: "Equipamento de informática",
            setorAtual: "Tecnologia da Informação",
            salaAtual: "Sala 1",
            responsavelAtual: "Responsável patrimonial",
            status: "ATIVO",
            dataTombamento: "2026-01-10",
            valorIncorporacao: "5000.0000000",
            valorBrutoAtual: "5000.0000000",
            depreciacaoAcumuladaAtual: "500.0000000",
            valorLiquidoAtual: "4500.0000000",
          },
        ],
        resumo: {
          quantidade: 1,
          semNumeroOficial: 0,
          semContabilidade: 0,
          incorporacao: "5000.0000000",
          brutoAtual: "5000.0000000",
          acumuladoAtual: "500.0000000",
          liquidoAtual: "4500.0000000",
        },
        meta: { total: 1, pagina: 1, limite: 20, ultimaPagina: 1 },
        consulta: {
          id: webDomainFixtures.relatorio.consultaId,
          instante: "2026-11-16T12:00:00.000Z",
          filtros: {},
          criterioTemporal: "Estado atual do patrimônio.",
          ordenacao: "Número patrimonial crescente.",
          avisos: [],
          excluidosDataDesconhecida: 0,
        },
      });
      return;
    }
    if (requestUrl.pathname === "/api/relatorios/depreciacoes") {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Depreciações consultadas.",
        tipo: "depreciacoes",
        dados: [
          {
            id: webDomainFixtures.relatorio.linhaId,
            patrimonioId: webDomainFixtures.relatorio.patrimonioId,
            competencia: "2026-10",
            numeroPatrimonio: "REL-301",
            descricao: "Notebook para depreciação",
            parametroId: "parâmetro vigente",
            processamento: "2026-11-01T12:00:00.000Z",
            valorContabilAnterior: "4500.0000000",
            valorDepreciado: "100.0000000",
            valorContabilNovo: "4400.0000000",
            comissao: "Comissão patrimonial vigente",
            autor: "João Diretor",
          },
        ],
        resumo: {
          quantidade: 1,
          bensDistintos: 1,
          quotas: "100.0000000",
          porCompetencia: [
            {
              competencia: "2026-10",
              quantidade: 1,
              quotas: "100.0000000",
            },
          ],
        },
        meta: { total: 1, pagina: 1, limite: 20, ultimaPagina: 1 },
        consulta: {
          id: webDomainFixtures.relatorio.consultaId,
          instante: "2026-11-16T12:00:00.000Z",
          filtros: {},
          criterioTemporal: "Competência mensal processada.",
          ordenacao: "Competência decrescente.",
          avisos: [],
          excluidosDataDesconhecida: 0,
        },
      });
      return;
    }
  }

  if (baixaScenarioFromCookie(request.headers.cookie)) {
    const session = sessionFromCookie(request.headers.cookie);
    if (
      request.method === "GET" &&
      requestUrl.pathname === "/api/relatorios/opcoes/patrimonios"
    ) {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Patrimônios consultados.",
        dados: [{ id: patrimonioBaixaId, rotulo: "Patrimônio 123" }],
        meta: { total: 1, pagina: 1, limite: 20, ultimaPagina: 1 },
      });
      return;
    }
    if (
      request.method === "GET" &&
      requestUrl.pathname === "/api/relatorios/opcoes/comissoes"
    ) {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Comissões consultadas.",
        dados: [
          { id: comissaoDepreciacao.id, rotulo: comissaoDepreciacao.nome },
        ],
        meta: { total: 1, pagina: 1, limite: 20, ultimaPagina: 1 },
      });
      return;
    }
    if (
      request.method === "GET" &&
      requestUrl.pathname === "/api/relatorios/baixas"
    ) {
      const dados = [
        {
          id: baixaId,
          patrimonioId: patrimonioBaixaId,
          numeroPatrimonio: "123",
          descricao: patrimonioBaixa.descricao,
          dataBaixa: detalheBaixa.dataBaixa,
          tipo: detalheBaixa.tipo,
          motivo: detalheBaixa.motivo,
          comissao: detalheBaixa.comissao.nome,
          autor: "João Diretor",
          registroEm: detalheBaixa.createdAt,
          observacao: detalheBaixa.observacao,
        },
      ];
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Baixas consultadas.",
        tipo: "baixas",
        dados,
        resumo: {
          quantidade: 1,
          porTipo: [{ tipo: "ALIENACAO", quantidade: 1 }],
        },
        meta: { total: 1, pagina: 1, limite: 20, ultimaPagina: 1 },
        consulta: {
          id: "c7e63c5e-cd1b-4ef8-8ccf-38e150eaf355",
          instante: "2026-11-13T12:00:00.000Z",
          filtros: {},
          criterioTemporal: "Data civil da baixa em São Paulo.",
          ordenacao: "Data da baixa decrescente.",
          avisos: [],
          excluidosDataDesconhecida: 0,
        },
      });
      return;
    }
    if (
      request.method === "GET" &&
      requestUrl.pathname === "/api/patrimonios" &&
      requestUrl.searchParams.get("status") === "ATIVO"
    ) {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Patrimônios listados.",
        dados: [patrimonioBaixa, segundoPatrimonioBaixa],
        meta: { total: 2, pagina: 1, limite: 20, ultimaPagina: 1 },
      });
      return;
    }
    if (
      request.method === "GET" &&
      requestUrl.pathname === `/api/patrimonios/${patrimonioBaixaId}/baixa`
    ) {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Baixa consultada.",
        dados: detalheBaixa,
      });
      return;
    }
    if (
      request.method === "GET" &&
      requestUrl.pathname ===
        `/api/patrimonios/${patrimonioBaixaId}/baixa/opcoes/comissoes`
    ) {
      if (session !== "director") {
        json(response, 403, {
          status: 403,
          sucesso: false,
          codigo: "PERFIL_NAO_AUTORIZADO",
          mensagem: "Perfil não autorizado.",
          erros: [],
          requisicaoId: "e2e-api-request",
        });
        return;
      }
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Comissões listadas.",
        dados: [{ ...comissaoDepreciacao, numeroAto: "01/2026" }],
        meta: { total: 1, pagina: 1, limite: 50, ultimaPagina: 1 },
      });
      return;
    }
    if (
      request.method === "POST" &&
      requestUrl.pathname === `/api/patrimonios/${patrimonioBaixaId}/baixa`
    ) {
      if (session !== "director") {
        json(response, 403, {
          status: 403,
          sucesso: false,
          codigo: "PERFIL_NAO_AUTORIZADO",
          mensagem: "Perfil não autorizado.",
          erros: [],
          requisicaoId: "e2e-api-request",
        });
        return;
      }
      json(response, 201, {
        status: 201,
        sucesso: true,
        mensagem: "Baixa registrada.",
        dados: detalheBaixa,
      });
      return;
    }
  }

  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/fornecedores" &&
    fornecedorCrudAtivo(request.headers.cookie)
  ) {
    const ativo = requestUrl.searchParams.get("ativo");
    const busca = requestUrl.searchParams.get("busca")?.toLocaleLowerCase();
    const dados = fornecedorCrud
      ? [fornecedorCrud]
          .filter((item) => ativo === null || String(item.ativo) === ativo)
          .filter(
            (item) =>
              !busca ||
              [item.razaoSocial, item.nomeFantasia, item.cnpj].some((valor) =>
                valor?.toLocaleLowerCase().includes(busca),
              ),
          )
          .map(({ id, razaoSocial, nomeFantasia, cnpj, ativo }) => ({
            id,
            razaoSocial,
            nomeFantasia,
            cnpj,
            ativo,
          }))
      : [];
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Fornecedores listados com sucesso.",
      dados,
      meta: {
        total: dados.length,
        pagina: Number(requestUrl.searchParams.get("pagina") ?? 1),
        limite: Number(requestUrl.searchParams.get("limite") ?? 20),
        ultimaPagina: 1,
      },
    });
    return;
  }

  if (
    request.method === "GET" &&
    /^\/api\/fornecedores\/[0-9a-f-]+$/.test(requestUrl.pathname) &&
    fornecedorCrudAtivo(request.headers.cookie)
  ) {
    if (!fornecedorCrud) {
      json(response, 404, {
        status: 404,
        sucesso: false,
        codigo: "FORNECEDOR_NAO_ENCONTRADO",
        mensagem: "Fornecedor não encontrado.",
        erros: [],
        requisicaoId: "fornecedores-e2e",
      });
      return;
    }
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Fornecedor encontrado com sucesso.",
      dados: fornecedorCrud,
    });
    return;
  }

  if (
    ["POST", "PATCH"].includes(request.method ?? "") &&
    /^\/api\/fornecedores(?:\/[0-9a-f-]+(?:\/situacao)?)?$/.test(
      requestUrl.pathname,
    ) &&
    fornecedorCrudAtivo(request.headers.cookie)
  ) {
    const session = sessionFromCookie(request.headers.cookie);
    if (session !== "active") {
      json(response, 403, {
        status: 403,
        sucesso: false,
        codigo: "PERFIL_NAO_AUTORIZADO",
        mensagem: "Perfil não autorizado.",
        erros: [],
        requisicaoId: "fornecedores-e2e",
      });
      return;
    }
    if (request.headers["x-sipat-csrf"] !== "1") {
      json(response, 403, {
        status: 403,
        sucesso: false,
        codigo: "CSRF_INVALIDO",
        mensagem: "Sinal CSRF inválido.",
        erros: [],
        requisicaoId: "fornecedores-e2e",
      });
      return;
    }
    const body = await lerJson(request);
    const cnpj = body.cnpj?.replace(/[./-]/g, "");
    if (
      request.method === "POST" &&
      fornecedorCrud?.cnpj &&
      fornecedorCrud.cnpj === cnpj
    ) {
      json(response, 409, {
        status: 409,
        sucesso: false,
        codigo: "CNPJ_FORNECEDOR_JA_EXISTENTE",
        mensagem: "Já existe um fornecedor com o CNPJ informado.",
        erros: [
          {
            campo: "cnpj",
            codigo: "VALOR_JA_EXISTENTE",
            mensagem: "Já existe um fornecedor com este CNPJ.",
          },
        ],
        requisicaoId: "fornecedores-e2e",
      });
      return;
    }
    const situacao = requestUrl.pathname.endsWith("/situacao");
    fornecedorCrud = detalheFornecedor(
      situacao ? { ativo: body.ativo } : { ...body, cnpj },
      request.method === "POST" ? {} : (fornecedorCrud ?? {}),
    );
    json(response, request.method === "POST" ? 201 : 200, {
      status: request.method === "POST" ? 201 : 200,
      sucesso: true,
      mensagem: situacao
        ? body.ativo
          ? "Fornecedor ativado com sucesso."
          : "Fornecedor inativado com sucesso."
        : request.method === "POST"
          ? "Fornecedor criado com sucesso."
          : "Fornecedor alterado com sucesso.",
      dados: fornecedorCrud,
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/usuarios") {
    const session = sessionFromCookie(request.headers.cookie);
    if (session !== "active") {
      json(response, session ? 403 : 401, {
        status: session ? 403 : 401,
        sucesso: false,
        codigo: session ? "PERFIL_NAO_AUTORIZADO" : "NAO_AUTENTICADO",
        mensagem: session
          ? "Perfil não autorizado."
          : "Autenticação necessária.",
        erros: [],
        requisicaoId: "usuarios-e2e",
      });
      return;
    }
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Usuários consultados.",
      dados: [],
      meta: {
        total: 0,
        pagina: Number(requestUrl.searchParams.get("pagina") ?? 1),
        limite: Number(requestUrl.searchParams.get("limite") ?? 20),
        ultimaPagina: 1,
      },
    });
    return;
  }

  if (
    request.method === "GET" &&
    /^\/api\/(?:processos-compra|naturezas|especies|comissoes|responsaveis|setores|fornecedores)$/.test(
      requestUrl.pathname,
    )
  ) {
    const session = sessionFromCookie(request.headers.cookie);
    if (!session || session === "pending") {
      json(response, 401, {
        status: 401,
        sucesso: false,
        codigo: "NAO_AUTENTICADO",
        mensagem: "Autenticação necessária.",
        erros: [],
      });
      return;
    }
    if (request.headers.cookie?.includes("sipat_cadastros_scenario=error")) {
      json(response, 503, {
        status: 503,
        sucesso: false,
        codigo: "INDISPONIVEL",
        mensagem: "Consulta temporariamente indisponível.",
        erros: [],
        requisicaoId: "cadastros-e2e",
      });
      return;
    }
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Cadastros consultados.",
      dados: [],
      meta: {
        total: 0,
        pagina: Number(requestUrl.searchParams.get("pagina") ?? 1),
        limite: Number(requestUrl.searchParams.get("limite") ?? 20),
        ultimaPagina: 1,
      },
    });
    return;
  }

  if (
    request.method === "GET" &&
    /^\/api\/movimentacoes(?:\/|$)/.test(requestUrl.pathname)
  ) {
    const session = sessionFromCookie(request.headers.cookie);
    if (!session || session === "pending") {
      json(response, 401, {
        status: 401,
        sucesso: false,
        codigo: "NAO_AUTENTICADO",
        mensagem: "Autenticação necessária.",
        erros: [],
        requisicaoId: "mov-e2e",
      });
      return;
    }
    if (request.headers.cookie?.includes("sipat_movimentacao_scenario=error")) {
      json(response, 503, {
        status: 503,
        sucesso: false,
        codigo: "SERVICO_INDISPONIVEL",
        mensagem: "Consulta temporariamente indisponível.",
        erros: [],
        requisicaoId: "mov-e2e",
      });
      return;
    }
    if (requestUrl.pathname === "/api/movimentacoes") {
      let dados = [
        movimentacoesFixtures.detalhe,
        movimentacoesFixtures.correcao,
      ].map((item) => ({
        id: item.id,
        patrimonio: item.patrimonio,
        setorOrigem: item.setorOrigem,
        setorDestino: item.setorDestino,
        comissao: item.comissao,
        dataTransferencia: item.dataTransferencia,
        origemRegistro: item.origemRegistro,
      }));
      if (requestUrl.searchParams.has("comissaoId"))
        dados = dados.filter(
          (d) => d.comissao.id === requestUrl.searchParams.get("comissaoId"),
        );
      if (request.headers.cookie?.includes("sipat_movimentacao_scenario=empty"))
        dados = [];
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Movimentações listadas.",
        dados,
        meta: { pagina: 1, limite: 20, ultimaPagina: 1, total: dados.length },
      });
      return;
    }
    const id = requestUrl.pathname.split("/").at(-1);
    const detalhe = [
      movimentacoesFixtures.detalhe,
      movimentacoesFixtures.correcao,
    ].find((item) => item.id === id);
    if (detalhe) {
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Movimentação encontrada.",
        dados: detalhe,
      });
      return;
    }
    json(response, 404, {
      status: 404,
      sucesso: false,
      codigo: "MOVIMENTACAO_NAO_ENCONTRADA",
      mensagem: "Movimentação não encontrada.",
      erros: [],
      requisicaoId: "mov-e2e",
    });
    return;
  }
  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/depreciacoes/competencias"
  ) {
    const session = sessionFromCookie(request.headers.cookie);
    if (session !== "director") {
      json(response, 403, {
        status: 403,
        sucesso: false,
        codigo: "PERFIL_NAO_AUTORIZADO",
        mensagem: "Perfil não autorizado.",
        erros: [],
      });
      return;
    }
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Competências consultadas.",
      dados: {
        competenciaAtual: "2026-11",
        competenciaMaisAntigaPendente: "2026-10",
        competencias: [
          {
            competencia: "2026-10",
            quantidadePendente: 1,
            quantidadeBloqueadaPorAnterior: 0,
          },
          {
            competencia: "2026-11",
            quantidadePendente: 1,
            quantidadeBloqueadaPorAnterior: 1,
          },
        ],
      },
    });
    return;
  }
  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/depreciacoes/pendentes"
  ) {
    const competencia = requestUrl.searchParams.get("competencia");
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Pendências consultadas.",
      dados: competencia === "2026-10" ? [pendenteDepreciacao] : [],
      meta: {
        total: competencia === "2026-10" ? 1 : 0,
        pagina: 1,
        limite: 20,
        ultimaPagina: 1,
      },
      resumo: {
        totalElegiveis: competencia === "2026-10" ? 1 : 0,
        totalNoValorResidual: 0,
      },
    });
    return;
  }
  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/reavaliacoes/opcoes/comissoes"
  ) {
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Comissões consultadas.",
      dados: [comissaoDepreciacao],
      meta: { total: 1, pagina: 1, limite: 50, ultimaPagina: 1 },
    });
    return;
  }
  const detalheReavaliacao = /^\/api\/reavaliacoes\/([0-9a-f-]+)$/.exec(
    requestUrl.pathname,
  );
  if (
    request.method === "GET" &&
    detalheReavaliacao?.[1] === reavaliacaoId &&
    reavaliacaoScenarioFromCookie(request.headers.cookie)
  ) {
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Reavaliação consultada.",
      dados: reavaliacaoDetalhe,
    });
    return;
  }
  if (request.method === "GET" && requestUrl.pathname === "/api/inventarios") {
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Inventários consultados.",
      dados: [inventarioPendente, inventarioAndamento].map((item) => {
        const resumo = { ...item };
        delete resumo.descricao;
        delete resumo.observacao;
        delete resumo.createdById;
        return resumo;
      }),
      meta: { total: 2, pagina: 1, limite: 20, ultimaPagina: 1 },
    });
    return;
  }
  const detalheInventario = /^\/api\/inventarios\/([0-9a-f-]+)$/.exec(
    requestUrl.pathname,
  );
  if (request.method === "GET" && detalheInventario) {
    const inventario =
      detalheInventario[1] === inventarioAndamentoId
        ? inventarioAndamento
        : inventarioPendente;
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Inventário consultado.",
      dados: inventario,
    });
    return;
  }
  const itensInventario = /^\/api\/inventarios\/([0-9a-f-]+)\/itens$/.exec(
    requestUrl.pathname,
  );
  if (request.method === "GET" && itensInventario) {
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Itens consultados.",
      dados: [],
      meta: { total: 0, pagina: 1, limite: 50, ultimaPagina: 1 },
    });
    return;
  }
  if (request.method === "POST" && requestUrl.pathname === "/api/inventarios") {
    json(response, 201, {
      status: 201,
      sucesso: true,
      mensagem: "Inventário criado.",
      dados: inventarioPendente,
    });
    return;
  }
  if (request.method === "PATCH" && detalheInventario) {
    const body = await lerJson(request);
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Inventário atualizado.",
      dados: {
        ...inventarioPendente,
        nome: body.nome,
        descricao: body.descricao,
        observacao: body.observacao,
        updatedAt: "2026-11-16T13:00:00.000Z",
      },
    });
    return;
  }
  if (
    request.method === "POST" &&
    requestUrl.pathname ===
      `/api/inventarios/${inventarioAndamentoId}/finalizar`
  ) {
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Inventário finalizado.",
      dados: {
        ...inventarioAndamento,
        status: "FINALIZADO",
        dataFim: "2026-11-16",
        finalizadoPorId: identities.director.id,
        updatedAt: "2026-11-16T13:00:00.000Z",
      },
    });
    return;
  }
  if (request.method === "GET" && requestUrl.pathname === "/api/reavaliacoes") {
    const dados = reavaliacaoScenarioFromCookie(request.headers.cookie)
      ? [reavaliacaoResumo]
      : [];
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Reavaliações consultadas.",
      dados,
      meta: { total: dados.length, pagina: 1, limite: 20, ultimaPagina: 1 },
    });
    return;
  }
  if (
    request.method === "POST" &&
    ["/api/reavaliacoes/previa", "/api/reavaliacoes"].includes(
      requestUrl.pathname,
    ) &&
    sessionFromCookie(request.headers.cookie) === "active"
  ) {
    json(response, 403, {
      status: 403,
      sucesso: false,
      codigo: "PERFIL_NAO_AUTORIZADO",
      mensagem: "Somente o Diretor de Patrimônio pode registrar reavaliações.",
      erros: [],
      requisicaoId: "e2e-api-request",
    });
    return;
  }
  if (
    request.method === "GET" &&
    ["/api/patrimonios", "/api/dashboard"].includes(requestUrl.pathname)
  ) {
    const session = sessionFromCookie(request.headers.cookie);

    if (!session || session === "pending") {
      json(response, 401, {
        status: 401,
        sucesso: false,
        codigo: "NAO_AUTENTICADO",
        mensagem: "Autenticação necessária.",
        erros: [],
        requisicaoId: "e2e-api-request",
      });
      return;
    }

    const scenario = dashboardScenarioFromCookie(request.headers.cookie);

    if (scenario === "error") {
      json(response, 503, {
        status: 503,
        sucesso: false,
        codigo: "SERVICO_INDISPONIVEL",
        mensagem: "Serviço temporariamente indisponível.",
        erros: [],
        requisicaoId: "e2e-api-request",
      });
      return;
    }

    if (requestUrl.pathname === "/api/dashboard") {
      const vazio = scenario === "zero";
      const dados = vazio
        ? {
            totais: {
              total: 0,
              porStatus: {
                ATIVO: 0,
                BAIXADO: 0,
                EMPRESTADO: 0,
                EM_MANUTENCAO: 0,
              },
            },
            pendencias: { inventarios: [], manutencoes: [], depreciacao: null },
            setores: [],
            atividades: [],
          }
        : {
            totais: { total: 32, porStatus: patrimonioTotals },
            pendencias: {
              inventarios: [
                {
                  id: "7041c62b-5f83-432c-a178-889977d839b1",
                  nome: "Inventário anual",
                  quantidadeCorrecoes: 4,
                  pendenciaMaisAntigaEm: "2026-08-01T15:00:00.000Z",
                  destino:
                    "/inventarios/7041c62b-5f83-432c-a178-889977d839b1?visao=pendentes",
                },
              ],
              manutencoes: [],
              depreciacao: null,
            },
            setores: [
              {
                id: "7041c62b-5f83-432c-a178-889977d839b1",
                nome: "Administrativo",
                total: 30,
                destino:
                  "/patrimonios?setorId=7041c62b-5f83-432c-a178-889977d839b1",
              },
            ],
            atividades: [
              {
                patrimonioId: "7041c62b-5f83-432c-a178-889977d839b1",
                numeroPatrimonio: "00000001",
                tipo: "MANUTENCAO_RETORNO",
                titulo: "Retorno de manutenção",
                registradoEm: "2026-09-21T15:00:00.000Z",
                destino:
                  "/patrimonios/7041c62b-5f83-432c-a178-889977d839b1?aba=historico",
              },
            ],
          };
      const enviar = () =>
        json(response, 200, {
          status: 200,
          sucesso: true,
          mensagem: "Dashboard operacional consultado.",
          dados,
        });
      if (scenario === "slow") setTimeout(enviar, 1000);
      else enviar();
      return;
    }
    const status = requestUrl.searchParams.get("status");
    const total =
      scenario === "zero" ? 0 : status ? patrimonioTotals[status] : 32;

    if (total === undefined) {
      json(response, 400, {
        status: 400,
        sucesso: false,
        codigo: "STATUS_INVALIDO",
        mensagem: "Status patrimonial inválido.",
        erros: [],
        requisicaoId: "e2e-api-request",
      });
      return;
    }

    const dados = reavaliacaoScenarioFromCookie(request.headers.cookie)
      ? [patrimonioReavaliacao]
      : [];
    const sendResponse = () =>
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Patrimônios listados com sucesso.",
        dados,
        meta: {
          total: dados.length || total,
          pagina: 1,
          ultimaPagina: 1,
          limite: dados.length ? 20 : 1,
        },
      });

    if (scenario === "slow") {
      setTimeout(sendResponse, 1_000);
      return;
    }

    sendResponse();
    return;
  }

  const detalhePatrimonio = /^\/api\/patrimonios\/([0-9a-f-]+)$/.exec(
    requestUrl.pathname,
  );
  if (
    request.method === "GET" &&
    detalhePatrimonio?.[1] === patrimonioReavaliacao.id &&
    reavaliacaoScenarioFromCookie(request.headers.cookie)
  ) {
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Patrimônio consultado.",
      dados: patrimonioReavaliacaoDetalhe,
    });
    return;
  }

  json(response, 404, {
    status: 404,
    sucesso: false,
    codigo: "ROTA_NAO_ENCONTRADA",
    mensagem: "Rota não encontrada.",
    erros: [],
    requisicaoId: "e2e-api-request",
  });
});

server.listen(port, "127.0.0.1");

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
