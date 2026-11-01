# WEB-IDEMPOTENCIA-001 — Adaptar conflitos de operações na Web

**Status:** concluída e verificada em 31/10/2026; regressão de CI corrigida e
revalidada em 01/11/2026

## Objetivo

Adaptar as interfaces Web já existentes à resposta explícita de operação
processada, sem redesenhar telas, criar rotas ou esconder o conflito do usuário.

## Contexto e referências

- [CONTRACTS-016](./CONTRACTS-016-idempotencia-operacoes-criticas.md)
- [IDEMPOTENCIA-001](./IDEMPOTENCIA-001-api-persistencia-operacoes-criticas.md)
- [Roadmap Web](../apps/web/roadmap.md#web-idempotencia-001--adaptar-conflitos-de-operacoes)
- [Integração Web–API](../integrations/web-api/README.md)

## Escopo

- Atualizar movimentações, manutenções, reavaliações e empréstimos, que já
  enviam chaves de idempotência.
- Gerar uma chave ao iniciar uma confirmação e preservá-la enquanto payload e
  resultado permanecerem incertos.
- Gerar nova chave quando o usuário alterar o payload depois de uma falha
  conclusiva ou iniciar deliberadamente outra operação.
- Não fazer retry automático.
- Para `OPERACAO_JA_PROCESSADA`, exibir em área de status/alerta:
  “Esta operação já havia sido concluída. Nenhuma nova alteração foi feita.”
- Após esse conflito, invalidar/atualizar somente as consultas relacionadas e
  oferecer a navegação já existente para lista ou detalhe. Não converter o
  `409` em sucesso silencioso.
- Tratar `CHAVE_IDEMPOTENCIA_REUTILIZADA` como erro que exige nova confirmação
  e chave; tratar `OPERACAO_EM_PROCESSAMENTO` como estado temporário, mantendo
  chave e dados para nova tentativa manual.
- Preservar preenchimento, foco, acessibilidade e bloqueio de duplo clique.

## Fora do escopo

- Criar telas para processos, notas, comissões, setores ou fornecedores ainda
  não consumidos pela Web.
- Alterar layout, fluxo funcional, permissões, rotas ou responses de sucesso.
- Polling ou retry automático.

## Critérios de aceite

- [x] Os quatro fluxos usam a mesma chave em reenvio de resultado incerto.
- [x] O usuário distingue operação já concluída, chave reutilizada, operação em
      processamento e falha real.
- [x] O `409` de operação já concluída não duplica toast, navegação ou mutation.
- [x] Consultas afetadas são atualizadas sem limpar dados corrigíveis.
- [x] Testes cobrem timeout/reenvio, payload alterado, duplo clique e os três
      códigos públicos.

## Arquivos ou módulos potencialmente afetados

- `apps/web/lib/api/core/`
- `apps/web/features/movimentacoes/`
- `apps/web/features/manutencoes/`
- `apps/web/features/reavaliacoes/`
- `apps/web/features/emprestimos/`
- E2E Web–API dos quatro fluxos

## Verificações esperadas

- Lint, typecheck, testes e build de `@repo/web`.
- E2E integrado com PostgreSQL descartável e API real.
- Teclado, foco, `role=alert/status`, viewport estreita e axe nos painéis
  alterados.

## Pendências ou decisões bloqueantes

- Nenhuma.

## Resultado verificado

- Movimentações, criações/retornos/documentos de manutenção, confirmações de
  reavaliação e saídas/devoluções de empréstimo preservam a mesma chave em
  resultado incerto ou processamento. Uma falha conclusiva descarta a chave
  somente quando não há resultado anterior ainda incerto; por exemplo, um
  `401` durante a recuperação não prova que a tentativa anterior com `503`
  deixou de ser processada. Reutilização incompatível continua descartando a
  chave e exigindo nova confirmação.
- `OPERACAO_JA_PROCESSADA` permanece `409`, apresenta a mensagem aprovada em
  `role=status`, atualiza somente as leituras relacionadas e oferece a rota de
  lista ou detalhe existente, sem replay, toast duplicado ou nova mutation.
- `CHAVE_IDEMPOTENCIA_REUTILIZADA` exige nova confirmação e chave;
  `OPERACAO_EM_PROCESSAMENTO` mantém dados e chave para retry exclusivamente
  manual. O bloqueio síncrono compartilhado impede duplo clique concorrente.
- Os formulários, foco programático e navegação existentes foram preservados;
  nenhuma tela, rota, permissão ou response de sucesso foi criada ou alterada.

## Verificações executadas

- Em 31/10/2026, `@repo/web`: lint, typecheck, 67 testes e build de produção
  aprovados.
- Em 31/10/2026, Playwright Web → API → PostgreSQL descartável: movimentações
  (5), manutenções (1), reavaliações (1) e empréstimos (1) aprovados em
  Chromium. Os cenários simulam resposta perdida após commit, reenvio com a
  mesma chave, conflito explícito, ausência de duplicação e atualização da
  leitura.
- Em 01/11/2026, após a falha observada na CI, o cenário mockado de movimentação
  foi corrigido para cobrir `503`, tentativa manual com `401`, recarga e `409`
  com `OPERACAO_JA_PROCESSADA`. A mesma chave e o mesmo payload permanecem
  recuperáveis após o `401`; o `409` continua explícito, atualiza a consulta e
  não é convertido em sucesso.
- Na revalidação de 01/11/2026: lint dos dois arquivos alterados, 67 testes
  unitários e build de produção aprovados; Playwright focal com 1 cenário
  aprovado e suíte Web completa com 29 aprovados e 8 ignorados. Os ignorados
  são os E2E que exigem API e PostgreSQL descartáveis, não configurados nessa
  execução local.
- Os E2E mantêm as verificações existentes de viewport estreita e axe nos
  percursos aplicáveis. A automação não substitui inspeção manual completa com
  teclado, leitor de tela ou navegadores adicionais.
