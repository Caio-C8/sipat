import movimentacoesFixtures from "./movimentacoes-fixtures.json" with { type: "json" };
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
  if (request.method === "GET" && requestUrl.pathname === "/api/reavaliacoes") {
    json(response, 200, {
      status: 200,
      sucesso: true,
      mensagem: "Reavaliações consultadas.",
      dados: [],
      meta: { total: 0, pagina: 1, limite: 20, ultimaPagina: 1 },
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
    ["/api/patrimonios", "/api/patrimonios/dashboard"].includes(
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

    if (requestUrl.pathname === "/api/patrimonios/dashboard") {
      const vazio = scenario === "zero";
      const dados = vazio
        ? {
            total: 0,
            porStatus: {
              ATIVO: 0,
              BAIXADO: 0,
              EMPRESTADO: 0,
              EM_MANUTENCAO: 0,
            },
            correcoesPendentes: 0,
            setores: [],
            atividades: [],
          }
        : {
            total: 32,
            porStatus: patrimonioTotals,
            ...{
              correcoesPendentes: 4,
              setores: [
                {
                  id: "7041c62b-5f83-432c-a178-889977d839b1",
                  nome: "Administrativo",
                  total: 32,
                },
              ],
              atividades: [
                {
                  patrimonioId: "7041c62b-5f83-432c-a178-889977d839b1",
                  numero: "00000001",
                  titulo: "Retorno de manutenção",
                  registradoEm: "2026-09-21T15:00:00.000Z",
                },
              ],
            },
          };
      const enviar = () =>
        json(response, 200, {
          status: 200,
          sucesso: true,
          mensagem: "Resumo patrimonial consultado.",
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

    const sendResponse = () =>
      json(response, 200, {
        status: 200,
        sucesso: true,
        mensagem: "Patrimônios listados com sucesso.",
        dados: [],
        meta: {
          total,
          pagina: 1,
          ultimaPagina: Math.max(1, total),
          limite: 1,
        },
      });

    if (scenario === "slow") {
      setTimeout(sendResponse, 1_000);
      return;
    }

    sendResponse();
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
