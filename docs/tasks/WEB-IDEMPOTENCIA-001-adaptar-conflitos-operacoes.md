# WEB-IDEMPOTENCIA-001 — Adaptar conflitos de operações na Web

**Status:** aprovada

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

- [ ] Os quatro fluxos usam a mesma chave em reenvio de resultado incerto.
- [ ] O usuário distingue operação já concluída, chave reutilizada, operação em
      processamento e falha real.
- [ ] O `409` de operação já concluída não duplica toast, navegação ou mutation.
- [ ] Consultas afetadas são atualizadas sem limpar dados corrigíveis.
- [ ] Testes cobrem timeout/reenvio, payload alterado, duplo clique e os três
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

- Depende de `CONTRACTS-016` e `IDEMPOTENCIA-001` verificados.
