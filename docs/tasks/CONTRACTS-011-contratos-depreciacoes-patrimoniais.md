# `CONTRACTS-011` — Contratos de depreciações patrimoniais

**Status:** `concluída`

## Objetivo

Definir os contratos Zod 4 da conferência de pendências e das execuções
individual e em massa de depreciação, com inputs estritos, respostas finitas e
allowlists explícitas, antes da implementação do banco e da API.

## Contexto e referências

- Roadmaps: [SIPAT](../roadmap.md#contracts-011--contratos-de-depreciação-patrimonial)
  e [contratos](../contracts/roadmap.md#contracts-011--operações-de-depreciação-patrimonial).
- Requisitos: [RF15](../requisitos-SIPAT.md#rf15-depreciação-automática-de-patrimônios),
  RNF10, RNF11, RN01, RN02, RN03, RN14 e UC15.
- Dependência funcional posterior:
  [DEPRECIACOES-001](./DEPRECIACOES-001-consultar-executar-depreciacoes.md).
- Contratos: [convenções](../contracts/conventions.md),
  [integrações](../contracts/integrations.md),
  [erros](../contracts/errors.md) e [testes](../contracts/testing.md).
- Performance: [contratos e integrações](../performance/contracts-and-integrations.md).
- Referências oficiais: [Zod 4](https://zod.dev/api) e
  [MCASP 11ª edição, itens 11.5.1 a 11.5.3](https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/51045_2434252/MCASP%20-%2011%C2%AA%20Edi%C3%A7%C3%A3o.pdf).

## Ordem de execução

1. Confirmar worktree, contratos comuns e API pública atual do package.
2. Definir a primitive textual de competência mensal e sua matriz de testes.
3. Implementar params e query paginada da consulta de pendentes.
4. Implementar bodies separados para execução individual e em massa.
5. Implementar os itens e resumos de response com allowlists finitas.
6. Publicar schemas, constantes, tipos derivados e códigos de erro.
7. Testar boundaries isolados e exports pelo entrypoint público.
8. Validar o package e os consumidores existentes.
9. Atualizar status somente depois das evidências correspondentes.

## Escopo

- criar a feature `depreciacao-patrimonio` em `packages/contracts/src/`;
- representar `competencia` como string canônica `AAAA-MM`, sem dia, horário,
  offset ou coerção para `Date` no boundary;
- reutilizar params UUID patrimoniais quando a semântica for idêntica;
- definir query de `GET /api/depreciacoes/pendentes` com competência, página e
  limite, adotando padrão 20 e máximo 50;
- definir item de pendência com `patrimonioId`, número, descrição, status,
  valor bruto, depreciação acumulada, valor líquido, residual, vida útil
  restante, quota prevista e indicador `atingiraValorResidual`;
- definir response paginada própria que preserve a metadata comum e acrescente
  resumo agregado com total elegível e total já no valor residual, sem incluir
  arrays ilimitados;
- definir body estrito de `POST /api/depreciacoes` com somente `competencia`,
  `comissaoId` e `confirmarIgnorarValorResidual`; a operação sempre representa
  todos os bens elegíveis e não aceita IDs ou quantidades;
- definir body estrito de
  `POST /api/patrimonios/:patrimonioId/depreciacoes` com os mesmos três campos,
  usando o params para identificar o único patrimônio;
- manter a confirmação como boolean obrigatório, sem coerção textual;
- definir resultado individual como união discriminada entre `DEPRECIADO`, com
  competência, instante, valores anterior, depreciado e novo, patrimônio,
  comissão e auditoria permitida, e `INELEGIVEL`, com um único motivo público;
- definir resultado agregado da execução em massa com competência, comissão,
  instante, quantidade processada, quantidade que atingiu o residual e
  quantidades inelegíveis por motivo;
- limitar os motivos públicos de inelegibilidade a `BAIXADO`,
  `SEM_PARAMETRO_VIGENTE`, `DATA_INICIO_NAO_ATINGIDA`,
  `JA_DEPRECIADO_NA_COMPETENCIA` e `VALOR_RESIDUAL_ATINGIDO`;
- serializar valores monetários por `Decimal19_7Schema`, competência/data civil
  sem fuso e instante de processamento em UTC;
- publicar códigos estáveis para competência não corrente, comissão inválida,
  confirmação do residual necessária, estado contábil inconsistente e
  conflito concorrente;
- derivar tipos dos schemas e manter `@repo/contracts` independente de Prisma.

## Fora do escopo

- comparar a competência ao relógio ou consultar comissão e patrimônio;
- calcular quota, vida útil restante, elegibilidade ou agregados reais;
- Prisma, migration, NestJS, transação, locks ou índices;
- aceitar lista, intervalo ou quantidade de patrimônios;
- reavaliação, estorno, PATCH ou DELETE de depreciação;
- histórico patrimonial geral, relatórios, formulários, Web e mobile.

## Decisões aprovadas

- A competência permanece explícita no contrato para detectar tela ou request
  que atravesse a virada do mês; a API aceitará somente a competência corrente.
- Execuções individual e em massa possuem rotas e schemas distintos; nenhuma
  aceita subconjunto arbitrário.
- A consulta de pendentes é paginada e informativa. A API revalidará todo o
  conjunto no instante da mutação.
- A resposta individual distingue sucesso contábil de inelegibilidade sem
  inventar um registro de depreciação. A resposta em massa contém agregados,
  não todos os registros criados; isso impede que o payload cresça com o acervo.
- Itens já no residual exigem confirmação para serem ignorados. Itens que
  atingirem o residual durante a execução são processados e contados no
  resultado.
- Valores calculados, parâmetro, situação contábil e auditoria pertencem ao
  servidor e nunca entram nos bodies.

## Critérios de aceite

- [x] `competencia` aceita somente `AAAA-MM` canônico e rejeita datas completas,
      meses inexistentes, espaços e representações alternativas;
- [x] bodies rejeitam arrays, valores calculados, auditoria, propriedades extras
      e campos destinados ao outro escopo;
- [x] consulta limita cada página a 50 itens e a response em massa não cresce
      com a quantidade processada;
- [x] responses usam allowlists e decimais preservam até sete casas no JSON;
- [x] tipos usam `z.input` e `z.output` quando a representação realmente
      divergir;
- [x] tests cobrem payloads válidos, limites, `null`, `undefined`, propriedades
      extras, confirmação e API pública;
- [x] API, Web e mobile continuam compilando como consumidores sem receber
      implementação de interface.

Concluída em 27 de outubro de 2026. A feature publica a competência mensal, os
bodies distintos, os itens e resumos finitos, a união discriminada individual,
os agregados da execução em massa e os catálogos públicos sem depender de
Prisma. Lint, typecheck e 115 testes do package passaram, assim como o
typecheck dos consumidores API, Web e mobile.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/depreciacao-patrimonio/`;
- `packages/contracts/src/index.ts`;
- testes da feature e da API pública do package;
- roadmaps e esta tarefa, somente para registrar estado verificado.

## Verificações esperadas

- `corepack pnpm --filter @repo/contracts lint`;
- `corepack pnpm --filter @repo/contracts typecheck`;
- `corepack pnpm --filter @repo/contracts test`;
- `corepack pnpm --filter @repo/api typecheck`;
- `corepack pnpm --filter @repo/web typecheck`;
- `corepack pnpm --filter @repo/mobile typecheck`;
- `corepack pnpm format:check`;
- `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
