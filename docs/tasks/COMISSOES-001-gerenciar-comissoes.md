# `COMISSOES-001` — Gerenciar comissões

**Status:** `aprovada`

## Objetivo

Implementar persistência e API administrativa para cadastrar, consultar e
alterar comissões e gerenciar seus integrantes, preservando as características
históricas após o primeiro uso patrimonial.

## Contexto e referências

- Roadmap: [COMISSOES-001](../roadmap.md#comissoes-001--gerenciar-comissões).
- Contratos: [CONTRACTS-007](./CONTRACTS-007-contratos-comissoes.md).
- Dependências: [RESPONSAVEIS-001](./RESPONSAVEIS-001-gerenciar-responsaveis.md)
  e `SEC-001` em [segurança e acesso](../security-and-access.md).
- Requisitos: [RF03](../requisitos-SIPAT.md#rf03-gestão-de-responsáveis),
  [RF05](../requisitos-SIPAT.md#rf05-gestão-de-comissões),
  [UC05](../requisitos-SIPAT.md#uc05---gerenciar-comissões), RN11, RNF03,
  RNF05 e RNF06.
- API: [índice](../apps/api/README.md),
  [repositories](../apps/api/repositories.md),
  [services](../apps/api/services.md),
  [controllers](../apps/api/controllers.md),
  [módulos](../apps/api/modules.md) e
  [workflow e testes](../apps/api/workflow-and-testing.md).
- Performance: [banco](../performance/database.md) e
  [API](../apps/api/performance.md).
- Referências oficiais: [transações do Prisma ORM](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions),
  [índices no Prisma](https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes)
  e [índices do PostgreSQL](https://www.postgresql.org/docs/current/indexes.html).

## Escopo

### Persistência

- alterar `Comissao.numeroAto` de `DateTime? @db.Date` para
  `String? @db.VarChar(100)` e criar migration que preserve eventual valor
  existente por conversão explícita, sem reescrever a migration inicial já
  aplicada;
- tornar `MembroComissao.tipoMembroComissao` obrigatório; a migration deve
  detectar dados nulos existentes e falhar com diagnóstico em vez de escolher
  silenciosamente um papel;
- preservar a unicidade existente de `(comissaoId, responsavelId)`;
- habilitar `partialIndexes` no generator Prisma e garantir no schema e no
  PostgreSQL no máximo um `PRESIDENTE` por comissão com índice único parcial
  sobre `comissaoId`, seguindo a documentação oficial da versão instalada;
- adicionar somente os índices justificados pelas queries reais de listagem,
  vigência e detecção de uso, conferindo o plano quando necessário;
- gerar o Prisma Client depois da alteração do schema.

### API

- criar `apps/api/src/modules/comissoes/` com DTOs Zod, controller, service,
  repository, types, mappers, module e testes, seguindo o corte existente;
- registrar `ComissoesModule` no `AppModule` e importar somente os módulos dos
  services externos necessários;
- expor, somente para `ADMINISTRADOR`:
  - `GET /api/comissoes`;
  - `GET /api/comissoes/:comissaoId`;
  - `POST /api/comissoes`;
  - `PATCH /api/comissoes/:comissaoId`;
  - `POST /api/comissoes/:comissaoId/membros`;
  - `PATCH /api/comissoes/:comissaoId/membros/:membroComissaoId`;
  - `DELETE /api/comissoes/:comissaoId/membros/:membroComissaoId`;
- criar comissão e zero a 50 integrantes como uma única operação atômica;
- validar no service que todos os responsáveis informados existem e estão
  ativos antes de criar um novo vínculo;
- impedir que adições posteriores elevem a comissão acima de 50 integrantes;
- enquanto a comissão não tiver sido utilizada, permitir remover qualquer
  vínculo existente; para alterar papel, exigir que o vínculo pertença à
  comissão e que o responsável ainda esteja ativo;
- tratar conflitos da unicidade de responsável e presidente com códigos
  públicos estáveis, inclusive quando duas requisições concorrentes tentarem
  criar presidentes;
- considerar vigente a comissão cuja data de referência civil esteja entre
  `dataVigenciaInicio` e `dataVigenciaFim`, inclusive;
- exportar no service uma operação interna que receba `comissaoId` e uma data
  civil de referência e devolva somente uma comissão existente e vigente, para
  reutilização pelos módulos patrimoniais futuros sem duplicar a regra;
- detectar uso por qualquer relação patrimonial existente de `Comissao` sem
  carregar coleções completas;
- antes do primeiro uso, permitir alterar nome, descrição, número do ato, datas
  e integrantes; depois do primeiro uso, permitir somente nome e descrição e
  rejeitar as demais tentativas de forma estável;
- preservar vínculos existentes se um responsável for inativado posteriormente;
- derivar `createdById` da sessão e nunca do body;
- paginar e ordenar a listagem de forma determinística, selecionar apenas os
  campos necessários e evitar N+1 ao montar resumo e detalhe.

## Fora do escopo

- exclusão física ou inativação de comissão;
- alterar o responsável de um vínculo existente;
- remover automaticamente integrante cujo responsável seja inativado;
- implementar transferências, reavaliações, empréstimos, devoluções,
  manutenções, inventários, baixas ou depreciações;
- Web e mobile.

## Decisões aprovadas

- comissão pode existir sem integrantes e sem presidente;
- a comissão possui no máximo 50 integrantes no total e cada responsável
  aparece uma única vez por comissão;
- somente responsável ativo entra em novo vínculo;
- pode existir no máximo um presidente, com garantia de banco além da validação
  do service;
- alteração de integrante modifica somente `PRESIDENTE | MEMBRO`;
- vigência é inclusiva nas duas datas civis;
- `numeroAto` é texto opcional;
- qualquer uso patrimonial congela número do ato, vigência e composição;
  somente nome e descrição continuam editáveis.

## Matriz de acesso

| Rotas                                   | Pública | Perfil          | Regra de recurso                                       |
| --------------------------------------- | ------- | --------------- | ------------------------------------------------------ |
| `GET /api/comissoes[/:comissaoId]`      | não     | `ADMINISTRADOR` | comissão existente                                     |
| `POST /api/comissoes`                   | não     | `ADMINISTRADOR` | responsáveis informados ativos                         |
| `PATCH /api/comissoes/:comissaoId`      | não     | `ADMINISTRADOR` | após uso, somente nome e descrição                     |
| `POST /api/comissoes/:id/membros`       | não     | `ADMINISTRADOR` | responsável ativo, não repetido e presidente único     |
| `PATCH /api/comissoes/:id/membros/:id`  | não     | `ADMINISTRADOR` | vínculo da comissão, responsável ativo e não utilizada |
| `DELETE /api/comissoes/:id/membros/:id` | não     | `ADMINISTRADOR` | vínculo da comissão e comissão ainda não utilizada     |

Todas as mutações usam a proteção CSRF global existente. Usuário anônimo recebe
`401` e `DIRETOR_PATRIMONIO` recebe `403`.

## Critérios de aceite

- [ ] migration parte do estado atual, preserva valores convertíveis de
      `numero_ato` e aplica todas as constraints desde banco vazio;
- [ ] criação vazia funciona e uma falha entre até 50 integrantes desfaz a
      comissão inteira;
- [ ] responsável inexistente, inativo ou repetido não cria vínculo;
- [ ] adições individuais não permitem ultrapassar 50 integrantes;
- [ ] a API nunca persiste dois presidentes na mesma comissão, inclusive sob
      concorrência real no PostgreSQL;
- [ ] alteração de papel não troca o responsável e remoção não apaga o cadastro
      do responsável;
- [ ] datas invertidas são rejeitadas e os dias inicial e final contam como
      vigentes;
- [ ] após qualquer uso patrimonial, número do ato, datas e integrantes ficam
      imutáveis, enquanto nome e descrição continuam editáveis;
- [ ] listagem e detalhe usam responses por allowlist, paginação finita e
      queries sem N+1;
- [ ] autorização, CSRF, auditoria e conflitos possuem cobertura;
- [ ] documentação de estado só é marcada como concluída após todas as
      verificações correspondentes.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma`;
- nova migration em `packages/database/prisma/migrations/`;
- `packages/contracts/src/comissao/` entregue por `CONTRACTS-007`;
- `apps/api/src/modules/comissoes/`;
- `apps/api/src/app.module.ts`;
- testes unitários, E2E e de integração PostgreSQL do domínio;
- `docs/apps/api/README.md`, `docs/roadmap.md`, `docs/contracts/roadmap.md` e
  esta tarefa depois da verificação.

## Verificações esperadas

- `pnpm --filter @repo/database db:generate`;
- lint e typecheck de `@repo/database`;
- lint, typecheck e testes de `@repo/contracts`;
- lint, typecheck, testes e build de `@repo/api`;
- aplicar todas as migrations desde banco PostgreSQL vazio;
- testes PostgreSQL opt-in para conversão de `numero_ato`, constraints,
  atomicidade, bloqueio pós-uso e corrida entre dois presidentes;
- E2E com Guards reais para `401`, `403`, CSRF, CRUD e conflitos;
- typecheck de Web e mobile como consumidores de `@repo/contracts`, sem
  implementar funcionalidade neles;
- Prettier nos arquivos alterados e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
