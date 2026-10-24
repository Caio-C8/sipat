# `INVENTARIOS-002` — Conferir, corrigir e finalizar inventários

**Status:** `aprovada`

## Objetivo

Implementar na API o ciclo operacional do inventário, com uma conferência de
setor por vez, classificação dos itens, correção rastreável de divergências,
tratamento explícito de leituras repetidas e garantias de concorrência.

## Contexto e referências

- Roadmap: [INVENTARIOS-002](../roadmap.md#inventarios-002--conferir-corrigir-e-finalizar-inventários).
- Contratos: [CONTRACTS-008](./CONTRACTS-008-contratos-inventarios.md).
- Dependência: [INVENTARIOS-001](./INVENTARIOS-001-criar-consultar-inventarios.md).
- Requisitos: [RF13](../requisitos-SIPAT.md#rf13-transferência-de-patrimônios),
  [RF19](../requisitos-SIPAT.md#rf19-inventário-patrimonial),
  [UC19](../requisitos-SIPAT.md#uc19---realizar-inventário-patrimonial), RN08,
  RN09, RN10, RN11, RN19, RNF05, RNF06, RNF10 e RNF11.
- API e performance: [índice](../apps/api/README.md),
  [services](../apps/api/services.md),
  [repositories](../apps/api/repositories.md),
  [workflow e testes](../apps/api/workflow-and-testing.md),
  [banco](../performance/database.md) e
  [API](../apps/api/performance.md).
- Referências oficiais: [transações e isolamento no Prisma ORM](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions),
  [isolamento no PostgreSQL](https://www.postgresql.org/docs/current/transaction-iso.html)
  e [bloqueio explícito no PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html).

## Escopo

### Ciclo do setor e do inventário

- expor somente para `DIRETOR_PATRIMONIO`:
  - `POST /api/inventarios/:inventarioId/setores/:setorInventarioId/iniciar`;
  - `POST /api/inventarios/:inventarioId/setores/:setorInventarioId/verificacoes`;
  - `POST /api/inventarios/:inventarioId/itens/:itemInventarioId/correcoes`;
  - `POST /api/inventarios/:inventarioId/setores/:setorInventarioId/concluir`;
  - `POST /api/inventarios/:inventarioId/finalizar`;
- ao iniciar o primeiro setor, marcar inventário EM_ANDAMENTO e preencher sua
  data e usuário de início; inícios posteriores não alteram esses campos;
- permitir somente um setor EM_ANDAMENTO por inventário e impedir duas
  conferências simultâneas do mesmo setor mesmo entre inventários;
- permitir concluir somente setor EM_ANDAMENTO e finalizar somente inventário
  EM_ANDAMENTO cujos setores estejam todos CONCLUIDOS;
- permitir finalização com correções pendentes apenas quando o body confirmar
  explicitamente essa condição;
- ao finalizar, registrar data e usuário e tornar inventário, setores, itens e
  correções imutáveis.

### Verificação e encerramento

- receber `numeroPatrimonial` canônico e localizar um patrimônio pertencente à
  população fixa do inventário;
- exigir que o setor informado pertença ao inventário e esteja EM_ANDAMENTO;
- quando o setor esperado for o setor em conferência, registrar CORRETO,
  VERIFICADO, data, usuário e o status patrimonial observado, mantendo correção
  nula;
- quando forem diferentes, preservar o setor esperado, registrar o setor
  encontrado e definir DIVERGENCIA, VERIFICADO, correção PENDENTE, data e
  usuário;
- tratar nova leitura no mesmo setor como idempotente, devolvendo o estado
  consolidado sem alterar data ou auditoria;
- se o item já tiver sido verificado em outro setor, não sobrescrever nem criar
  outro item: devolver conflito com o primeiro setor e instante de verificação;
- diferenciar no conflito uma transferência registrada depois da primeira
  verificação de uma localização física sem movimentação correspondente;
- na conclusão, atualizar em lote os itens PENDENTES daquele setor para
  NAO_LOCALIZADO e VERIFICADO, com a mesma data e usuário da conclusão, e marcar
  o setor CONCLUIDO na mesma transação;
- para cada item encerrado como NAO_LOCALIZADO, salvar o
  `statusPatrimonioNaVerificacao`; quando ele for EMPRESTADO ou EM_MANUTENCAO,
  vincular respectivamente o empréstimo ou item de manutenção vigente naquele
  instante;
- tratar patrimônio ATIVO sem operação justificadora como ausência não
  explicada, sem confundi-lo com os não localizados por empréstimo ou manutenção;
- liberar o bloqueio operacional do setor somente depois do commit da conclusão.

### Correções

- aceitar correção somente de item DIVERGENCIA com correção PENDENTE e enquanto
  o inventário não estiver FINALIZADO;
- em `RETORNO_AO_SETOR_CADASTRADO`, confirmar que o cadastro ainda aponta para o
  setor esperado, registrar tipo, status CORRIGIDO, data e usuário, sem criar
  transferência;
- em `TRANSFERENCIA_CADASTRAL`, criar `TransferenciaPatrimonio` do setor
  esperado para o encontrado, usando comissão do inventário, data e usuário do
  servidor; atualizar `Patrimonio.setorAtualId` e vincular a transferência ao
  item na mesma transação;
- manter `situacao = DIVERGENCIA` após qualquer correção para preservar o fato
  histórico;
- rejeitar correção repetida, setor encontrado ausente, estado cadastral que
  mudou concorrentemente ou combinação incompatível sem escrita parcial.

### Coordenação com outras operações

- centralizar no domínio de inventários uma política interna reutilizável que
  informe se uma operação pode alterar localização ou elegibilidade de um
  patrimônio ou usar um setor como origem/destino;
- bloquear essas operações quando afetarem o setor EM_ANDAMENTO; os demais
  setores continuam operando;
- permitir que um setor inicie mesmo quando possua patrimônio já EMPRESTADO ou
  EM_MANUTENCAO e bloquear novas mudanças de status desses itens enquanto a
  conferência estiver em andamento;
- antes do início da conferência de um setor, uma movimentação registrada deve
  atualizar, na mesma transação, `setorEsperadoId` e `setorInventarioId` do item
  ainda PENDENTE para que uma movimentação legítima não vire falsa divergência;
- nunca mover ou reabrir automaticamente item já VERIFICADO;
- bloquear movimentação para setor que não pertença à população fixa do
  inventário enquanto ele não estiver FINALIZADO;
- bloquear, até a finalização do inventário, a baixa de qualquer patrimônio
  incluído e a inativação de qualquer setor participante;
- aplicar imediatamente a regra aos módulos existentes que possam inativar
  setor ou alterar diretamente estado/localização; módulos patrimoniais ainda
  inexistentes devem declarar esta tarefa como dependência quando forem criados.

### Concorrência

- manter curtas as transações e usar isolamento `Serializable`, locks de linha
  ou combinação equivalente comprovada no PostgreSQL para as transições;
- tratar `P2034` com retry pequeno e finito somente nas operações idempotentes
  ou protegidas por pré-condição, conforme a documentação oficial do Prisma;
- duas tentativas concorrentes de iniciar setores deixam somente uma em
  andamento e retornam conflito estável à outra;
- duas leituras concorrentes do mesmo item consolidam apenas uma gravação; a
  segunda devolve o estado existente se for o mesmo setor ou conflito se for
  outro;
- conclusão concorrente com leitura ou correção não pode aceitar escrita depois
  do setor CONCLUIDO nem perder uma escrita confirmada antes do encerramento;
- finalização concorrente com correção não pode produzir alteração posterior ao
  inventário FINALIZADO.

## Fora do escopo

- reabrir setor, item ou inventário finalizado;
- cancelar ou excluir inventário;
- alterar manualmente `NAO_LOCALIZADO` depois da conclusão do setor;
- implementar as APIs gerais de transferência, empréstimo, devolução,
  manutenção ou baixa ainda inexistentes;
- registrar mais de uma ocorrência do mesmo patrimônio no inventário;
- fila offline, scanner, câmera, Web ou mobile.

## Decisões aprovadas

- somente um setor por inventário fica EM_ANDAMENTO; a mesma unidade física não
  pode ser conferida simultaneamente por inventários diferentes;
- o bloqueio operacional é por setor em conferência, não por inventário inteiro;
- operações em setores não bloqueados permanecem permitidas e sincronizam itens
  ainda pendentes;
- empréstimo ou manutenção vigente não impede iniciar o setor; a ausência fica
  registrada como NAO_LOCALIZADO junto ao snapshot e ao vínculo que a explica;
- baixa de patrimônio incluído e inativação de setor participante permanecem
  bloqueadas até a finalização;
- item já verificado nunca é silenciosamente ignorado nem sobrescrito;
- transferência posterior à primeira verificação explica a nova localização,
  mas não cria uma segunda conferência;
- localização posterior sem movimentação registrada permanece conflito
  operacional explícito, sem sobrescrever o item nem bloquear sozinha a
  conclusão ou a finalização;
- `NAO_LOCALIZADO` possui verificação encerrada na data de conclusão do setor;
- correção pendente pode sobreviver à conclusão do setor, mas nenhuma correção é
  permitida depois da finalização do inventário;
- o inventário pode ser finalizado com correções pendentes mediante confirmação,
  preservando-as como resultado histórico não resolvido.

## Matriz de acesso

| Operação             | Pública | Perfil               | Estado exigido              |
| -------------------- | ------- | -------------------- | --------------------------- |
| iniciar setor        | não     | `DIRETOR_PATRIMONIO` | inventário não finalizado   |
| verificar item       | não     | `DIRETOR_PATRIMONIO` | setor EM_ANDAMENTO          |
| corrigir divergência | não     | `DIRETOR_PATRIMONIO` | inventário não finalizado   |
| concluir setor       | não     | `DIRETOR_PATRIMONIO` | setor EM_ANDAMENTO          |
| finalizar inventário | não     | `DIRETOR_PATRIMONIO` | todos os setores CONCLUIDOS |

Todas as mutações usam a proteção CSRF global existente. Usuário anônimo recebe
`401` e `ADMINISTRADOR` recebe `403`.

## Critérios de aceite

- [ ] transições válidas preenchem status, datas e usuários no mesmo commit;
- [ ] nunca existem dois setores EM_ANDAMENTO no mesmo inventário nem duas
      conferências ativas do mesmo setor físico;
- [ ] item correto, divergente e não localizado produz exatamente os estados
      aprovados;
- [ ] item não localizado preserva o status cadastral do instante e diferencia
      ausência sem justificativa, empréstimo vigente e manutenção vigente;
- [ ] retorno físico não cria transferência; transferência cadastral cria
      histórico, atualiza o patrimônio e vincula o item atomicamente;
- [ ] conclusão classifica todos os pendentes sem deixar item do setor em estado
      incompatível;
- [ ] finalização exige todos os setores concluídos, confirma pendências e
      bloqueia mutações posteriores;
- [ ] operações concorrentes possuem testes PostgreSQL reais para cada corrida
      descrita no escopo;
- [ ] bloqueios e sincronização de movimentações possuem códigos públicos
      estáveis e testes de integração nos consumidores existentes;
- [ ] autorização, CSRF, auditoria, idempotência e conflitos possuem E2E com
      Guards reais;
- [ ] queries críticas são finitas, indexadas e sem N+1;
- [ ] documentação de estado só é marcada como concluída após todas as
      verificações correspondentes.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma` e migration de `INVENTARIOS-001`;
- `packages/contracts/src/inventario/` entregue por `CONTRACTS-008`;
- `apps/api/src/modules/inventarios/`;
- `apps/api/src/modules/setores/` para o bloqueio de inativação aplicável;
- `apps/api/src/app.module.ts`;
- testes unitários, E2E e de integração PostgreSQL do domínio;
- futuros módulos de transferências, empréstimos, devoluções, manutenções e
  baixas deverão referenciar esta tarefa ao implementar sua integração;
- `docs/apps/api/README.md`, `docs/roadmap.md` e esta tarefa após verificação.

## Verificações esperadas

- `pnpm --filter @repo/database db:generate`;
- lint e typecheck de `@repo/database`;
- lint, typecheck e testes de `@repo/contracts`;
- lint, typecheck, testes e build de `@repo/api`;
- aplicar todas as migrations desde PostgreSQL vazio;
- testes PostgreSQL opt-in para locks, isolamento, retry finito, início
  simultâneo, leitura duplicada, conclusão versus leitura e finalização versus
  correção;
- E2E com Guards reais para `401`, `403`, CSRF, transições, idempotência,
  correções e conflitos;
- typecheck de Web e mobile apenas como consumidores dos exports;
- Prettier nos arquivos alterados e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
