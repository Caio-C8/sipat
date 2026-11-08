# `DEPRECIACOES-002` — Disponibilidade, competências e integridade contábil

**Status:** aprovada; iniciar somente após `CONTRACTS-018` estar implementada

## Objetivo

Endurecer banco e API para que a depreciação dependa da disponibilidade real do
bem, respeite classificação e competências em ordem cronológica, preserve as
invariantes contábeis no PostgreSQL e forneça pendências para interfaces e
relatórios.

## Contexto e referências

- Requisitos: [RF07, RF10, RF15, RN20–RN22, UC15 e UC22](../requisitos-SIPAT.md).
- Dependência implementada e validada:
  [CONTRACTS-018](./CONTRACTS-018-disponibilidade-competencias-pendencias-depreciacao.md).
- Estado atual: [DEPRECIACOES-001](./DEPRECIACOES-001-consultar-executar-depreciacoes.md),
  [PATRIMONIOS-001](./PATRIMONIOS-001-cadastrar-patrimonios.md),
  [REAVALIACOES-001](./REAVALIACOES-001-api-persistencia-reavaliacoes.md) e
  [SEED-GERAL-001](./SEED-GERAL-001-base-realista-desenvolvimento-staging.md).
- Referências oficiais:
  [MCASP 11ª edição, itens 11.5–11.5.3](https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/51045_2434252/MCASP%20-%2011%C2%AA%20Edi%C3%A7%C3%A3o.pdf),
  [constraints do PostgreSQL 17](https://www.postgresql.org/docs/17/ddl-constraints.html),
  [triggers do PostgreSQL 17](https://www.postgresql.org/docs/17/sql-createtrigger.html),
  [índices do Prisma ORM 7](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/indexes)
  e [transações do Prisma ORM 7](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions).

## Ordem de execução

1. Confirmar worktree, migrations e que `CONTRACTS-018` entregou
   `Patrimonio.depreciavel` no contrato, banco, API, seed, Web e mobile.
2. Definir e testar os novos contratos de disponibilidade, competências e
   pendências junto com seus consumidores nesta mesma tarefa.
3. Auditar o desenho SQL e criar uma migration nova; não editar migrations
   aplicadas.
4. Gerar o Prisma Client e atualizar repositories/mappers de patrimônios.
5. Implementar a operação idempotente de disponibilidade para uso.
6. Evoluir consulta e execução de depreciação para competências ordenadas.
7. Adaptar reavaliação, relatório de pendências e resumo derivado.
8. Atualizar o seed geral e seu preflight.
9. Validar migration, banco real, concorrência, contratos, API e consumidores.

## Escopo

### Persistência e invariantes locais

- consumir `Patrimonio.depreciavel` já persistido por `CONTRACTS-018`, sem
  adicionar ou inferir classificação na espécie;
- criar `DisponibilidadeUsoPatrimonio` como relação um-para-um imutável com
  patrimônio, contendo data civil, `createdAt` e `createdById`; o registro é a
  fonte de verdade, sem duplicar a data em `Patrimonio`;
- tornar `ParametroDepreciacao.dataInicio` anulável: parâmetro inicial de bem
  ainda indisponível fica nulo; disponibilidade confirma e inicia o parâmetro
  vigente na mesma transação;
- patrimônio depreciável exige parâmetro inicial; patrimônio não depreciável
  proíbe parâmetro em criação e reavaliação;
- preservar no máximo um parâmetro vigente e uma situação contábil por bem;
- adicionar chave única composta em parâmetro e FK composta em depreciação para
  provar no banco que o parâmetro pertence ao mesmo patrimônio;
- manter unicidade de patrimônio, parâmetro e competência;
- nomear e testar `CHECK`s para:
  - vida útil entre 1 e 1.200 meses;
  - base e valor bruto estritamente positivos;
  - residual entre zero e a base;
  - percentual residual nulo ou entre zero e 100;
  - acumulado entre zero e o valor bruto;
  - fim nulo ou cronologicamente coerente com início quando este existir;
  - competência no primeiro dia do mês;
  - valor depreciado positivo;
  - valor novo igual ao anterior menos a quota, não negativo e não superior ao
    anterior;
- manter FKs históricas com `ON DELETE RESTRICT` para disponibilidade,
  parâmetros, depreciações, comissão e autoria;
- não usar `CHECK` que consulte outra tabela. Restrições entre disponibilidade,
  classificação do patrimônio, parâmetro, residual, histórico e situação
  contábil devem usar FK, transação e constraint trigger documentada e testada
  no PostgreSQL;
- impedir `UPDATE` e `DELETE` dos fatos de disponibilidade e depreciação pelo
  caminho operacional; correção/estorno não faz parte desta tarefa.

### Contratos compartilhados desta evolução

- implementar nesta mesma tarefa os contratos de disponibilidade, catálogo de
  competências, resumo e relatório de pendências descritos abaixo;
- atualizar API, Web e fixtures consumidoras antes de exigir typecheck global;
- não reabrir o contrato de classificação entregue por `CONTRACTS-018`;
- manter competências como `AAAA-MM` na integração e localização somente na
  apresentação.

### API e concorrência

- somente `DIRETOR_PATRIMONIO` confirma disponibilidade e executa depreciação;
- criar `POST /api/patrimonios/:patrimonioId/disponibilidade-uso`, protegido
  pelos contratos de idempotência existentes;
- rejeitar data futura, bem baixado, confirmação duplicada e mudança
  concorrente, sem registro ou parâmetro parcial;
- disponibilidade de patrimônio depreciável define `dataInicio` do parâmetro
  vigente e deriva a primeira competência como o mês seguinte; em patrimônio
  não depreciável,
  registra somente o fato operacional;
- reavaliação de bem ainda indisponível mantém `dataInicio = null`; reavaliação
  de bem disponível inicia o novo parâmetro na data de referência aprovada;
- substituir a limitação ao mês corrente por competência selecionada entre a
  primeira devida e a corrente, sempre em `America/Sao_Paulo`;
- determinar por parâmetro a próxima competência esperada a partir de
  disponibilidade/início e históricos existentes, sem confiar em quantidade ou
  lista enviada pelo cliente;
- impedir lacunas: item com competência anterior pendente não pode receber mês
  posterior; execução em massa classifica esse item sem gravá-lo;
- permitir regularização mês a mês, preservando quota, vida restante,
  residual, locks, unicidade, atomicidade e respostas finitas de
  `DEPRECIACOES-001`;
- reavaliação exige que não exista competência anterior devida para o parâmetro
  encerrado; não encerrar um parâmetro deixando pendências inalcançáveis;
- criar `GET /api/depreciacoes/competencias` e
  `GET /api/depreciacoes/pendencias/resumo`, ambos finitos e restritos ao
  `DIRETOR_PATRIMONIO`;
- criar `GET /api/relatorios/pendencias-depreciacao` e
  `GET /api/relatorios/pendencias-depreciacao/pdf` no módulo de relatórios,
  separados dos lançamentos realizados e acessíveis a `ADMINISTRADOR` e
  `DIRETOR_PATRIMONIO`, como os relatórios existentes;
- não criar tabela de notificação, scheduler, cron ou processamento automático.

### Seed geral

- atualizar a matriz, payloads, módulos importados, testes, auditoria final e
  constantes de preflight afetadas pela nova migration;
- preservar a matriz de patrimônios depreciáveis com parâmetros e não
  depreciáveis sem parâmetros entregue por `CONTRACTS-018`;
- confirmar disponibilidade pela operação pública/service de domínio em parte
  dos patrimônios e manter parte deles sem disponibilidade para exercitar os
  estados de espera;
- usar datas determinísticas que produzam competências devidas passadas e
  corrente sem executar depreciações no seed;
- preservar massa variada e coerente, banco vazio obrigatório, segurança de
  ambiente, idempotência e segunda execução recusada;
- manter baixas, depreciações e reavaliações zeradas no cenário final; a
  auditoria deve validar as novas distribuições, não apenas contagens totais.

## Fora do escopo

- migração ou reconciliação de dados de produção existentes;
- editar migrations aplicadas ou popular banco do usuário durante validação;
- fração diária, competência futura, quota única para vários meses ou execução
  automática;
- correção/estorno de disponibilidade ou depreciação;
- definir o tratamento contábil da competência da própria baixa ocorrida no
  meio do mês; as competências anteriores já devidas permanecem visíveis e não
  devem ser apagadas;
- caixa persistente, e-mail, push ou marcação lido/não lido.

## Decisões aprovadas

- Não há legado de produção a preservar. A migration deve ser correta desde
  banco vazio e sobre o schema anterior sem dados de domínio.
- Disponibilidade é única, imutável e auditável.
- A primeira quota integral pertence ao mês seguinte à disponibilidade.
- Competências passadas devidas são processáveis, mas sempre uma a uma e em
  ordem; nunca há catch-up silencioso em valor agregado.
- Manutenção, empréstimo e ociosidade não suspendem a depreciação linear.
- Pendência é calculada do estado contábil; não é materializada como
  notificação.

## Critérios de aceite

- [ ] banco recusa valores, datas, relações e históricos estruturalmente
      inconsistentes mesmo fora do controller;
- [ ] bem sem disponibilidade nunca é elegível;
- [ ] patrimônio não depreciável nunca recebe parâmetro ou depreciação;
- [ ] disponibilidade duplicada ou concorrente produz um único fato e nenhum
      parâmetro parcial;
- [ ] primeira competência é exatamente o mês seguinte à disponibilidade;
- [ ] abril pendente impede maio para o mesmo parâmetro; após abril, maio se
      torna processável;
- [ ] competência futura e anterior à primeira devida falham sem escrita;
- [ ] reavaliação não encerra parâmetro com competência anterior pendente;
- [ ] execução individual versus massa e duas massas concorrentes não criam
      duplicidade, lacuna ou atualização perdida;
- [ ] relatório tabular, PDF, catálogo de competências e resumo usam queries
      finitas, sem N+1, e respeitam seus perfis de acesso;
- [ ] seed contém bens disponíveis e indisponíveis, depreciáveis e não
      depreciáveis, sem lançar depreciação;
- [ ] migration passa desde banco vazio e sobre o schema anterior descartável;
- [ ] contratos, database, API, Web e mobile passam nas verificações aplicáveis.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma` e nova migration;
- `packages/contracts/src/patrimonio/`, `depreciacao-patrimonio/` e
  `relatorio-patrimonial/`;
- `apps/api/src/modules/patrimonios/`, `depreciacoes/`, `reavaliacoes/` e
  `relatorios/`;
- `apps/api/src/commands/seed-geral/`, testes E2E e PostgreSQL;
- `docs/apps/api/README.md`, `docs/apps/api/relatorios-patrimoniais.md`,
  roadmaps e esta tarefa somente após verificação.

## Verificações esperadas

- lint, typecheck e testes de `@repo/contracts` e `@repo/database`;
- geração do Prisma Client e `prisma migrate status` antes da migration;
- aplicação desde banco vazio e sobre schema anterior descartável;
- testes PostgreSQL de cada constraint/trigger, concorrência, rollback, ordem e
  `EXPLAIN` com volume representativo;
- lint, typecheck, testes e build de `@repo/api`;
- testes focados e execução isolada do seed em banco e storage descartáveis;
- typecheck de Web e mobile;
- Prettier e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma. Se a implementação precisar tratar depreciação no próprio mês de
  uma baixa, deve retornar ao planejamento; essa política não foi definida
  nesta tarefa.
