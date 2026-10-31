# CONTRACTS-015 — Contratos de empréstimos e devoluções

**Status:** concluída (31/10/2026)

## Objetivo

Definir contratos Zod 4 compartilhados para as seis operações de RF16.

## Contexto e referências

- [RF16/UC16 e decisões](../requisitos-SIPAT.md)
- [Roadmap de contratos](../contracts/roadmap.md)
- [Convenções](../contracts/conventions.md)

## Escopo

- Bodies, queries, params, respostas, erros públicos, tipos e exports para opções de bens/comissões, lista, detalhe, saída e devolução.
- Paginação padrão 1/20, máximo 50; até 50 bens por confirmação; arrays sem duplicidade e datas civis válidas.

## Fora do escopo

- API, persistência, Web, renovação, estorno, anexos, termos ou numeração sequencial.

## Decisões aprovadas

- O modo de agrupamento é explícito, inclusive para um bem; registros antigos com campos nulos devem ser legíveis.
- A identidade pública é UUID. Entradas mutáveis incluem chave UUID de idempotência.

## Critérios de aceite

- [x] Contratos das seis rotas testados e exportados.
- [x] Campos, datas, filtros, duplicidades, parcialidade e legados cobertos.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/emprestimo/` e `packages/contracts/src/index.ts`.

## Verificações esperadas

- Lint, tipos e testes de contratos; consumidores após integração.

**Evidência:** `@repo/contracts`: 138 testes, lint e typecheck aprovados; API e Web consumidoras também passaram em tipos, testes e build.

## Pendências ou decisões bloqueantes

- Nenhuma decisão de produto pendente identificada no plano aprovado.
