# `FORNECEDORES-001` — Gerenciar fornecedores

**Status:** `concluída`

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

- [x] CNPJ inválido ou duplicado é rejeitado de modo previsível;
- [x] fornecedor inativo permanece consultável e não entra em novos vínculos;
- [x] inativação não rompe notas ou manutenções existentes;
- [x] acesso, paginação, responses e concorrência são testados.

## Arquivos ou módulos potencialmente afetados

- schema/migration e client de `@repo/database`, se necessários;
- `apps/api/src/modules/fornecedores/` e `apps/api/src/app.module.ts`;
- testes unitários, E2E e PostgreSQL do domínio;
- documentação de estado após verificação.

## Verificações esperadas

- [x] lint, typecheck, testes e build dos packages afetados;
- [x] E2E com Guards reais e teste PostgreSQL de unicidade;
- [x] `git diff --check` e formatação.

As verificações passaram em 19 de outubro de 2026. A suíte completa da API
passou com 280 testes; 28 integrações opt-in permaneceram ignoradas nessa
execução geral por dependerem de variáveis de banco próprias. Separadamente, um
PostgreSQL 17 local isolado recebeu as nove migrations e executou os dois testes
de integração de fornecedores, confirmando a unicidade concorrente do CNPJ e a
preservação de nota fiscal após a inativação. O banco isolado foi removido após
a validação.

## Resultado entregue

- cinco rotas administrativas de cadastro, consulta, listagem, alteração e
  situação, com DTOs Zod e responses por allowlist;
- CNPJ normalizado, validação contratual, conflito estável e unicidade garantida
  pelo PostgreSQL mesmo sob concorrência;
- busca paginada e determinística por razão social, nome fantasia,
  representante, CNPJ ou e-mail;
- inativação lógica idempotente, consulta de inativos e operação interna para
  impedir que consumidores futuros criem vínculos com fornecedor inativo;
- auditoria de criação derivada da identidade autenticada.

## Pendências ou decisões bloqueantes

- Nenhuma.
