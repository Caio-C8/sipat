# `FORNECEDORES-001` — Gerenciar fornecedores

**Status:** `aprovada`

## Objetivo

Implementar cadastro, consulta, alteração, ativação e inativação de
fornecedores usados em aquisições e manutenções.

## Contexto e referências

- Roadmap: [FORNECEDORES-001](../roadmap.md#fornecedores-001--gerenciar-fornecedores).
- Contratos: [CONTRACTS-005](./CONTRACTS-005-cadastros-patrimoniais-relacionados.md).
- Requisitos: [RF08 e UC08](../requisitos-SIPAT.md#rf08-gestão-de-fornecedores),
  RNF01, RNF03, RNF05 e RNF06.

## Escopo

- `GET /api/fornecedores`, `GET /api/fornecedores/:fornecedorId`,
  `POST /api/fornecedores`, `PATCH /api/fornecedores/:fornecedorId` e
  `PATCH /api/fornecedores/:fornecedorId/situacao`;
- acesso exclusivo de `ADMINISTRADOR`;
- validação e normalização de CNPJ e contatos conforme contrato aprovado;
- paginação, busca, filtros, auditoria e conflitos estáveis;
- inativação sem perda dos vínculos históricos.

## Fora do escopo

- exclusão física, processos de compra, notas, manutenções, Web e mobile.

## Critérios de aceite

- [ ] CNPJ inválido ou duplicado é rejeitado de modo previsível;
- [ ] fornecedor inativo permanece consultável e não entra em novos vínculos;
- [ ] inativação não rompe notas ou manutenções existentes;
- [ ] acesso, paginação, responses e concorrência são testados.

## Arquivos ou módulos potencialmente afetados

- schema/migration e client de `@repo/database`, se necessários;
- `apps/api/src/modules/fornecedores/` e `apps/api/src/app.module.ts`;
- testes unitários, E2E e PostgreSQL do domínio;
- documentação de estado após verificação.

## Verificações esperadas

- lint, typecheck, testes e build dos packages afetados;
- E2E com Guards reais e teste PostgreSQL de unicidade;
- `git diff --check` e formatação.

## Pendências ou decisões bloqueantes

- Nenhuma.
