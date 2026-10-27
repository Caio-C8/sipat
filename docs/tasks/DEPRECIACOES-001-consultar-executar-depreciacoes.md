# `DEPRECIACOES-001` — Consultar e executar depreciações

**Status:** aprovada

## Objetivo

Implementar no banco e na API a consulta de patrimônios pendentes e a
depreciação linear, individual ou de todo o acervo elegível, limitada à
competência corrente e executada atomicamente.

## Contexto e referências

- Roadmap: [DEPRECIACOES-001](../roadmap.md#depreciacoes-001--consultar-e-executar-depreciações-na-api).
- Dependência: [CONTRACTS-011](./CONTRACTS-011-contratos-depreciacoes-patrimoniais.md),
  que deve estar concluído e verificado antes desta tarefa.
- Requisitos: [RF15](../requisitos-SIPAT.md#rf15-depreciação-automática-de-patrimônios),
  RNF10, RNF11, RN01, RN02, RN03, RN14 e UC15.
- Estado relacionado: [PATRIMONIOS-001](./PATRIMONIOS-001-cadastrar-patrimonios.md)
  e [COMISSOES-001](./COMISSOES-001-gerenciar-comissoes.md).
- API: [índice](../apps/api/README.md),
  [repositories](../apps/api/repositories.md),
  [services](../apps/api/services.md),
  [controllers](../apps/api/controllers.md),
  [módulos](../apps/api/modules.md) e
  [workflow e testes](../apps/api/workflow-and-testing.md).
- Segurança: [decisões transversais](../security-and-access.md) e
  [segurança da API](../apps/api/security/README.md).
- Performance: [banco](../performance/database.md) e
  [API](../apps/api/performance.md).
- Referências oficiais: [MCASP 11ª edição, itens 11.5.1 a 11.5.3](https://cdn.tesouro.gov.br/sistemas-internos/apex/producao/sistemas/thot/arquivos/publicacoes/51045_2434252/MCASP%20-%2011%C2%AA%20Edi%C3%A7%C3%A3o.pdf),
  [transações do Prisma ORM 7](https://www.prisma.io/docs/orm/v7/prisma-client/queries/transactions),
  [raw queries tipadas do Prisma ORM 7](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries),
  [locks explícitos do PostgreSQL](https://www.postgresql.org/docs/current/explicit-locking.html)
  e [tipos numéricos do PostgreSQL](https://www.postgresql.org/docs/current/datatype-numeric.html).

## Ordem de execução

1. Confirmar branch, worktree, `CONTRACTS-011` concluído, schema, migrations e
   volume representativo do acervo.
2. Auditar dados existentes: uma situação contábil por patrimônio, no máximo
   um parâmetro com `dataFim = null`, valores dentro do residual e ausência de
   duplicidades de competência.
3. Definir as queries reais da listagem, classificação e mutação; adicionar
   somente índices comprovadamente necessários em migration nova.
4. Gerar o Prisma Client depois de qualquer alteração do schema.
5. Criar `DepreciacoesModule` com DTOs, tipos, repository, service, mapper e
   controller, reutilizando `ComissoesService`.
6. Implementar a consulta paginada e seus agregados sem N+1.
7. Implementar o cálculo decimal puro e cobri-lo com testes de limites e
   arredondamento.
8. Implementar execuções individual e em massa com locks em ordem estável,
   revalidação e uma transação curta por solicitação.
9. Registrar o módulo no `AppModule` e aplicar autenticação, autorização,
   CSRF, responses e erros existentes.
10. Cobrir unidade, E2E, migration e concorrência em PostgreSQL real.
11. Medir o caminho em massa com volume representativo e conferir queries e
    planos antes de considerar a tarefa concluída.
12. Executar lint, tipos, testes, build e verificções transversais; atualizar
    estado documental somente depois das evidências.

## Escopo

### Persistência e cálculo

- preservar `SituacaoContabilPatrimonio`, `ParametroDepreciacao` e
  `DepreciacaoPatrimonio` como fontes separadas de estado, parâmetro e histórico;
- manter a unicidade existente de
  `(patrimonioId, parametroDepreciacaoId, dataCompetencia)` como defesa final;
- persistir `dataCompetencia` como o primeiro dia da competência civil e
  `dataDepreciacao` como o instante do servidor;
- considerar vigente exatamente um parâmetro com `dataFim = null`; ausência
  torna o item inelegível e multiplicidade indica estado inconsistente que
  cancela a solicitação;
- considerar iniciado o parâmetro somente quando `dataInicio` for anterior ao
  primeiro dia da competência corrente;
- contar apenas depreciações do parâmetro vigente para obter
  `vidaUtilRestanteMeses = vidaUtilInicialMeses - quantidadeRealizada`;
- calcular `valorLiquidoAtual = valorBrutoAtual - depreciacaoAcumuladaAtual` e
  `quota = (valorLiquidoAtual - valorResidual) / vidaUtilRestanteMeses` usando
  decimal, sem conversão para `number`;
- limitar a quota ao saldo ainda depreciável e persistir até sete casas
  decimais; na última competência, absorver a diferença para que o novo valor
  líquido seja exatamente o residual;
- tratar vida restante não positiva com saldo ainda depreciável, acumulado
  negativo, valor líquido abaixo do residual ou relações incoerentes como erro
  de integridade, nunca como quota inventada;
- atualizar `depreciacaoAcumuladaAtual` e `updatedAt` e criar o registro
  `DepreciacaoPatrimonio` com valores anterior, depreciado e novo, parâmetro,
  comissão e usuário na mesma transação;
- revisar índices de parâmetro vigente, pendência por competência e locks a
  partir das queries e de `EXPLAIN`; não editar migrations aplicadas.

### API

- criar `apps/api/src/modules/depreciacoes/` seguindo as camadas existentes;
- registrar `DepreciacoesModule` no `AppModule`, importar `DatabaseModule` e
  `ComissoesModule` e consumir somente o service público de comissões;
- expor somente para `DIRETOR_PATRIMONIO`:
  - `GET /api/depreciacoes/pendentes`;
  - `POST /api/depreciacoes` para todos os elegíveis;
  - `POST /api/patrimonios/:patrimonioId/depreciacoes` para um único bem;
- exigir em todas as operações a competência textual corrente; comparar com o
  mês da data civil do servidor e rejeitar mês passado ou futuro;
- paginar os pendentes com ordenação determinística por número patrimonial e
  ID, calcular itens em lote e produzir agregados sem N+1;
- incluir como status depreciáveis `ATIVO`, `EMPRESTADO` e `EM_MANUTENCAO`;
  classificar `BAIXADO` como inelegível;
- aceitar uma única comissão por solicitação, validá-la como existente e
  vigente na data civil do processamento e revalidá-la sob lock dentro da
  transação, sem acessar `ComissoesRepository` diretamente;
- ao detectar itens que já estejam no residual, não escrever nada quando
  `confirmarIgnorarValorResidual` for falso e retornar conflito público estável
  cuja mensagem informe a quantidade ou o item;
- quando a confirmação for verdadeira, ignorar esses itens, processar os demais
  e contar separadamente os que atingirem o residual com a quota corrente;
- na execução em massa, considerar todos os patrimônios do estado transacional
  atual; a consulta anterior é uma prévia informativa, não uma lista enviada
  de volta pelo cliente;
- adquirir locks das situações/patrimônios candidatos em ordem determinística,
  revalidar todos os predicados depois do lock e impedir corrida com execução
  individual ou outra execução em massa;
- cancelar integralmente a transação diante de erro de integridade, conflito
  inesperado ou falha de persistência; itens inelegíveis esperados são apenas
  classificados e não provocam rollback;
- retornar na execução individual uma união discriminada entre a depreciação
  criada e o motivo de inelegibilidade, e somente agregados na execução em
  massa;
- derivar `createdById` da sessão e nunca aceitar valores calculados, auditoria,
  parâmetro ou situação contábil do cliente;
- preservar métricas por rota normalizada para duração, itens lidos,
  processados, ignorados, rollback e espera por lock, sem IDs como labels.

## Fora do escopo

- alterar os parâmetros de depreciação ou implementar reavaliação;
- estornar, editar ou excluir depreciação;
- processar competência passada ou futura, executar catch-up automático ou
  calcular fração diária no primeiro mês;
- aceitar lista ou quantidade arbitrária de patrimônios;
- scheduler, cron, fila, worker ou execução sem ação do Diretor;
- consulta geral do histórico, relatórios e lançamento no SIAFI;
- Web, mobile ou qualquer interface de confirmação.

## Decisões aprovadas

- A competência processável é sempre o mês civil corrente do servidor. Ela
  permanece no request como precondição explícita contra telas abertas durante
  a virada do mês.
- Adota-se a alternativa do MCASP de iniciar no mês seguinte à disponibilidade,
  sem fração inferior a um mês. Portanto, `dataInicio` dentro da competência
  corrente torna o item inelegível até o mês seguinte.
- Um cadastro tardio com `dataInicio` anterior pode aparecer numa nova execução
  da competência corrente. O sistema não reabre meses passados nem cria
  depreciação retroativa.
- Empréstimo, manutenção ou ociosidade temporária não suspendem a depreciação;
  somente baixa, falta de parâmetro, mês inicial, duplicidade e residual retiram
  o item da execução normal.
- A quota usa o valor ainda depreciável e a vida útil restante, preservando a
  proporcionalidade do diagrama mesmo após precisão decimal intermediária.
- A operação inteira é atômica, inclusive em massa. Esta decisão impede
  chunking com commits parciais; a implementação deve usar operações em lote,
  medir duração e não fazer fan-out ilimitado de queries Prisma.
- A reavaliação continua sendo a única forma futura de alterar valor bruto,
  residual ou vida útil. Esta tarefa apenas consome o parâmetro vigente.

## Critérios de aceite

- [ ] anônimo recebe `401`, administrador recebe `403` e Diretor pode consultar
      e executar;
- [ ] competência passada, futura, malformada ou que deixe de ser corrente
      durante a request não produz escrita;
- [ ] pendentes incluem bens ativos, emprestados e em manutenção e excluem os
      inelegíveis conforme motivo documentado;
- [ ] bem iniciado no mês corrente começa no mês seguinte; cadastro tardio não
      gera competência passada;
- [ ] comissão ausente, inexistente ou fora da vigência cancela a operação;
- [ ] execução sem confirmação diante de residual não altera nenhum item;
- [ ] cada sucesso cria um histórico e atualiza uma situação contábil na mesma
      transação, preservando exatamente o limite residual;
- [ ] dois processamentos concorrentes não duplicam patrimônio, parâmetro e
      competência nem deixam atualização perdida;
- [ ] erro induzido no meio de um lote deixa zero novos históricos e zero
      situações parcialmente atualizadas;
- [ ] listagem e mutação em massa não produzem N+1 nem response proporcional ao
      acervo, e possuem evidência com volume representativo;
- [ ] reavaliação, Web e mobile permanecem inalterados.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma` e nova migration, somente se os
  índices comprovados exigirem mudança;
- `packages/database/src/index.ts` e tipos necessários;
- `apps/api/src/modules/depreciacoes/`;
- `apps/api/src/modules/comissoes/`, apenas para reutilizar ou ampliar uma
  operação pública de validação/lock sem expor seu repository;
- `apps/api/src/app.module.ts`;
- testes unitários do módulo, E2E e teste PostgreSQL dedicado;
- documentação de estado e roadmaps, somente após verificação.

## Verificações esperadas

- `corepack pnpm --filter @repo/contracts lint`;
- `corepack pnpm --filter @repo/contracts typecheck`;
- `corepack pnpm --filter @repo/contracts test`;
- `corepack pnpm --filter @repo/database db:generate` antes do typecheck da API
  quando houver alteração do schema;
- `corepack pnpm --filter @repo/database lint`;
- `corepack pnpm --filter @repo/database typecheck`;
- `corepack pnpm --filter @repo/api lint`;
- `corepack pnpm --filter @repo/api typecheck`;
- `corepack pnpm --filter @repo/api test`;
- `corepack pnpm --filter @repo/api build`;
- migrations aplicadas desde banco vazio e sobre o schema anterior em
  PostgreSQL descartável;
- testes PostgreSQL reais de unicidade, locks, execução individual versus
  massa, rollback integral e limite residual;
- `EXPLAIN` das queries de pendentes e candidatos com massa representativa,
  registrando quantidade de queries, linhas e duração sem alegar capacidade de
  produção a partir do ambiente descartável;
- `corepack pnpm --filter @repo/web typecheck` e
  `corepack pnpm --filter @repo/mobile typecheck` como consumidores dos exports;
- `corepack pnpm format:check`;
- `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma de produto. Se a auditoria inicial encontrar mais de um parâmetro
  vigente por patrimônio ou dados contábeis incoerentes, a implementação deve
  retornar ao usuário antes de escolher correção ou migration de dados.
