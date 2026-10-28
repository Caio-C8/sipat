# `PATRIMONIOS-004` — Permitir leitura dos catálogos patrimoniais ao Diretor

**Status:** concluída

## Objetivo

Permitir que o Diretor de Patrimônio consulte setores e espécies pelas rotas
gerais já existentes para preencher o cadastro de um bem, sem autorizar esse
perfil a criar ou alterar os catálogos e sem criar endpoints específicos para
mobile.

## Contexto e referências

- Roadmap: [sequência mobile de patrimônios](../roadmap.md#consulta-e-cadastro-de-patrimônios-no-mobile).
- Requisitos: [RF03, RF04 e RF10](../requisitos-SIPAT.md).
- Segurança: [matriz implementada](../security-and-access.md#leitura-de-catálogos-para-cadastro-patrimonial-implementada).
- Backend patrimonial já entregue:
  [PATRIMONIOS-001](./PATRIMONIOS-001-cadastrar-patrimonios.md).
- API: [índice](../apps/api/README.md),
  [autorização](../apps/api/security/authorization.md) e
  [testes](../apps/api/workflow-and-testing.md).

## Ordem de execução

1. Confirmar worktree, matriz real dos controllers, schemas públicos e testes
   E2E atuais.
2. Alterar somente os métodos `GET` de setores e espécies para aceitar
   `DIRETOR_PATRIMONIO` além de `ADMINISTRADOR`.
3. Preservar todas as mutações desses dois módulos exclusivas do
   `ADMINISTRADOR`.
4. Cobrir a matriz completa com sessão ausente, Administrador e Diretor.
5. Executar as verificações da API e atualizar estado documental somente após
   obter evidência.

## Escopo

- permitir ao Diretor chamar `GET /api/setores` e
  `GET /api/setores/:setorId`;
- permitir ao Diretor chamar `GET /api/especies` e
  `GET /api/especies/:especieId`;
- preservar paginação, busca, filtros, allowlists, mappers e respostas atuais;
- confirmar que a consulta de setores fornece nome, sala, situação e
  responsável, e que espécies fornece sua natureza vinculada;
- atualizar a descrição do estado da API e a matriz de segurança depois da
  verificação.

## Fora do escopo

- criar rota com nome ou semântica `mobile`;
- mudar contratos, services, repositories, banco ou regras de integridade sem
  evidência de necessidade;
- permitir ao Diretor `POST`, `PATCH`, inativação ou qualquer outra mutação de
  setor, espécie, natureza ou responsável;
- alterar processos de compra, patrimônios ou o aplicativo mobile nesta tarefa;
- retornar campos internos, auditoria adicional ou dados fora das allowlists
  públicas existentes.

## Decisões aprovadas

- A ampliação é de leitura e atende uma operação patrimonial já autorizada ao
  Diretor; não converte o perfil em administrador de cadastros auxiliares.
- Autorização continua declarada por método no controller e derivada da sessão.
- `403` é obrigatório nas mutações dos catálogos feitas pelo Diretor.
- O mobile consumirá as rotas gerais existentes; não haverá BFF ou endpoint
  especial para popular selects.

## Critérios de aceite

- [x] os dois perfis listam e consultam setores e espécies;
- [x] sessão ausente recebe `401` nos quatro `GET`;
- [x] Diretor recebe `403` em todas as mutações dos dois módulos;
- [x] Administrador preserva as permissões atuais;
- [x] schemas, paginação, seleção e payloads permanecem compatíveis;
- [x] nenhum endpoint, migration ou campo público novo é criado;
- [x] testes E2E exercitam Guards reais, não apenas chamadas diretas aos
      controllers.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/modules/setores/setores.controller.ts`;
- `apps/api/src/modules/especies/especies.controller.ts`;
- `apps/api/test/setores.e2e-spec.ts`;
- `apps/api/test/especies.e2e-spec.ts`;
- `docs/apps/api/README.md` após a implementação verificada;
- `docs/security-and-access.md` e roadmaps após a implementação verificada.

`packages/contracts`, services, repositories e schema Prisma são referências de
regressão e não devem mudar sem uma necessidade comprovada durante a execução.

## Verificações executadas

- `corepack pnpm --filter @repo/api lint`;
- `corepack pnpm --filter @repo/api typecheck`;
- `corepack pnpm --filter @repo/api test` — 51 suítes e 373 testes passaram;
- `corepack pnpm --filter @repo/api build`;
- `setores.e2e-spec.ts` e `especies.e2e-spec.ts` exercitam os Guards globais
  com sessões de Administrador e Diretor, além de ausência de sessão;
- `corepack pnpm format:check` e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
