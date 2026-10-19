# `SETORES-001` — Gerenciar setores

**Status:** `concluída`

## Objetivo

Implementar cadastro, consulta, alteração, ativação e inativação de setores com
responsável atual obrigatório.

## Contexto e referências

- Roadmap: [SETORES-001](../roadmap.md#setores-001--gerenciar-setores).
- Contratos: [CONTRACTS-005](./CONTRACTS-005-cadastros-patrimoniais-relacionados.md).
- Dependência: [RESPONSAVEIS-001](./RESPONSAVEIS-001-gerenciar-responsaveis.md).
- Requisitos: [RF04 e UC04](../requisitos-SIPAT.md#rf04-gestão-de-setores),
  RNF01, RNF05, RNF06, RN08, RN18 e RN19.

## Escopo

- `GET /api/setores`, `GET /api/setores/:setorId`, `POST /api/setores`,
  `PATCH /api/setores/:setorId` e `PATCH /api/setores/:setorId/situacao`;
- acesso exclusivo de `ADMINISTRADOR`;
- responsável ativo obrigatório em novos vínculos;
- inativação sem exclusão física e preservação dos vínculos;
- paginação, busca, filtros, auditoria e conflitos estáveis.

## Fora do escopo

- transferências, inventários, gestão de responsáveis, Web e mobile.

## Critérios de aceite

- [x] setor não é criado sem responsável ativo;
- [x] setor inativo não pode receber novos vínculos patrimoniais;
- [x] inativação não apaga patrimônios ou históricos;
- [x] troca de responsável mantém integridade e auditoria;
- [x] acesso, paginação e concorrência são testados.

## Arquivos ou módulos potencialmente afetados

- schema/migration e client de `@repo/database`, se necessários;
- `apps/api/src/modules/setores/` e dependência de responsáveis por service;
- `apps/api/src/app.module.ts` e testes do domínio;
- documentação de estado após verificação.

## Verificações esperadas

- [x] lint, typecheck, testes e build dos packages afetados;
- [x] E2E com Guards reais e integração com patrimônios;
- [x] testes PostgreSQL das regras de situação;
- [x] `git diff --check` e formatação.

As verificações passaram em 19 de outubro de 2026. A suíte completa da API
passou com 267 testes e manteve 26 testes de integração ignorados por dependerem
de variáveis de banco próprias. Em seguida, um PostgreSQL 17 temporário recebeu
as nove migrations desde um banco vazio e executou os três testes de integração
de setores, incluindo a corrida entre cadastro patrimonial e inativação. O banco
temporário foi removido após a validação.

## Pendências ou decisões bloqueantes

- Nenhuma.
