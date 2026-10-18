# `PATRIMONIOS-001` — Cadastrar patrimônios

**Status:** aprovada

## Objetivo

Implementar o cadastro backend de patrimônio com número gerado pelo servidor,
persistência atômica, vínculos válidos, normalização e auditoria da sessão.

## Contexto e referências

- Roadmap: [PATRIMONIOS-001](../roadmap.md#patrimonios-001--cadastrar-patrimônios).
- Dependência: [CONTRACTS-004](./CONTRACTS-004-contratos-patrimonios.md)
  implementado e verificado.
- Requisitos: [RF10 e UC10](../requisitos-SIPAT.md#rf10-cadastro-de-patrimônios),
  RNF02, RNF03, RNF05, RNF06, RN01, RN06, RN07, RN08 e RN16.
- API: [índice](../apps/api/README.md),
  [repositories](../apps/api/repositories.md),
  [services](../apps/api/services.md),
  [segurança](../apps/api/security/README.md),
  [performance](../apps/api/performance.md) e
  [workflow](../apps/api/workflow-and-testing.md).
- Banco: [performance e transações](../performance/database.md).
- Referências oficiais: [sequences do PostgreSQL](https://www.postgresql.org/docs/current/functions-sequence.html),
  [raw queries do Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries)
  e [transações do Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions).

## Ordem de execução

1. Confirmar branch, worktree, contratos concluídos, schema e dados existentes.
2. Criar a migration de tipo de numeração e das duas sequences, incluindo
   precheck e inicialização compatível com dados canônicos existentes.
3. Gerar o Prisma Client e definir payloads selecionados.
4. Criar `PatrimoniosModule` com DTOs, tipos, repository, service, mapper e
   controller conforme a arquitetura da API.
5. Implementar a transação de criação e as validações relacionais.
6. Registrar o módulo no `AppModule` e aplicar a autorização existente.
7. Cobrir unidade, integração PostgreSQL e E2E com Guards e CSRF reais.
8. Executar lint, tipos, testes, build e verificações transversais.
9. Atualizar documentação e status somente após as evidências.

## Escopo

- enum persistente `TipoNumeroPatrimonial` com `OFICIAL` e
  `SEM_NUMERO_OFICIAL`;
- preservação de `Patrimonio.numeroPatrimonio` como string canônica única;
- sequences PostgreSQL independentes para numeração oficial e `SP-`;
- migration que reconheça apenas números positivos canônicos e `SP-` seguido de
  inteiro positivo, posicione cada sequence acima do maior valor existente e
  falhe de forma explícita diante de dado legado ambíguo;
- `POST /api/patrimonios`, autorizado somente para `DIRETOR_PATRIMONIO`;
- geração por `nextval` com nome de sequence constante e nunca influenciado por
  input externo;
- validação de setor existente e ativo, espécie existente e processo de compra
  opcional existente;
- normalização em maiúsculas e sem acentos de descrição, marca, modelo e número
  de série, e construção consistente de `textoBusca`;
- status `ATIVO`, `createdById` e timestamps definidos pelo servidor;
- situação contábil inicial baseada no valor de incorporação;
- quando o bloco opcional existir, criação do parâmetro inicial de depreciação
  na mesma transação e validação de vida útil, base e residual;
- resposta detalhada pelo mapper e schema aprovados;
- erros públicos previsíveis para relação ausente/inativa, série duplicada e
  conflito inesperado de identificador.

## Fora do escopo

- entrada manual, reserva antecipada ou reaproveitamento de número;
- garantia de sequência sem lacunas;
- cadastro em lote, importação e idempotência genérica de POST;
- CRUD de setor, espécie, natureza ou processo de compra;
- edição, exclusão, transferência, reavaliação ou depreciação automática;
- Web, mobile, geração e impressão de etiqueta.

## Decisões aprovadas

- Sequences priorizam unicidade e concorrência e podem deixar lacunas após
  rollback ou falha; números emitidos não são reutilizados.
- `OFICIAL` persiste `1`; `SEM_NUMERO_OFICIAL` persiste `SP-1`.
- Zeros à esquerda pertencem exclusivamente à apresentação futura.
- O tipo é persistido explicitamente; o prefixo não é a única fonte da regra.
- O patrimônio `SP-` continua sujeito à integridade do cadastro, embora não
  represente etiqueta oficial.
- Criação do patrimônio, situação contábil e parâmetro inicial informado é
  atômica; a sequence permanece não transacional conforme o PostgreSQL.

## Critérios de aceite

- [ ] anônimo recebe `401`, administrador recebe `403` e diretor pode criar;
- [ ] propriedades extras e campos controlados pelo servidor são rejeitados;
- [ ] cada tipo usa somente sua sequence e gera o formato canônico correto;
- [ ] criações concorrentes não recebem o mesmo identificador;
- [ ] setor inativo ou relação inexistente não cria registro parcial;
- [ ] número de série duplicado produz conflito público estável;
- [ ] normalização, texto de busca, situação contábil e auditoria são
      persistidos corretamente;
- [ ] responses não expõem model Prisma nem campos fora da allowlist;
- [ ] nenhuma interface Web/mobile é alterada.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma` e nova migration;
- `packages/database/src/index.ts` e tipos necessários;
- `apps/api/src/modules/patrimonios/`;
- `apps/api/src/app.module.ts`;
- `apps/api/test/patrimonios.e2e-spec.ts` e teste PostgreSQL relacionado;
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
- migration, criação e concorrência em PostgreSQL descartável;
- `corepack pnpm format:check`;
- `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
