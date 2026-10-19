# `SETORES-001` — Gerenciar setores

**Status:** `aprovada`

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

- [ ] setor não é criado sem responsável ativo;
- [ ] setor inativo não pode receber novos vínculos patrimoniais;
- [ ] inativação não apaga patrimônios ou históricos;
- [ ] troca de responsável mantém integridade e auditoria;
- [ ] acesso, paginação e concorrência são testados.

## Arquivos ou módulos potencialmente afetados

- schema/migration e client de `@repo/database`, se necessários;
- `apps/api/src/modules/setores/` e dependência de responsáveis por service;
- `apps/api/src/app.module.ts` e testes do domínio;
- documentação de estado após verificação.

## Verificações esperadas

- lint, typecheck, testes e build dos packages afetados;
- E2E com Guards reais e integração com patrimônios;
- testes PostgreSQL das regras de situação;
- `git diff --check` e formatação.

## Pendências ou decisões bloqueantes

- Nenhuma.
