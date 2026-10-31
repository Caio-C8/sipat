# `MOBILE-QUERY-002` — Cachear leituras de domínio no mobile

**Status:** `aprovada`

## Objetivo

Migrar as leituras autenticadas de Home, patrimônios e inventários para queries
tipadas, deduplicadas e canceláveis, reutilizando dados frescos em memória e
preservando os contratos e estados públicos atuais.

## Contexto e referências

- Dependência:
  [MOBILE-QUERY-001](./MOBILE-QUERY-001-fundacao-tanstack-query.md).
- Roadmaps: [geral](../roadmap.md#cache-de-dados-no-mobile) e
  [mobile](../apps/mobile/roadmap.md#cache-de-dados-com-tanstack-query).
- Operações existentes:
  [clientes e operações](../integrations/mobile-api/clients-and-operations.md).
- Política e matriz de validade:
  [cache em memória](../integrations/mobile-api/errors-cache-testing.md#política-aprovada-para-o-cache-em-memória).
- Documentação oficial:
  [query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys),
  [query functions](https://tanstack.com/query/latest/docs/framework/react/guides/query-functions)
  e
  [cancelamento](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).

## Escopo

- criar factories de query keys determinísticas para Home, patrimônios,
  catálogos/processos e inventários;
- incluir em cada key todos os parâmetros que alteram o resultado, com filtros
  normalizados, paginação explícita e IDs validados, sem credenciais ou dados da
  identidade;
- migrar os três blocos independentes da Home para queries com `staleTime` de
  30 segundos, preservando erro e retry manual por bloco;
- migrar listagem, filtros, detalhe e catálogos de patrimônios; listas e detalhe
  usam 30 segundos, e catálogos de setores, espécies, naturezas derivadas,
  processos e detalhe de processo usam cinco minutos;
- migrar listagens e detalhes de inventários, setores e itens para 30 segundos,
  preservando paginação, filtros e autorização por perfil;
- encaminhar o `AbortSignal` recebido pela `queryFn` até as operações HTTP já
  existentes;
- usar `enabled` para parâmetros inválidos, sessão ausente e consultas sem
  permissão, sem montar request inválida;
- preservar dados já renderizados durante um refetch em background e distinguir
  carga inicial de atualização, sem apagar a tela para exibir spinner;
- fazer atualização manual chamar `refetch` mesmo durante a janela de frescor;
- substituir apenas estado remoto; estado visual, formulário, câmera e
  navegação continuam locais.

## Fora do escopo

- converter mutations ou definir invalidações, que pertencem a
  `MOBILE-QUERY-003`;
- mudar endpoint, query HTTP, response, contrato, timeout ou autorização;
- combinar responses diferentes em uma nova API ou criar endpoint mobile;
- persistir resultados, oferecer modo offline, prefetch ou mudar a experiência
  atual para rolagem infinita;
- cachear health check, login, refresh, `/me`, primeiro acesso, recuperação de
  senha ou logout.

## Decisões aprovadas

- Home, listas, detalhes e estado operacional ficam frescos por 30 segundos.
- Catálogos e detalhes usados como referência de formulário ficam frescos por
  cinco minutos.
- Queries não têm retry automático adicional. `authorizedRequest(..., true)`
  continua permitindo somente a recuperação de um `401` que já era segura.
- Uma mesma key em montagem concorrente deve compartilhar a promise e produzir
  uma única operação HTTP.
- A UI pode mostrar dado cacheado enquanto `isFetching` indica atualização; um
  erro de refetch não deve apagar silenciosamente o último dado confirmado.

## Critérios de aceite

- [ ] remontar ou voltar a uma tela dentro do `staleTime` reutiliza a cache sem
      nova chamada;
- [ ] keys diferentes separam busca, filtros, páginas e IDs sem colisão;
- [ ] duas montagens concorrentes da mesma key deduplicam a operação;
- [ ] troca de filtro ou saída da tela cancela a request quando a operação
      consome o signal;
- [ ] atualização manual ignora a janela de frescor e refaz somente a consulta
      solicitada;
- [ ] a Home mantém falhas independentes por bloco;
- [ ] respostas continuam validadas por `@repo/contracts` nas operações;
- [ ] nenhuma leitura de autenticação ou health entra no cache.

## Arquivos ou módulos potencialmente afetados

- fundação criada em `apps/mobile/src/lib/query/`;
- `apps/mobile/src/features/home/use-home-dashboard.ts` e testes da Home;
- `apps/mobile/src/features/patrimonios/use-patrimonios.ts`;
- `apps/mobile/src/features/patrimonios/create/create-patrimonio-screen.tsx`,
  preferencialmente extraindo hooks de queries do formulário;
- novo módulo de keys/hooks em `apps/mobile/src/features/patrimonios/`;
- `apps/mobile/src/features/inventarios/use-inventarios.ts`;
- `apps/mobile/src/features/inventarios/conferencia/use-conferencia.ts`;
- `apps/mobile/src/features/inventarios/correcao/use-correcao.ts`;
- novo módulo de keys/hooks em `apps/mobile/src/features/inventarios/`;
- testes dos hooks e apresentações que consomem seus estados.

## Verificações esperadas

- testes com `QueryClient` novo por caso, `retry: false` e cache limpo entre
  testes;
- testes de key, deduplicação, `staleTime`, refetch manual, cancelamento,
  paginação, `401`, `403`, timeout, rede e response inválida;
- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- smoke das rotas materiais da Home, bens, cadastro e inventários;
- `corepack pnpm format:check` e `git diff --check`.

## Pendências ou decisões bloqueantes

- Iniciar somente depois de `MOBILE-QUERY-001` estar implementada e verificada.
