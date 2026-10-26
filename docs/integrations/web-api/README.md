# Integração entre Web e API

Este diretório documenta os acordos e a infraestrutura que conectam
`apps/web` e `apps/api`.

## Escopo

Aqui ficam:

- clientes HTTP padronizados;
- diferença entre execução no navegador e no servidor;
- funções que representam operações HTTP;
- contratos de request e response;
- erros, cancelamento, cache e invalidação;
- autenticação, cookies `HttpOnly`, CSRF e observabilidade;
- testes da fronteira.

Construção visual fica em [Aplicação Web](../../apps/web/README.md). Detalhes de
controllers, services e repositories ficam em [API](../../apps/api/README.md).

## Estado atual

No estado atual:

- o Next.js encaminha `/api/backend/:path*` para
  `${API_INTERNAL_URL}/api/:path*`;
- o navegador pode usar a origem relativa `/api/backend` sem conhecer a URL
  interna da API;
- `@repo/contracts` é compartilhado entre Web e API;
- existem clientes HTTP centrais separados para navegador e servidor;
- `createApiClient` usa `fetch` nativo, timeout, cancelamento, serialização JSON,
  validação de responses, normalização de erros e `204 No Content`;
- respostas de erro são validadas com `RespostaErroSchema`;
- operações HTTP podem emitir métricas normalizadas sem paths, payloads,
  credenciais ou identificadores;
- existem operações tipadas de autenticação; ainda não há hooks ou política de
  cache remoto de domínio;
- os contratos e endpoints administrativos de usuários estão implementados no
  backend, mas ainda não possuem consumidor Web;
- login, logout, `/auth/me` e conclusão do primeiro acesso possuem consumidor
  Web; mutações enviam o sinal de CSRF e o cookie permanece `HttpOnly` sob
  controle da API;
- alteração e recuperação de senha estão planejadas somente para contratos,
  banco e API em `CONTRACTS-003`, `AUTH-002` e `AUTH-003`; páginas, operações e
  hooks Web permanecem fora dessas entregas.

A integração básica pode ser verificada por `GET /api/backend/health`. As
operações e os hooks Web de usuários ainda não existem.

## Transporte HTTP

Os clientes centrais usam o `fetch` nativo dos runtimes atuais do Next.js. A
abstração comum concentra somente comportamento transversal:

- composição de base URL, path e query;
- serialização JSON;
- headers comuns não sensíveis;
- timeout e `AbortSignal`;
- parsing e validação opcional da response;
- normalização de erros;
- observabilidade permitida.

Ela não contém hook React, toast, navegação, regra de negócio, permissão, cache
de biblioteca específica ou token global sem política definida.

O timeout padrão atual é um limite operacional, não uma meta de latência. Cada
fluxo crítico deve definir e medir seus próprios limites antes de alterar o
baseline.

## Runtimes

| Runtime       | Base URL                  | Pode acessar segredo   | Credenciais              |
| ------------- | ------------------------- | ---------------------- | ------------------------ |
| navegador     | `/api/backend`            | não                    | política do navegador    |
| servidor Next | `${API_INTERNAL_URL}/api` | sim, quando autorizado | encaminhamento explícito |

Uma instância universal que detecta `window` pode misturar código server-only
no bundle e esconder decisões de credenciais. A integração usa a mesma
abstração com duas instâncias centrais, uma por runtime.

## Operações e estado remoto

Uma operação representa:

```text
método HTTP + path + contrato de entrada + contrato de resposta
```

Client Components usam hooks somente quando uma biblioteca de estado remoto
for escolhida pelo projeto. Server Components chamam funções assíncronas comuns.
Não instale ou configure uma biblioteca de cache antes de existir um fluxo que
defina query keys, invalidação, retry e consistência.

## Regras centrais

- Componentes não chamam `fetch` diretamente.
- Uma operação representa um método e endpoint específicos.
- Clientes são centralizados; não crie instâncias por feature ou hook.
- Requests e responses usam contratos existentes quando disponíveis.
- Response HTTP é dado não confiável e deve ser validado.
- Segredos e URLs internas não entram no bundle do navegador.
- Mutações não recebem retry automático sem uma política explícita.
- Credenciais de navegador usam cookie `HttpOnly`; detalhes de autenticação e
  CSRF são decisões conjuntas.
- Métricas usam nomes normalizados e baixa cardinalidade.

## Fluxo Web de autenticação implementado

`WEB-AUTH-001`, `CONTRACTS-009` e `AUTH-004` implementam o fluxo:

```text
anônimo
  └─ POST /auth/login
       ├─ trocaSenhaObrigatoria = true
       │    └─ /redefinir-senha
       │         └─ POST /auth/concluir-primeiro-acesso
       │              └─ cookie rotacionado → /senha-atualizada → /dashboard
       └─ trocaSenhaObrigatoria = false
            └─ /dashboard
```

As operações de navegador usam `/api/backend`, enviam o sinal público de CSRF
nas mutações e não leem o cookie `HttpOnly`. Server Components que consultarem
`/auth/me` encaminham explicitamente o header `Cookie` recebido, usam o cliente
server-only e desabilitam cache para não misturar identidades.

As páginas protegidas confirmam a sessão por `/auth/me`; não foi necessário
adicionar Proxy do Next.js. A API continua aplicando autenticação, pendência de
primeiro acesso e perfil em toda operação.

Responses `401`, `403` por primeiro acesso e `403` por perfil são estados
distintos. A Web redireciona apenas os dois primeiros casos aplicáveis ao
fluxo; falta de perfil permanece negação de acesso, não expiração de sessão.

## Documentos

| Assunto                             | Documento                                                      |
| ----------------------------------- | -------------------------------------------------------------- |
| Clientes, operações e contratos     | [Clientes e operações](./clients-and-operations.md)            |
| Hooks de operações cliente          | [Hooks de API](./client-hooks.md)                              |
| Erros, cache, cancelamento e testes | [Erros, cache e testes](./errors-cache-and-testing.md)         |
| Sessão, cookie, CSRF e perfis       | [Identidade e acesso](../../security-and-access.md)            |
| Limites e métricas da integração    | [Performance](../../performance/contracts-and-integrations.md) |
| Fontes oficiais                     | [Referências](./references.md)                                 |

## Decisões pendentes

- biblioteca de estado remoto e regras de cache;
- consumidor Web da recuperação de senha por e-mail e token;
- retry por operação e idempotência;
- propagação de correlation ID para dependências externas;
- provedor de observabilidade, retenção, alertas e metas.

Não escolha essas políticas silenciosamente apenas para completar a estrutura.
