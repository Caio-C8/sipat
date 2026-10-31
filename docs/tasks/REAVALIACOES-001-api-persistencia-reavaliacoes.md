# REAVALIACOES-001 — API e persistência de reavaliações

**Status:** implementado e verificado em 29/10/2026

## Objetivo

Registrar reavaliações individuais ou de até 20 bens com histórico imutável, troca do parâmetro vigente e atualização contábil atômica.

## Contexto e referências

- [RF14, RF15 e UC14](../requisitos-SIPAT.md); [CONTRACTS-014](./CONTRACTS-014-contratos-reavaliacoes.md); [DEPRECIACOES-001](./DEPRECIACOES-001-consultar-executar-depreciacoes.md).

## Escopo

- Migration apenas para snapshots, data civil, vínculos e idempotência necessários.
- Prévia, confirmação, lista, detalhe e opções de comissão com contratos compartilhados.
- Cálculo decimal no servidor, revalidação sob transação serializável, locks em ordem estável e rollback integral.
- Encerrar o parâmetro anterior quando existir, criar o novo, zerar o acumulado do ciclo atual e preservar parâmetros e lançamentos anteriores. Um bem sem qualquer parâmetro pode receber o primeiro mediante confirmação explícita, sem snapshot fictício anterior.
- Ajustar a competência de depreciação para o dia civil de `America/Sao_Paulo`.

## Fora do escopo

- Recálculo retroativo, edição, estorno, exclusão, PDF, upload, scheduler e bloqueio de inventário.

## Decisões aprovadas

- Diretor registra; Diretor e Administrador consultam.
- `BAIXADO` é inelegível; `ATIVO`, `EMPRESTADO` e `EM_MANUTENCAO` são admitidos.
- Bem elegível com depreciação pendente no mês corrente deve ser depreciado antes da reavaliação. Bem no residual ou ainda no mês inicial não é bloqueado por essa condição.
- A data civil institucional da reavaliação e da competência é `America/Sao_Paulo`.
- A data de referência é limitada ao mês corrente até hoje nesse fuso.
- Sem situação contábil, a operação falha. Sem parâmetro vigente, somente bens que nunca tiveram parâmetro e têm acumulado zero podem receber o primeiro com confirmação explícita; históricos com parâmetro encerrado continuam bloqueados.
- Todos os bens de uma confirmação são gravados ou nenhum; reenvio idêntico retorna o resultado anterior.

## Critérios de aceite

- [x] Valores e snapshots anteriores e novos são corretos, com somente um parâmetro vigente por bem.
- [x] Histórico e depreciações anteriores são preservados; a próxima depreciação usa o novo parâmetro.
- [x] Confirmações concorrentes, baixa após a prévia, mudança contábil e reenvio são revalidados sem duplicação ou atualização perdida.
- [x] Erro em um item desfaz todo o pedido.

## Verificações esperadas

- Lint, tipos, testes e build da API passaram; nove E2E HTTP/PostgreSQL passaram.
- Migration aplicada desde a base vazia em dois bancos descartáveis; registro legado sem snapshots foi consultado com campos nulos, sem inventar dados.
- Não foi executada migração sobre uma base legada previamente populada nem corrida simultânea com o serviço de baixa ou depreciação.

## Pendências ou decisões bloqueantes

- Nenhuma decisão de produto pendente.
