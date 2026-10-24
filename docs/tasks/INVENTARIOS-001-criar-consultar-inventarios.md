# `INVENTARIOS-001` — Criar e consultar inventários

**Status:** `aprovada`

## Objetivo

Implementar a persistência e as operações da API que cadastram um inventário e
materializam, de forma atômica, o conjunto inicial de setores ativos e
patrimônios ATIVOS a conferir, além das consultas paginadas do resultado.

## Contexto e referências

- Roadmap: [INVENTARIOS-001](../roadmap.md#inventarios-001--criar-e-consultar-inventários).
- Contratos: [CONTRACTS-008](./CONTRACTS-008-contratos-inventarios.md).
- Dependências: [COMISSOES-001](./COMISSOES-001-gerenciar-comissoes.md),
  [SETORES-001](./SETORES-001-gerenciar-setores.md),
  [PATRIMONIOS-001](./PATRIMONIOS-001-cadastrar-patrimonios.md) e
  [PATRIMONIOS-002](./PATRIMONIOS-002-consultar-patrimonios.md).
- Requisitos: [RF19](../requisitos-SIPAT.md#rf19-inventário-patrimonial),
  [UC19](../requisitos-SIPAT.md#uc19---realizar-inventário-patrimonial), RN08,
  RN11, RN19, RNF05, RNF06, RNF10 e RNF11.
- API: [índice](../apps/api/README.md),
  [repositories](../apps/api/repositories.md),
  [services](../apps/api/services.md),
  [controllers](../apps/api/controllers.md),
  [módulos](../apps/api/modules.md) e
  [workflow e testes](../apps/api/workflow-and-testing.md).
- Performance: [banco](../performance/database.md) e
  [API](../apps/api/performance.md).
- Referências oficiais: [transações do Prisma ORM](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions)
  e [índices do PostgreSQL](https://www.postgresql.org/docs/current/indexes.html).

## Escopo

### Persistência

- revisar os models existentes `Inventario`, `SetorInventario` e
  `ItemInventario` e criar uma migration nova, sem reescrever migrations já
  aplicadas;
- manter `ItemInventario` como nome do model e a unicidade já existente de
  `(inventarioId, patrimonioId)` e `(inventarioId, setorId)`;
- adicionar os campos de auditoria necessários para identificar quem inicia e
  finaliza o inventário, quem inicia e conclui um setor e quem verifica e
  corrige um item, sem aceitar esses identificadores nos bodies públicos;
- adicionar a `ItemInventario` o snapshot opcional
  `statusPatrimonioNaVerificacao` e referências opcionais ao
  `EmprestimoPatrimonio` ou `ItemManutencao` vigente, com garantias de banco ou
  transacionais que impeçam vínculos incompatíveis entre si ou com o patrimônio
  do item;
- garantir por constraint ou índice parcial compatível com PostgreSQL que um
  inventário não possua dois setores EM_ANDAMENTO e que o mesmo setor físico
  não fique em conferência simultânea em inventários diferentes;
- criar índices somente para as consultas reais por status, inventário, setor,
  patrimônio e pendências, conferindo planos quando o volume justificar;
- gerar o Prisma Client depois da alteração do schema.

### API

- criar `apps/api/src/modules/inventarios/` com DTOs Zod, controller, service,
  repository, types, mappers, module e testes, seguindo o corte existente;
- registrar `InventariosModule` no `AppModule` e reutilizar a operação interna
  de comissão vigente entregue por `COMISSOES-001`;
- expor somente para `DIRETOR_PATRIMONIO`:
  - `GET /api/inventarios`;
  - `GET /api/inventarios/:inventarioId`;
  - `GET /api/inventarios/:inventarioId/setores`;
  - `GET /api/inventarios/:inventarioId/itens`;
  - `POST /api/inventarios`;
- na criação, validar comissão existente e vigente na data civil da operação;
- carregar somente setores ativos e patrimônios ATIVOS existentes dentro da
  mesma transação que cria o inventário;
- criar um `SetorInventario` PENDENTE, sem datas, para cada setor ativo;
- criar um `ItemInventario` PENDENTE para cada patrimônio ATIVO, com situação,
  datas e correções nulas, `setorEsperadoId` igual ao setor atual e vínculo com
  o `SetorInventario` correspondente;
- rejeitar a criação quando não existir setor ativo; aceitar setores sem itens e
  inventário sem patrimônios quando ao menos um setor ativo existir;
- derivar `createdById`, status e datas no servidor e não devolver coleções sem
  limite;
- listar e detalhar com seleção mínima, ordenação determinística, paginação e
  agregados obtidos sem N+1.

## Fora do escopo

- iniciar ou concluir setor, verificar item, corrigir divergência ou finalizar
  inventário, entregues por `INVENTARIOS-002`;
- criar, alterar, inativar ou excluir setores, patrimônios ou comissões;
- alterar o conjunto de patrimônios incluídos depois da criação;
- exclusão, cancelamento ou edição genérica de inventário;
- transferências, empréstimos, devoluções, manutenções e baixas;
- Web e mobile.

## Decisões aprovadas

- a população do inventário é fixada na criação: novos patrimônios não entram e
  patrimônios não são removidos posteriormente;
- somente setores ativos e patrimônios ATIVOS entram nessa população;
- todos os estados e datas operacionais começam pendentes ou nulos;
- status patrimonial e vínculos justificadores começam nulos e tornam-se
  imutáveis quando a verificação do item é consolidada;
- mudanças de localização registradas antes da conferência do respectivo setor
  podem atualizar somente o setor esperado e o vínculo do item ainda pendente,
  conforme a política de `INVENTARIOS-002`;
- datas do inventário são civis; eventos de setor, verificação e correção usam
  timestamp;
- a consulta detalhada apresenta agregados, mas itens e setores permanecem em
  recursos paginados.

## Matriz de acesso

| Rotas                                        | Pública | Perfil               |
| -------------------------------------------- | ------- | -------------------- |
| `GET /api/inventarios[/:inventarioId]`       | não     | `DIRETOR_PATRIMONIO` |
| `GET /api/inventarios/:inventarioId/setores` | não     | `DIRETOR_PATRIMONIO` |
| `GET /api/inventarios/:inventarioId/itens`   | não     | `DIRETOR_PATRIMONIO` |
| `POST /api/inventarios`                      | não     | `DIRETOR_PATRIMONIO` |

Todas as mutações usam a proteção CSRF global existente. Usuário anônimo recebe
`401` e `ADMINISTRADOR` recebe `403`.

## Critérios de aceite

- [ ] migration aplica desde banco vazio e sobre o estado atual sem apagar
      histórico;
- [ ] criação gera inventário, setores e itens na mesma transação e qualquer
      falha desfaz o conjunto inteiro;
- [ ] somente setores ativos e patrimônios ATIVOS do instante da criação entram
      no inventário;
- [ ] todos os itens começam com o setor esperado correto e campos operacionais
      pendentes ou nulos;
- [ ] comissão inexistente, fora de vigência ou criação sem setor ativo falha
      sem persistência parcial;
- [ ] concorrência não cria setores ou itens duplicados nem snapshots parciais;
- [ ] listagens são finitas, determinísticas, sem N+1 e não expõem models Prisma;
- [ ] autorização, CSRF, auditoria, erros e limites possuem cobertura;
- [ ] documentação de estado só é marcada como concluída após todas as
      verificações correspondentes.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma`;
- nova migration em `packages/database/prisma/migrations/`;
- `packages/database/src/index.ts` e `packages/database/src/types.ts` se os
  novos campos gerados exigirem ajuste de exports;
- `packages/contracts/src/inventario/` entregue por `CONTRACTS-008`;
- `apps/api/src/modules/inventarios/`;
- `apps/api/src/app.module.ts`;
- testes unitários, E2E e de integração PostgreSQL do domínio;
- `docs/apps/api/README.md`, `docs/roadmap.md`, `docs/contracts/roadmap.md` e
  esta tarefa depois da verificação.

## Verificações esperadas

- `pnpm --filter @repo/database db:generate`;
- lint e typecheck de `@repo/database`;
- lint, typecheck e testes de `@repo/contracts`;
- lint, typecheck, testes e build de `@repo/api`;
- aplicar todas as migrations desde PostgreSQL vazio e sobre snapshot do estado
  anterior à nova migration;
- testes PostgreSQL opt-in para atomicidade, constraints e criação concorrente;
- E2E com Guards reais para `401`, `403`, CSRF, criação e consultas;
- typecheck de Web e mobile apenas como consumidores dos exports, sem implementar
  interfaces;
- Prettier nos arquivos alterados e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
