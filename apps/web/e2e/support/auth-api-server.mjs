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
  pending: {
    id: "dcebc286-aa55-4a36-9f2e-f8f885d2126c",
    nome: "João Diretor",
    email: "joao@example.com",
    perfil: "DIRETOR_PATRIMONIO",
    trocaSenhaObrigatoria: true,
  },
};

function json(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Request-Id": "e2e-api-request",
  });
  response.end(JSON.stringify(body));
}

function sessionFromCookie(cookie = "") {
  const match = /(?:^|;\s*)sipat_session=(active|pending)(?:;|$)/.exec(cookie);
  return match?.[1];
}

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    json(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && request.url === "/api/auth/me") {
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
