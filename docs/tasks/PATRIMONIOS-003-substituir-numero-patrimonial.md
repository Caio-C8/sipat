# `PATRIMONIOS-003` — Substituir número patrimonial oficial

**Status:** aprovada

## Objetivo

Implementar a troca do número de uma etiqueta oficial danificada sem recriar o
bem, preservando identidade, vínculos e histórico auditável.

## Contexto e referências

- Roadmap: [PATRIMONIOS-003](../roadmap.md#patrimonios-003--substituir-número-patrimonial-oficial).
- Dependências: [CONTRACTS-004](./CONTRACTS-004-contratos-patrimonios.md),
  [PATRIMONIOS-001](./PATRIMONIOS-001-cadastrar-patrimonios.md) e
  [PATRIMONIOS-002](./PATRIMONIOS-002-consultar-patrimonios.md) concluídos e
  verificados.
- Requisitos: [RF12 e UC12](../requisitos-SIPAT.md#rf12-alteração-do-número-patrimonial),
  RNF02, RNF05, RNF06, RN01 e RN07.
- API: [services](../apps/api/services.md),
  [repositories](../apps/api/repositories.md),
  [autorização](../apps/api/security/authorization.md),
  [testes de segurança](../apps/api/security/testing.md) e
  [workflow](../apps/api/workflow-and-testing.md).
- Referências oficiais: [sequences do PostgreSQL](https://www.postgresql.org/docs/current/functions-sequence.html)
  e [transações do Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions).

## Ordem de execução

1. Confirmar worktree, contratos, schema, sequences e módulo implementados.
2. Adicionar o model e a migration do histórico de substituição.
3. Implementar no repository a atualização condicional e o histórico na mesma
   transação curta.
4. Implementar regra, DTO, mapper e controller sem aceitar o novo número.
5. Cobrir repetição, concorrência e rollback em PostgreSQL real.
6. Cobrir autorização, CSRF, responses e erros no E2E.
7. Executar as verificações e atualizar status somente após as evidências.

## Escopo

- model de histórico com `id`, `patrimonioId`, `numeroAnterior`, `numeroNovo`,
  `createdAt` e `createdById`;
- `POST /api/patrimonios/:patrimonioId/substituicoes-numero` autorizado somente
  para `DIRETOR_PATRIMONIO` e protegido pelo CSRF global;
- body estrito com `numeroPatrimonioAtual` canônico;
- carregamento do patrimônio e rejeição de `SEM_NUMERO_OFICIAL` antes de
  consumir a sequence;
- comparação condicional do número atual para impedir repetição e lost update;
- obtenção do próximo valor exclusivamente da sequence oficial;
- atualização do mesmo `Patrimonio` e criação do histórico em uma transação;
- response detalhada com o número novo canônico;
- erros públicos estáveis para patrimônio ausente, tipo não elegível, número
  atual divergente e conflito inesperado;
- testes que confirmem preservação de todos os campos e vínculos não envolvidos.

## Fora do escopo

- número novo fornecido pelo cliente ou escolha de número já emitido;
- conversão entre `OFICIAL` e `SEM_NUMERO_OFICIAL`;
- alteração de descrição, setor, status, valor ou depreciação;
- baixa ou criação de um segundo patrimônio;
- endpoint de impressão, arquivo de etiqueta, impressora, Web ou mobile;
- eliminação de lacunas da sequence.

## Decisões aprovadas

- A troca física altera apenas o identificador do mesmo bem.
- O número antigo fica no histórico e nunca é reutilizado.
- O número atual enviado não é uma escolha; é uma precondição otimista para
  detectar tela desatualizada, duplo envio ou concorrência.
- Patrimônio `SP-` é inelegível e não consome a sequence oficial ao ser
  rejeitado.
- Se a transação falhar depois de `nextval`, a lacuna é aceitável, mas a
  atualização e o histórico não podem ficar parciais.

## Critérios de aceite

- [ ] anônimo recebe `401`, administrador recebe `403` e diretor pode substituir;
- [ ] patrimônio ausente retorna `404` e `SP-` retorna conflito de regra sem
      consumir a sequence;
- [ ] número atual divergente retorna conflito sem alterar dados;
- [ ] sucesso preserva `id`, relações e todos os atributos fora do número;
- [ ] histórico contém exatamente o antes, depois, usuário e data da operação;
- [ ] duas requisições concorrentes com o mesmo número atual resultam em uma
      única substituição bem-sucedida;
- [ ] falha não deixa mudança sem histórico nem histórico sem mudança;
- [ ] o novo número não é aceito em params, query, body ou header.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma` e nova migration;
- `packages/database/src/index.ts` e tipos necessários;
- `apps/api/src/modules/patrimonios/`;
- `apps/api/test/patrimonios.e2e-spec.ts` e teste PostgreSQL concorrente;
- documentação de estado e roadmaps, somente após verificação.

## Verificações esperadas

- `corepack pnpm --filter @repo/contracts test`;
- `corepack pnpm --filter @repo/database db:generate`;
- `corepack pnpm --filter @repo/database lint`;
- `corepack pnpm --filter @repo/database typecheck`;
- `corepack pnpm --filter @repo/api lint`;
- `corepack pnpm --filter @repo/api typecheck`;
- `corepack pnpm --filter @repo/api test`;
- `corepack pnpm --filter @repo/api build`;
- integração PostgreSQL para atomicidade, repetição e concorrência;
- `corepack pnpm format:check`;
- `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
