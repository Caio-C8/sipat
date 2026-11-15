# `WEB-AUTH-003` — Estabilizar entrada, sessão e recuperação na Web

**Status:** `implementada e validada em 14/11/2026`

## Objetivo

Eliminar os redirects incorretos e páginas vazias dos limites de autenticação,
garantir que `/` encaminhe o usuário ao destino correto e tornar verificável em
staging o link público de recuperação de senha.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisitos e decisões: [RF01](../requisitos-SIPAT.md),
  [segurança e acesso](../security-and-access.md),
  [ambientes](../environments.md) e
  [integração Web–API](../integrations/web-api/README.md#recuperação-de-senha).
- Estado relacionado: [WEB-AUTH-001](./WEB-AUTH-001-integrar-autenticacao.md) e
  [WEB-AUTH-002](./WEB-AUTH-002-recuperar-senha.md).

## Escopo

- substituir o catálogo técnico de `/` por decisão Server: anônimo vai a
  `/login`, primeiro acesso vai a `/redefinir-senha` e sessão comum vai a
  `/dashboard`;
- manter `/redefinir-senha` exclusivo do primeiro acesso autenticado e
  `/recuperar-senha#token=...` como consumidor público do token por e-mail;
- validar na inicialização que `AUTH_PASSWORD_RESET_URL`, quando habilitada,
  usa HTTPS fora de desenvolvimento e termina em `/recuperar-senha`;
- documentar e corrigir a configuração de staging sem registrar token ou
  segredo;
- substituir `return null` de páginas protegidas por redirects ou estados
  explícitos decididos no layout autenticado;
- diferenciar sessão ausente/expirada, falta de acesso e indisponibilidade
  transitória da API;
- adicionar smoke test que solicite um link, confira host/path/fragmento e abra
  a página pública em uma stack de staging ou equivalente isolada.

## Fora do escopo

- alterar duração, cookie, refresh ou política de sessão;
- criar nova forma de recuperação ou transportar token em query;
- redesign completo das telas de autenticação.

## Decisões aprovadas

- cada carregamento protegido valida a identidade no layout Server; não haverá
  polling independente em toda página;
- o fragmento com token não chega ao servidor e continua sendo removido pelo
  cliente após leitura;
- links antigos com `/redefinir-senha#token=...` não serão reinterpretados,
  pois essa rota possui semântica autenticada distinta;
- depois de corrigir ambiente/deploy, a validação usa um novo e-mail; links já
  enviados não são reescritos.

## Critérios de aceite

- [x] `/` aplica corretamente os três destinos da matriz de sessão.
- [x] página protegida sem sessão não fica vazia e termina em `/login`.
- [x] `/redefinir-senha` continua recusando anônimo e
      `/recuperar-senha#token=...` abre sem sessão.
- [x] configuração inválida de recuperação falha cedo com mensagem sem segredo.
- [x] staging gera link com `/recuperar-senha`, fragmento e HTTPS.
- [x] login, primeiro acesso, recuperação e logout não sofrem regressão.

## Arquivos ou módulos potencialmente afetados

- `apps/web/app/page.tsx`;
- `apps/web/app/(auth)/redefinir-senha/`;
- `apps/web/app/(auth)/recuperar-senha/`;
- `apps/web/app/(sistema)/layout.tsx` e páginas protegidas com `return null`;
- `apps/api/src/config/` e `apps/api/src/modules/auth/`;
- `.env.staging.example`, `.env.production.example` e `docs/environments.md`;
- testes de autenticação Web/API e smoke de ambiente.

## Verificações esperadas

- lint, tipos, testes e build de Web e API;
- Playwright da matriz de redirects e recuperação;
- integração com PostgreSQL e SMTP fake;
- smoke HTTPS em staging sem imprimir o token.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Evidências da entrega

- lint e typecheck de Web e API passaram;
- 120 testes Vitest Web e 430 testes Jest API passaram; 139 testes condicionais
  permaneceram ignorados na execução agregada;
- PostgreSQL 17 descartável recebeu as 28 migrations e executou os 12 testes de
  integração de autenticação;
- builds de API e Web passaram; no Windows, o bundle standalone exigiu permissão
  para criar symlinks;
- Playwright Chromium validou a matriz de `/`, ausência de tela vazia,
  indisponibilidade transitória, acesso negado e o consumidor público. O smoke
  isolado conferiu host, path e fragmento sem registrar o token;
- a suíte SMTP usa transporte fake e permaneceu verde. Não houve envio por SMTP
  institucional nem acesso a um deploy remoto de staging nesta execução.
