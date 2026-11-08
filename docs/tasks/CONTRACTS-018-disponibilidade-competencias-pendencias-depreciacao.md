# `CONTRACTS-018` — Classificação depreciável do patrimônio ponta a ponta

**Status:** concluída e validada em 08/11/2026

## Objetivo

Implementar `depreciavel` como classificação obrigatória do patrimônio e deixar
contratos, PostgreSQL, Prisma, API, seed, Web e mobile consistentes ao final da
mesma entrega. Esta tarefa é uma fatia vertical: não pode ser encerrada após
alterar apenas `@repo/contracts`, pois o campo obrigatório quebraria os
consumidores e não teria fonte persistida.

Disponibilidade para uso, início da depreciação, seleção de competências e
pendências pertencem a
[DEPRECIACOES-002](./DEPRECIACOES-002-disponibilidade-competencias-integridade.md)
e somente começam depois desta tarefa estar implementada e validada.

## Contexto e referências

- Requisitos: [RF10 e RN22](../requisitos-SIPAT.md).
- Estado atual: [CONTRACTS-004](./CONTRACTS-004-contratos-patrimonios.md),
  [PATRIMONIOS-001](./PATRIMONIOS-001-cadastrar-patrimonios.md),
  [MOBILE-PATRIMONIOS-002](./MOBILE-PATRIMONIOS-002-cadastrar-patrimonio.md) e
  [SEED-GERAL-001](./SEED-GERAL-001-base-realista-desenvolvimento-staging.md).
- Convenções: [contratos](../contracts/README.md),
  [integração Web–API](../integrations/web-api/README.md) e
  [integração Mobile–API](../integrations/mobile-api/README.md).
- Evolução posterior: [DEPRECIACOES-002](./DEPRECIACOES-002-disponibilidade-competencias-integridade.md).

## Diagnóstico da versão anterior

A versão anterior adicionava `depreciavel` à espécie no contrato compartilhado
e exigia typecheck de todos os consumidores, mas deixava persistência e API para
`DEPRECIACOES-002`. Isso produzia um estado intermediário impossível de validar:
o contrato exigia um valor que banco e mappers ainda não forneciam. Esta versão:

- move a classificação de `Especie` para `Patrimonio`;
- não adiciona `depreciavel` a requests, responses ou opções de espécie;
- inclui todas as camadas necessárias para o campo existir de verdade;
- não antecipa os contratos de disponibilidade, competências ou pendências.

## Ordem de execução

1. Inspecionar o worktree vivo e separar alterações incompletas deixadas pela
   tentativa anterior; preservar trabalho do usuário e não assumir que arquivos
   modificados já atendem a esta especificação.
2. Alterar contratos de patrimônio e seus testes.
3. Criar migration e persistência de `Patrimonio.depreciavel`.
4. Adaptar criação, leitura, listagem, mappers e testes da API.
5. Atualizar o seed geral para a nova classificação e combinação de parâmetros.
6. Adaptar os formulários Web e mobile e todos os consumidores afetados.
7. Validar contratos, banco, API, seed, Web e mobile antes de concluir a tarefa.

## Escopo

### Contratos

- adicionar `depreciavel: boolean` obrigatório ao patrimônio criado e às
  responses de resumo, detalhe e listagem;
- modelar a criação como união discriminada estrita:
  - `depreciavel: true` exige `parametrosDepreciacao` completos;
  - `depreciavel: false` proíbe `parametrosDepreciacao`;
- no detalhe, patrimônio não depreciável retorna o parâmetro atual como `null`;
  isso representa ausência intencional do registro, não cadastro incompleto;
- não inferir a classificação pela espécie, presença de parâmetro, natureza,
  valor, tombamento ou disponibilidade;
- manter `depreciavel` fora dos contratos de espécie;
- atualizar exports, fixtures, testes de propriedades extras e todos os
  consumidores tipados.

### Banco e API

- adicionar `Patrimonio.depreciavel BOOLEAN NOT NULL`; como não há dados de
  produção, a migration não precisa criar default permanente nem inferir legado;
- garantir que patrimônio depreciável possua parâmetro inicial e que patrimônio
  não depreciável não possua parâmetro;
- usar transação e constraint trigger diferida ou outra restrição PostgreSQL
  equivalente e testada para a invariante entre tabelas; não usar `CHECK` que
  consulte outra tabela;
- criação de patrimônio e parâmetro deve ser atômica;
- persistir e mapear o campo em criação, detalhe e listagem;
- rejeitar payload inconsistente mesmo quando o cliente não usa os contratos
  compartilhados;
- não criar nesta tarefa disponibilidade, início anulável, competências,
  pendências ou regras de processamento de depreciação;
- não criar endpoint de alteração de `depreciavel`; eventual correção após o
  cadastro exige decisão de negócio própria.

### Seed geral

- adicionar `depreciavel` explicitamente a cada patrimônio da matriz;
- manter parâmetros nos patrimônios marcados como depreciáveis;
- remover/proibir parâmetros nos patrimônios não depreciáveis;
- incluir ambas as classificações em quantidade suficiente para testes;
- atualizar preflight, fixtures, testes e auditoria final afetados;
- manter as datas e o comportamento de disponibilidade atuais até
  `DEPRECIACOES-002`; bens sem disponibilidade serão introduzidos nessa tarefa
  posterior.

### Web e mobile

- adicionar ao cadastro do patrimônio a checkbox **Este bem é depreciável**,
  com texto auxiliar que explique a obrigação dos parâmetros;
- checkbox marcada torna vida útil e residual obrigatórios e envia
  `depreciavel: true` com `parametrosDepreciacao`;
- checkbox desmarcada oculta, limpa e não envia os parâmetros, enviando
  `depreciavel: false`;
- alternar a checkbox não pode reaproveitar valores ocultos indevidamente;
- exibir a classificação no detalhe do patrimônio;
- adaptar tentativas preservadas, idempotência, fixtures, mappers de
  apresentação e testes nos dois clientes;
- não alterar formulário de espécie nem tentar obter essa classificação das
  opções de espécie.

## Fora do escopo

- disponibilidade para uso e `ParametroDepreciacao.dataInicio` anulável;
- processamento, catálogo de competências ou relatório de pendências;
- alteração da classificação depois do cadastro;
- justificativa, laudo ou fluxo de exceção contábil;
- migração ou reconciliação de dados de produção;
- redesign dos cadastros além da classificação e dos campos condicionais.

## Decisões aprovadas

- A classificação pertence ao patrimônio individual.
- Ausência de parâmetro não substitui `depreciavel: false`; o booleano é sempre
  explícito.
- `ParametroDepreciacao` descreve como depreciar e não decide se o bem é
  depreciável.
- A tarefa é propositalmente transversal para não deixar contrato obrigatório
  sem persistência e sem consumidores válidos.
- Classificação não inicia depreciação; o marco temporal será a disponibilidade
  para uso implementada em `DEPRECIACOES-002`.

## Critérios de aceite

- [x] nenhum contrato de espécie contém `depreciavel`;
- [x] criação exige o booleano no patrimônio;
- [x] `true` sem parâmetros e `false` com parâmetros falham no contrato, API e
      banco;
- [x] detalhe e listagem retornam o valor persistido, sem inferência;
- [x] detalhe de patrimônio não depreciável retorna parâmetro atual `null`;
- [x] migration funciona desde banco vazio e sobre o schema anterior sem dados
      de domínio;
- [x] seed contém patrimônios depreciáveis com parâmetros e não depreciáveis sem
      parâmetros;
- [x] Web e mobile enviam payload coerente com a checkbox e limpam campos
      condicionais;
- [x] nenhuma rota de disponibilidade ou competência é criada nesta tarefa;
- [x] contratos, database, API, seed, Web e mobile passam nas verificações
      aplicáveis.

## Evidências de validação

- `pnpm check`: 16 tarefas concluídas; contratos com 149 testes, API com 420,
  Web com 101 e mobile com 191;
- builds de API e Web e export do Expo para Android, iOS e Web concluídos;
- Playwright executado com `CI=true`: 30 cenários aprovados e 13 integrações
  reais opt-in ignoradas, conforme a configuração padrão do workflow;
- migration aplicada em PostgreSQL 17 desde banco vazio e sobre as 26 migrations
  anteriores, com `prisma migrate status` e `prisma migrate diff` sem pendências;
- testes PostgreSQL de patrimônios: 10 aprovados, incluindo as duas combinações
  inválidas rejeitadas no commit da transação;
- seed geral executado em infraestrutura isolada: 40 bens depreciáveis com
  parâmetro e 10 não depreciáveis sem parâmetro.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/patrimonio/` e exports/testes públicos;
- `packages/database/prisma/schema.prisma`, nova migration e testes PostgreSQL;
- `apps/api/src/modules/patrimonios/`;
- `apps/api/src/commands/seed-geral/`;
- `apps/web/features/patrimonios/`;
- `apps/mobile/src/features/patrimonios/`;
- fixtures e testes E2E afetados nos três consumidores.

## Verificações esperadas

- lint, typecheck e testes de `@repo/contracts` e `@repo/database`;
- geração do Prisma Client, `prisma migrate status` e migration em PostgreSQL
  descartável desde banco vazio e schema anterior;
- lint, typecheck, testes e build de `@repo/api`;
- testes focados e execução do seed geral em infraestrutura isolada;
- lint, typecheck, testes e builds aplicáveis de Web e mobile;
- testes das quatro combinações principais de booleano e parâmetros;
- Prettier e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma para criação. Alterar a classificação após o cadastro não está
  autorizado por esta tarefa e deve retornar ao planejamento se for necessário.
