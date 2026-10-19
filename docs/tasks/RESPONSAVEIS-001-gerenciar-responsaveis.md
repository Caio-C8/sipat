# `RESPONSAVEIS-001` — Gerenciar responsáveis

**Status:** `concluída`

## Objetivo

Implementar cadastro, consulta, alteração e inativação de responsáveis, com
preservação dos vínculos históricos.

## Contexto e referências

- Roadmap: [RESPONSAVEIS-001](../roadmap.md#responsaveis-001--gerenciar-responsaveis).
- Contratos: [CONTRACTS-005](./CONTRACTS-005-cadastros-patrimoniais-relacionados.md).
- Requisitos: [RF03 e UC03](../requisitos-SIPAT.md#rf03-gestão-de-responsáveis),
  RNF01, RNF03, RNF05 e RNF06.
- API: [índice](../apps/api/README.md) e
  [workflow](../apps/api/workflow-and-testing.md).

## Escopo

- `GET /api/responsaveis` e `GET /api/responsaveis/:responsavelId`;
- `POST /api/responsaveis` e `PATCH /api/responsaveis/:responsavelId`;
- `PATCH /api/responsaveis/:responsavelId/situacao`;
- acesso exclusivo de `ADMINISTRADOR`;
- matrícula obrigatória, paginação, busca, auditoria e conflitos estáveis;
- inativação sem exclusão física e sem romper históricos.

## Fora do escopo

- usuários, comissões, setores, Web e mobile.

## Critérios de aceite

- [x] anônimo recebe `401` e diretor recebe `403`;
- [x] matrícula ausente ou duplicada é rejeitada de modo previsível;
- [x] responsável inativo permanece consultável e nos vínculos históricos;
- [x] listagem é paginada e determinística;
- [x] auditoria deriva da sessão.

## Arquivos ou módulos potencialmente afetados

- schema/migration e client de `@repo/database`, se necessários;
- `apps/api/src/modules/responsaveis/` e `apps/api/src/app.module.ts`;
- testes unitários, E2E e PostgreSQL do domínio;
- documentação de estado após verificação.

## Verificações esperadas

- [x] geração do Prisma Client e aplicação da migration desde banco vazio;
- [x] lint, typecheck e testes de contratos; lint e typecheck de banco; lint,
      typecheck, testes e build da API;
- [x] E2E com Guards reais e concorrência de matrícula no PostgreSQL;
- [x] `git diff --check` e formatação.

As verificações passaram em 19 de outubro de 2026. A integração aplicou as nove
migrations em um PostgreSQL 17 temporário e confirmou que duas criações
concorrentes com a mesma matrícula produzem exatamente um sucesso e um conflito
público estável. A suíte completa da API passou com 232 testes; 19 testes de
integração de outros domínios permaneceram ignorados por dependerem de variáveis
de banco próprias. O banco temporário foi removido após a validação.

## Pendências ou decisões bloqueantes

- Nenhuma.
