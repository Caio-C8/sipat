# `CONTRACTS-004` — Contratos das operações básicas de patrimônios

**Status:** concluída

## Objetivo

Definir e testar em `@repo/contracts` os boundaries de cadastro, listagem,
detalhe e substituição do número patrimonial oficial consumidos pelos três
objetivos backend seguintes.

## Contexto e referências

- Roadmaps: [CONTRACTS-004](../roadmap.md#contracts-004--contratos-das-operações-básicas-de-patrimônios)
  e [roadmap de contratos](../contracts/roadmap.md#contracts-004--operações-básicas-de-patrimônios).
- Requisitos: [RF10](../requisitos-SIPAT.md#rf10-cadastro-de-patrimônios),
  [RF11](../requisitos-SIPAT.md#rf11-consulta-listagem-e-filtros-de-patrimônios),
  [RF12](../requisitos-SIPAT.md#rf12-alteração-do-número-patrimonial), UC10,
  UC11, UC12, RN01, RN06 e RN07.
- Contratos: [índice](../contracts/README.md),
  [convenções](../contracts/conventions.md),
  [erros](../contracts/errors.md) e
  [testes](../contracts/testing.md).
- API consumidora: [pré-requisitos](../apps/api/README.md#pré-requisitos-para-um-módulo).

## Ordem de execução

1. Confirmar worktree, versões de Zod e contratos existentes.
2. Definir primitives e enums patrimoniais sem importar `@repo/database`.
3. Definir params, body de cadastro, query de listagem e body de substituição.
4. Definir responses resumida, detalhada e paginada.
5. Exportar pelo domínio e pela API pública do package.
6. Cobrir inputs, outputs, limites, propriedades extras e exports com testes.
7. Executar as verificações e atualizar status somente após as evidências.

## Escopo

- `TipoNumeroPatrimonialSchema` com `OFICIAL` e `SEM_NUMERO_OFICIAL`;
- schemas públicos de `StatusPatrimonio` e `TipoIncorporacao` estritamente
  alinhados ao domínio aprovado;
- `PatrimonioParamsSchema` com UUID;
- `CriarPatrimonioBodySchema` estrito, contendo `semNumeroOficial` e os dados
  cadastrais e vínculos de RF10, sem campos controlados pelo servidor;
- bloco obrigatório e explícito de parâmetros iniciais de depreciação; a
  ausência do bloco invalida o cadastro;
- datas civis como strings ISO `YYYY-MM-DD`, validadas sem conversão dependente
  do fuso local;
- valores `Decimal(19,7)` representados como strings decimais canônicas no JSON,
  para não depender da precisão de `number`;
- query de listagem reutilizando paginação comum, com padrão 20 e máximo 50,
  busca textual limitada e filtros por status, setor, espécie, natureza e tipo
  de numeração;
- response resumida para lista e detalhada para criação, detalhe e substituição,
  incluindo `numeroPatrimonio` canônico e `tipoNumeroPatrimonial`;
- relações de setor/responsável e espécie/natureza somente nos formatos
  previstos pelas responses;
- `SubstituirNumeroPatrimonialBodySchema` estrito com somente
  `numeroPatrimonioAtual`; o campo aceita o formato canônico oficial sem zeros à
  esquerda e não aceita `SP-`, número formatado ou número novo;
- testes e exports públicos.

## Fora do escopo

- acesso ao banco, geração de sequência e regras relacionais;
- formatação `000001` ou `SP-000001` no backend;
- body de edição genérica, exclusão ou conversão do tipo de numeração;
- transferência, baixa, inventário, reavaliação, depreciação automática,
  impressão ou reimpressão;
- Web e mobile.

## Decisões aprovadas

- O cadastro recebe `semNumeroOficial`; não recebe o identificador resultante.
- O valor canônico de response e persistência é `1` ou `SP-1`, sem padding.
- A response expõe o tipo explicitamente; consumidores não inferem regra de
  negócio analisando prefixo.
- A substituição usa o número atual apenas como precondição de concorrência.
- O novo número, status inicial, texto de busca e auditoria são sempre derivados
  pelo servidor.
- O package de contratos permanece independente do Prisma.
- Por decisão posterior de produto, os parâmetros iniciais deixaram de ser
  opcionais: alterações futuras pertencem exclusivamente à reavaliação.

## Critérios de aceite

- [x] campos gerados pelo servidor são rejeitados nos bodies;
- [x] valores canônicos e representações formatadas são diferenciados por teste;
- [x] query inválida não é silenciosamente ignorada;
- [x] paginação e todos os textos de entrada possuem limites finitos;
- [x] datas e decimais preservam sua semântica no JSON;
- [x] responses são schemas runtime e não interfaces paralelas;
- [x] API pública expõe somente os símbolos aprovados;
- [x] nenhum arquivo de Web, mobile, API ou banco é alterado.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/patrimonio/`;
- `packages/contracts/src/index.ts`;
- `packages/contracts/src/public-api.test.ts`;
- `docs/contracts/roadmap.md`, esta tarefa e `docs/roadmap.md`, após validação.

## Verificações esperadas

- [x] `corepack pnpm --filter @repo/contracts lint`;
- [x] `corepack pnpm --filter @repo/contracts typecheck`;
- [x] `corepack pnpm --filter @repo/contracts test`;
- [x] typecheck dos consumidores API, Web e mobile;
- [x] `corepack pnpm format:check`;
- [x] `git diff --check`.

As verificações acima passaram em 18 de outubro de 2026. A implementação ficou
restrita a `packages/contracts` e aos registros de estado desta entrega; nenhum
arquivo de Web, mobile, API ou banco foi alterado.

## Pendências ou decisões bloqueantes

- Nenhuma.
