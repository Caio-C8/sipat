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

const server = createServer((request, response) => {
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
  if (request.method === "GET" && requestUrl.pathname === "/api/patrimonios") {
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
