# CONTRACTS-013 — Contratos de manutenção

**Status:** implementada e verificada em ambiente de teste em 29/10/2026.

## Objetivo

Definir os contratos compartilhados das operações de manutenção de patrimônios.

## Contexto e referências

- [Roadmap de contratos](../contracts/roadmap.md)
- [RF18 e UC18](../requisitos-SIPAT.md)
- [Convenções de contratos](../contracts/conventions.md)

## Escopo

- Schemas Zod de filtros, seletores, parâmetros, criação, orçamento, retorno, documentos, respostas e erros.
- Tipos e exports públicos para API e Web.
- Testes dos limites, campos ausentes, `null`, campos desconhecidos e repetição.

## Fora do escopo

- Persistência, endpoints, Web e numeração institucional `MAN-...`.

## Decisões aprovadas

- Fornecedor, tipo e previsão pertencem a cada item; comissão e data de envio pertencem ao pedido.
- PDF do pedido é opcional; documentos de item têm fase `ENVIO` ou `RECEBIMENTO`.
- Orçamento por item possui versões; retorno único admite garantia com descrição e data final opcional.
- Usar UUID do pedido como referência inequívoca.

## Critérios de aceite

- [x] Todas as operações aprovadas possuem entrada e resposta explícitas.
- [x] Limites e distinção entre ausência, `null` e valor são testados.
- [x] Respostas não expõem chaves nem caminhos de armazenamento.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/manutencao/`, `packages/contracts/src/index.ts`.

## Verificações esperadas

- Lint, typecheck, testes de `@repo/contracts` e importação pelo entrypoint público.

## Resultado verificado

- Schemas, tipos, códigos de erro e exports em `src/manutencao/` e no entrypoint público.
- `@repo/contracts`: 127 testes aprovados, typecheck e lint sem erros. O pacote tinha 123 testes antes desta entrega.
- Responses validadas pelo mesmo contrato nos testes HTTP da API e no percurso Web integrado.

## Pendências ou decisões bloqueantes

- Nenhuma identificada no planejamento aprovado.
