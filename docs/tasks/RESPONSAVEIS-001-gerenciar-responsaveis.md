# `RESPONSAVEIS-001` — Gerenciar responsáveis

**Status:** `aprovada`

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

- [ ] anônimo recebe `401` e diretor recebe `403`;
- [ ] matrícula ausente ou duplicada é rejeitada de modo previsível;
- [ ] responsável inativo permanece consultável e nos vínculos históricos;
- [ ] listagem é paginada e determinística;
- [ ] auditoria deriva da sessão.

## Arquivos ou módulos potencialmente afetados

- schema/migration e client de `@repo/database`, se necessários;
- `apps/api/src/modules/responsaveis/` e `apps/api/src/app.module.ts`;
- testes unitários, E2E e PostgreSQL do domínio;
- documentação de estado após verificação.

## Verificações esperadas

- geração do Prisma Client e validação da migration quando houver;
- lint, typecheck, testes e build de contratos, banco e API afetados;
- E2E com Guards reais e concorrência de matrícula;
- `git diff --check` e formatação.

## Pendências ou decisões bloqueantes

- Nenhuma.
