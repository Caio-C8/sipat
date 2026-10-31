# `MOBILE-QUERY-003` — Invalidar cache após mutations mobile

**Status:** `concluída`

## Objetivo

Integrar as mutations patrimoniais e de inventário ao TanStack Query para que
cada sucesso invalide somente os dados potencialmente alterados, sem retry
automático, atualização otimista ou mudança no comportamento da API.

## Contexto e referências

- Dependência:
  [MOBILE-QUERY-002](./MOBILE-QUERY-002-cachear-leituras.md).
- Roadmaps: [geral](../roadmap.md#cache-de-dados-no-mobile) e
  [mobile](../apps/mobile/roadmap.md#cache-de-dados-com-tanstack-query).
- Política aprovada:
  [cache em memória](../integrations/mobile-api/errors-cache-testing.md#política-aprovada-para-o-cache-em-memória).
- Fluxos existentes:
  [cadastro patrimonial](./MOBILE-PATRIMONIOS-002-cadastrar-patrimonio.md) e
  [conferência de inventário](./MOBILE-INVENTARIOS-003-corrigir-concluir-setor.md).
- Documentação oficial:
  [mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations),
  [invalidação](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
  e
  [`QueryClient`](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient).

## Escopo

- migrar para `useMutation` o cadastro unitário de patrimônio e as mutations de
  iniciar setor, verificar item, corrigir divergência e concluir setor;
- manter `retry: false`, travas de ativação duplicada e confirmação explícita
  já existentes;
- após cadastrar patrimônio, invalidar as raízes de listagem/detalhe
  patrimonial afetadas e a contagem patrimonial da Home;
- após iniciar setor, invalidar inventários, detalhe do inventário, setores e o
  resumo de inventários da Home;
- após verificar item, invalidar setor, itens/pendências e agregados do
  inventário afetado;
- após corrigir divergência, invalidar item/pendências, setor e agregados do
  inventário afetado;
- após concluir setor, invalidar listagem/detalhe do inventário, setores,
  itens/pendências e resumo de inventários da Home;
- aguardar as invalidações necessárias antes de navegar para uma tela que
  dependa imediatamente do estado confirmado;
- manter o erro da mutation separado de erros das queries e preservar os
  tratamentos públicos de `409`, `401`, `403`, timeout e rede.

## Fora do escopo

- mutation otimista, rollback, fila offline, pausa/retomada ou persistência;
- retry automático, polling ou reenvio após reconexão;
- mudar idempotência, payload, response, locks ou regras concorrentes da API;
- invalidar todo o cache indiscriminadamente quando uma raiz de domínio for
  suficiente;
- qualquer alteração em API, contratos, Prisma ou banco.

## Decisões aprovadas

- A API permanece a fonte de verdade: nenhuma mutation apresenta sucesso antes
  da response validada.
- Invalidação usa as factories de keys de `MOBILE-QUERY-002`; componentes não
  duplicam arrays literais de keys.
- Erro ou conflito não invalida por padrão. Quando o fluxo já exige reconciliar
  `409`, ele refaz apenas as queries relacionadas ao recurso em disputa.
- Não há atualização otimista nesta entrega.

## Critérios de aceite

- [x] cada mutation é enviada uma única vez e nunca recebe retry automático;
- [x] sucesso invalida/refaz somente as famílias documentadas;
- [x] listagem, detalhe, Home e progresso deixam de exibir dado fresco obsoleto
      após uma mutation relacionada;
- [x] mutation em erro preserva o último dado confirmado e expõe feedback
      compatível com o fluxo atual;
- [x] navegação que depende do novo estado aguarda a reconciliação necessária;
- [x] logout durante mutation cancela/limpa o estado privado sem repovoar o
      cache da sessão encerrada.

## Arquivos ou módulos potencialmente afetados

- factories e hooks em `apps/mobile/src/lib/query/` e nas features de domínio;
- `apps/mobile/src/features/patrimonios/create/create-patrimonio-screen.tsx` e
  operações/hooks extraídos desse fluxo;
- `apps/mobile/src/features/inventarios/use-inventarios.ts`;
- `apps/mobile/src/features/inventarios/conferencia/use-conferencia.ts`;
- `apps/mobile/src/features/inventarios/correcao/use-correcao.ts`;
- telas consumidoras apenas para mapear os estados de mutation e aguardar
  reconciliação;
- testes de hooks, sessão e apresentação afetados.

## Verificações esperadas

- testes da matriz de invalidação, mutation única, `409`, falha de rede,
  expiração de sessão e logout concorrente;
- testes que provem ausência de retry e de atualização otimista;
- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- integração real com API/PostgreSQL existente para cadastro, início,
  conferência, correção e conclusão, sem alteração nesses serviços;
- smoke das rotas materiais após mutations;
- `corepack pnpm format:check` e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma para esta entrega. Persistência, fila offline e mutation otimista
  continuam fora do escopo.
