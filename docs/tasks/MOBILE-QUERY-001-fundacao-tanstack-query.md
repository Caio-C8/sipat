# `MOBILE-QUERY-001` — Fundação do TanStack Query no mobile

**Status:** `concluída`

## Objetivo

Instalar o TanStack Query v5 no aplicativo mobile e estabelecer um cache privado
somente em memória, integrado ao ciclo de vida do React Native e isolado entre
sessões, sem alterar API, contratos ou banco.

## Contexto e referências

- Roadmaps: [geral](../roadmap.md#cache-de-dados-no-mobile) e
  [mobile](../apps/mobile/roadmap.md#cache-de-dados-com-tanstack-query).
- Arquitetura: [estado remoto no mobile](../apps/mobile/architecture.md#estado-remoto-com-tanstack-query).
- Política aprovada:
  [erros, conectividade, cache e testes](../integrations/mobile-api/errors-cache-testing.md#política-aprovada-para-o-cache-em-memória).
- Sessão e limpeza:
  [autenticação e armazenamento](../integrations/mobile-api/auth-storage.md).
- Documentação oficial:
  [React Native](https://tanstack.com/query/latest/docs/framework/react/react-native),
  [defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
  e
  [`QueryClient`](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient).

## Escopo

- adicionar `@tanstack/react-query` v5 às dependências de `@repo/mobile` e
  atualizar somente o lockfile correspondente;
- criar um `QueryClient` estável por processo do aplicativo e instalar
  `QueryClientProvider` no layout raiz;
- configurar queries e mutations com `retry: false`; a única repetição de
  `401` segura continua coordenada por `SessionManager.authorizedRequest`;
- manter o `gcTime` padrão de cinco minutos do TanStack Query v5 e não instalar
  persister;
- integrar `focusManager` ao `AppState` nas plataformas nativas, considerando
  foco apenas quando o app estiver `active`, para que somente queries vencidas
  sejam revalidadas; React Native Web preserva o lifecycle do navegador;
- criar um boundary autenticado que cancele requests e limpe `QueryCache` e
  `MutationCache` quando a identidade autenticada mudar ou a sessão deixar de
  estar autenticada;
- não limpar o cache em refresh de token ou revalidação que preserve a mesma
  identidade;
- criar testes da configuração global, lifecycle de foco e limpeza por sessão.

## Fora do escopo

- migrar hooks de domínio nesta tarefa;
- cache em disco, AsyncStorage, SecureStore, hidratação, persistência offline ou
  fila de sincronização;
- `onlineManager`, nova dependência de conectividade ou refetch automático por
  reconexão;
- DevTools de terceiros, prefetch, polling ou execução em background;
- alteração em `apps/api`, `packages/contracts`, Prisma, migrations ou banco.

## Decisões aprovadas

- O cache é privado e existe somente durante o processo atual do aplicativo.
- Tokens, e-mail, nome e ID do usuário não entram em query keys.
- Uma troca de identidade exige cancelar trabalho pendente antes de limpar os
  caches, evitando que uma resposta da sessão anterior os repopule.
- O health check e todas as operações de autenticação permanecem fora do
  TanStack Query.
- O foco nativo segue a integração oficial com `AppState`; reconexão automática
  será decidida apenas se uma entrega futura adotar uma fonte confiável de
  conectividade.

## Critérios de aceite

- [x] existe exatamente um `QueryClient` estável envolvendo os consumidores;
- [x] voltar ao app marca foco corretamente sem disparar refetch de dado ainda
      fresco;
- [x] logout, expiração, falha de restauração e troca de usuário cancelam e
      removem dados privados de queries e mutations;
- [x] refresh da mesma sessão não elimina cache válido;
- [x] não existe persistência do cache nem nova chamada à API por esta fundação;
- [x] os testes provam defaults, foco e isolamento entre identidades.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/package.json` e `pnpm-lock.yaml`;
- `apps/mobile/src/app/_layout.tsx`;
- novo módulo em `apps/mobile/src/lib/query/` para cliente, provider, lifecycle
  e boundary de sessão;
- `apps/mobile/src/features/auth/session/session-context.tsx` apenas se a
  composição exigir expor uma transição já existente, sem mudar o contrato da
  sessão;
- testes novos próximos de `src/lib/query/` e testes de sessão afetados.

## Verificações esperadas

- testes unitários do provider, `AppState`, cancelamento e limpeza do cache;
- `pnpm --filter @repo/mobile lint`;
- `pnpm --filter @repo/mobile typecheck`;
- `pnpm --filter @repo/mobile test`;
- export Android, iOS e Web de `@repo/mobile`;
- `corepack pnpm format:check` e `git diff --check`.

## Resultado entregue

- `@tanstack/react-query@5.105.0`, compatível com React 19, foi instalado sem
  persister ou integração de conectividade;
- o layout raiz possui um único `QueryClientProvider`, com `retry: false` para
  queries e mutations e `gcTime` padrão preservado;
- o foco nativo acompanha `AppState`; Web mantém o lifecycle do navegador;
- o boundary de sessão serializa cancelamento e limpeza de `QueryCache` e
  `MutationCache`, bloqueando consumidores durante troca ou encerramento de
  identidade e preservando cache no refresh da mesma pessoa;
- typecheck, lint, 141 testes Vitest e exports Expo Android, iOS e Web passaram.

Formatação, links e whitespace também foram verificados. Build EAS e validação
em aparelho real não fazem parte da evidência desta entrega.

## Pendências ou decisões bloqueantes

- Nenhuma.
