# CONTRACTS-014 — contratos de reavaliação

**Status:** implementado e verificado em 29/10/2026

## Objetivo

Definir os contratos compartilhados para prévia, confirmação, consulta e opções de comissão da reavaliação patrimonial.

## Contexto e referências

- Requisitos: [RF14 e UC14](../requisitos-SIPAT.md).
- Contratos existentes: [roadmap](../contracts/roadmap.md) e [CONTRACTS-011](./CONTRACTS-011-contratos-depreciacoes-patrimoniais.md).
- Próxima etapa: [REAVALIACOES-001](./REAVALIACOES-001-api-persistencia-reavaliacoes.md).

## Escopo

- Schemas Zod estritos para itens (1 a 20, sem IDs repetidos), data civil, comissão, valor bruto, vida útil, residual em reais ou percentual, versão da prévia e chave de idempotência.
- Filtros paginados de lista, detalhe e opções; snapshots, respostas e códigos de erro públicos com exports e testes.

## Fora do escopo

- Prisma, cálculo, autorização e interface.

## Decisões aprovadas

- Diretor registra; Diretor e Administrador consultam.
- Percentual residual tem até duas casas e vai de zero a cem; valores monetários seguem decimal com até sete casas.
- A confirmação deve conferir uma versão da prévia e usar chave de idempotência.
- A criação do primeiro parâmetro exige `definirPrimeiroParametro: true` no item; a prévia retorna `PRIMEIRO_PARAMETRO_NECESSARIO` quando falta essa confirmação.

## Critérios de aceite

- [x] Rejeita propriedades extras, bens repetidos, residuais simultâneos, limites, decimais e datas inválidos.
- [x] Responses e exports passam nos consumidores.

## Verificações esperadas

- Lint, typecheck e testes de contratos; typecheck da API e Web.

## Pendências ou decisões bloqueantes

- O contrato valida a data civil. A política de mês corrente até hoje é aplicada pela API, conforme REAVALIACOES-001.
