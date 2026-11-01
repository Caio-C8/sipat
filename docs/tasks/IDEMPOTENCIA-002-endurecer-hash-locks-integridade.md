# IDEMPOTENCIA-002 — Endurecer hash, locks e integridade referencial

**Status:** concluída e verificada localmente em 01/11/2026

## Objetivo

Endurecer a idempotência já entregue sem alterar rotas, contratos públicos ou a
semântica dos conflitos `409`: congelar o algoritmo de hash atual, eliminar
contenção acidental entre domínios nos advisory locks e garantir no banco que a
referência técnica de documento de manutenção não aponte para um registro
inexistente.

## Contexto e referências

- [Roadmap transversal](../roadmap.md#idempotência-de-operações-críticas)
- [CONTRACTS-016](./CONTRACTS-016-idempotencia-operacoes-criticas.md)
- [IDEMPOTENCIA-001](./IDEMPOTENCIA-001-api-persistencia-operacoes-criticas.md)
- [Documentação da API](../apps/api/README.md)
- [Performance de banco](../performance/database.md)
- [PostgreSQL — advisory locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
- [Prisma — relações](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)
- [Prisma Migrate — desenvolvimento e produção](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)

Estado confirmado no planejamento:

- `canonicalizarIdempotencia` e `calcularHashIdempotencia` não carregam versão;
- os testes fixam parte da representação canônica, mas não hashes completos de
  payloads representativos;
- movimentações, manutenções e reavaliações usam `usuarioId:chave` no advisory
  lock, enquanto os demais módulos incluem o domínio;
- `IdempotenciaManutencao.documentoId` é um UUID opcional sem relação Prisma e
  sem foreign key para `DocumentoManutencao`;
- os registros técnicos são permanentes enquanto os respectivos fatos de
  domínio existirem.

## Pré-condição obrigatória

- Antes de criar migration, confirmar o estado real do banco de desenvolvimento
  com `prisma migrate status` usando o ambiente do projeto e comparar schema e
  histórico existentes.
- Se houver migration pendente, falha ou drift, interromper a criação de outra
  migration e corrigir primeiro a causa. Não editar nem renomear migration já
  aplicada.
- Confirmar o worktree e preservar alterações alheias ao objetivo.

## Escopo

### 1. Congelar o hash atual como V1

- Tratar a canonicalização e o SHA-256 atuais como algoritmo V1 imutável.
- Manter a persistência em `CHAR(64)` e não adicionar coluna de versão nesta
  tarefa.
- Adicionar vetores permanentes com entrada, JSON canônico e digest hexadecimal
  literal esperado. Cobrir, no mínimo:
  - ordenação recursiva de propriedades;
  - `undefined`, `null`, arrays e ordem dos itens;
  - UUID com variação de caixa;
  - `Date`, `bigint`, zero negativo e número não finito, conforme o
    comportamento atual;
  - objeto com `toJSON`, representando valores decimais usados pelos módulos;
  - bytes de arquivo no utilitário específico.
- Não transformar os vetores em snapshots atualizáveis. Uma mudança futura que
  quebre um vetor exige um objetivo próprio e estratégia de compatibilidade com
  hashes V1 já persistidos.
- Documentar junto ao utilitário por que alterações aparentemente inofensivas
  na canonicalização são incompatíveis com registros existentes.

### 2. Isolar o namespace dos advisory locks

- Centralizar em `apps/api/src/common/utils/idempotencia.ts` a construção do
  texto bloqueado, recebendo domínio, usuário e chave.
- Usar namespaces estáveis e explícitos, no mínimo:
  - `movimentacao:<usuarioId>:<chave>`;
  - `manutencao:<usuarioId>:<chave>`;
  - `reavaliacao:<usuarioId>:<chave>`.
- Adaptar os três repositories antigos para consumir o helper. Não mudar a
  unicidade persistente por usuário e chave dentro de cada tabela.
- Preservar `pg_try_advisory_xact_lock`, o comportamento não bloqueante e o
  retorno `409 OPERACAO_EM_PROCESSAMENTO`.
- Atualizar testes ou SQL de teste que reproduzam manualmente o namespace. Não
  duplicar literais de namespace quando o helper puder ser reutilizado.

### 3. Proteger `documentoId` de manutenção

- Adicionar no Prisma a relação opcional de
  `IdempotenciaManutencao.documentoId` com `DocumentoManutencao.id` e a relação
  inversa necessária.
- Criar uma migration nova, nomeada pela alteração real, que:
  - faça preflight e falhe de forma clara se já existirem referências órfãs;
  - adicione foreign key com `ON DELETE RESTRICT` e `ON UPDATE CASCADE`;
  - adicione uma constraint `CHECK` que exija `documento_id IS NOT NULL` somente
    para `tipo = 'DOCUMENTO'` e `documento_id IS NULL` para os demais tipos.
- Não alterar migrations já aplicadas.
- Manter a criação do documento e do registro de idempotência na mesma
  transação.
- A foreign key desta tarefa garante existência. A coerência com
  `manutencaoId` e `itemId` continua sendo uma invariável do service, coberta
  por teste integrado. Não criar triggers ou índices compostos redundantes sem
  demonstrar uma inconsistência que a FK simples e a transação não cubram.

### 4. Cobertura de concorrência e regressão

- Preservar a defesa em camadas: advisory lock para resposta imediata,
  constraint persistente como barreira final e regras de estado/unicidade do
  domínio para comandos com chaves distintas.
- Demonstrar em PostgreSQL que:
  - duas execuções do mesmo domínio, usuário e chave não duplicam efeitos;
  - o lock de um domínio não bloqueia outro domínio com o mesmo usuário e UUID;
  - a constraint única continua protegendo a persistência;
  - documento inexistente é recusado pela FK;
  - combinações inválidas entre `tipo` e `documento_id` são recusadas pelo
    `CHECK`;
  - o fluxo real de anexo grava documento e idempotência coerentes e o reenvio
    continua retornando `OPERACAO_JA_PROCESSADA`.

## Fora do escopo

- Alterar requests, responses, códigos, mensagens, status HTTP ou interfaces
  Web/Mobile.
- Reproduzir a resposta anterior ou voltar a armazenar JSON técnico.
- Adicionar TTL, rotina de limpeza ou apagar chaves existentes.
- Adicionar coluna de versão do hash antes de existir algoritmo V2.
- Tornar duas chaves diferentes equivalentes ou deduplicar comandos de usuários
  diferentes sem uma regra de negócio própria.
- Substituir constraints e máquinas de estado por idempotência genérica.
- Criar triggers ou índices compostos apenas para antecipar casos hipotéticos.

## Decisões aprovadas

- O algoritmo atual passa a ser V1 e permanece compatível por testes dourados;
  versionamento persistido será decidido somente se surgir uma V2.
- Advisory locks recebem domínio, mas continuam sendo uma otimização de
  coordenação; constraints persistentes permanecem a garantia final.
- A correção de `documentoId` exige migration nova porque modifica uma
  constraint física do banco sincronizado.
- A FK usa `RESTRICT`: um documento referenciado por um fato permanente de
  idempotência não pode ser removido isoladamente.
- Nenhuma alteração de contrato ou consumidor é necessária.

## Critérios de aceite

- [x] Vetores literais detectam qualquer alteração no JSON canônico ou digest
      V1 dos casos representativos.
- [x] Movimentação, manutenção e reavaliação usam namespaces de lock distintos
      e centralizados.
- [x] Mesma chave dentro do mesmo domínio continua produzindo apenas um efeito
      sob concorrência.
- [x] A mesma chave em domínios diferentes não produz falso
      `OPERACAO_EM_PROCESSAMENTO`.
- [x] O banco rejeita `documentoId` inexistente e combinações incompatíveis de
      `tipo`/`documentoId`.
- [x] O fluxo de documento de manutenção preserva atomicidade, referência
      coerente e os três conflitos públicos existentes.
- [x] Banco vazio e banco no estado anterior recebem todas as migrations sem
      drift; schema Prisma e histórico ficam sincronizados.
- [x] Nenhuma rota, contrato público ou interface é alterada.

## Ordem de implementação

1. Confirmar worktree, histórico de migrations e sincronização do banco de
   desenvolvimento sem escrever uma migration compensatória.
2. Adicionar os vetores V1 antes de refatorar o utilitário; executar os testes e
   registrar os digests atuais como baseline.
3. Extrair o helper de namespace e adaptar os três repositories e os testes.
4. Consultar órfãos de `documento_id`; ajustar o schema Prisma e gerar uma única
   migration específica para FK e `CHECK`.
5. Regenerar o Prisma Client e implementar os testes PostgreSQL de integridade e
   independência dos locks.
6. Executar verificações progressivas e somente então atualizar esta tarefa,
   roadmap e documentação da API com evidências e limites reais.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/common/utils/idempotencia.ts`
- `apps/api/src/common/utils/tests/idempotencia.spec.ts`
- `apps/api/src/modules/movimentacoes/movimentacoes.repository.ts`
- `apps/api/src/modules/manutencoes/manutencoes.repository.ts`
- `apps/api/src/modules/manutencoes/manutencoes.service.ts`
- `apps/api/src/modules/reavaliacoes/reavaliacoes.repository.ts`
- `apps/api/test/idempotencia-postgres.spec.ts`
- `apps/api/test/manutencoes-postgres.spec.ts`
- `apps/api/test/movimentacoes-postgres.e2e-spec.ts`
- `apps/api/test/reavaliacoes-postgres.e2e-spec.ts`
- `packages/database/prisma/schema.prisma`
- nova migration em `packages/database/prisma/migrations/`
- [Documentação da API](../apps/api/README.md)
- [Roadmap transversal](../roadmap.md#idempotência-de-operações-críticas)

## Verificações esperadas

- `git diff --check` e validação dos links/Markdown alterados.
- `pnpm db:generate` e validação do schema Prisma.
- Lint, typecheck e testes de `@repo/database` e `@repo/api`.
- Build de `@repo/api`.
- Testes PostgreSQL isolados de `IDEMPOTENCIA-002`, incluindo migration desde
  banco vazio e sobre o schema imediatamente anterior.
- `prisma migrate status` e verificação de ausência de drift ao final.
- A CI completa permanece o critério de integração; não declarar staging ou
  produção validados a partir dos testes locais.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Resultado verificado

- A pré-condição encontrou a migration existente de `IDEMPOTENCIA-001`
  pendente no banco de desenvolvimento. Ela foi revisada, aplicada sem criar
  compensação e seguida por `migrate status` e `migrate diff` sem divergências.
  Antes da migration nova, o banco tinha 25 migrations aplicadas, nenhuma
  falha, nenhuma referência órfã e nenhuma combinação incompatível entre
  `tipo` e `documento_id`.
- Os vetores V1 fixam entrada, JSON canônico e SHA-256 literal para ordenação
  recursiva, `undefined`, `null`, arrays, UUID, `Date`, `bigint`, zero negativo,
  números não finitos, objeto decimal com `toJSON` e bytes de arquivo. A
  canonicalização permanece sem coluna de versão persistida.
- `construirNamespaceLockIdempotencia` centraliza os textos de lock;
  movimentação, manutenção e reavaliação usam namespaces distintos, mantendo
  `pg_try_advisory_xact_lock` não bloqueante e as unicidades persistentes.
- A migration
  `20261101120000_adiciona_integridade_documento_idempotencia_manutencao`
  executa preflight, adiciona o `CHECK` de tipo/documento e a FK para
  `documentos_manutencao` com `ON DELETE RESTRICT` e `ON UPDATE CASCADE`.
  Todas as 26 migrations passaram desde banco vazio e a migration nova passou
  isoladamente sobre um clone do schema anterior com 25 migrations.
- Cinco suítes PostgreSQL afetadas passaram com 46 testes: integridade e
  independência dos locks, fluxo HTTP de documento, manutenção, movimentação e
  reavaliação. O fluxo multipart confirmou documento e registro técnico na
  mesma transação e reenvio com `409 OPERACAO_JA_PROCESSADA`.
- A suíte geral da API passou com 56 suítes e 406 testes; outras 21 suítes/123
  testes condicionais ficaram ignorados nessa execução geral e foram cobertos
  separadamente quando pertenciam ao escopo. Lint e typecheck de banco/API,
  geração e validação Prisma e build da API também passaram.
- Ao final, o banco de desenvolvimento recebeu a migration nova, totalizou 26
  migrations, ficou atualizado e não apresentou diferenças no diff final.

### Limites da validação

A validação foi local, em PostgreSQL 17 descartável e no banco de
desenvolvimento. Staging, produção e a CI completa não foram executados. O
Corepack tentou buscar o `pnpm` no registry indisponível; por isso as mesmas
ferramentas instaladas no workspace foram chamadas diretamente, sem download.
