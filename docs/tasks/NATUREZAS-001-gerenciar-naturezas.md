# `NATUREZAS-001` — Gerenciar naturezas de bens

**Status:** `aprovada`

## Objetivo

Implementar cadastro, consulta e alteração de naturezas, com normalização e
unicidade definidas pelo servidor.

## Contexto e referências

- Roadmap: [NATUREZAS-001](../roadmap.md#naturezas-001--gerenciar-naturezas-de-bens).
- Contratos: [CONTRACTS-005](./CONTRACTS-005-cadastros-patrimoniais-relacionados.md).
- Requisitos: [RF06 e UC06](../requisitos-SIPAT.md#rf06-gestão-de-naturezas-de-bens),
  RNF03, RNF05 e RNF06.
- API: [índice](../apps/api/README.md) e
  [workflow](../apps/api/workflow-and-testing.md).

## Escopo

- `GET /api/naturezas`, `GET /api/naturezas/:naturezaId`,
  `POST /api/naturezas` e `PATCH /api/naturezas/:naturezaId`;
- acesso exclusivo de `ADMINISTRADOR`;
- nome normalizado e auditoria controlados pelo servidor;
- conflito por nome equivalente sem acento ou diferença de capitalização;
- paginação, busca e ordenação determinística.

## Fora do escopo

- exclusão, inativação, espécies, Web e mobile.

## Critérios de aceite

- [ ] nomes semanticamente duplicados são rejeitados;
- [ ] cliente não controla `nomeNormalizado` nem auditoria;
- [ ] natureza vinculada continua preservada após alteração;
- [ ] acesso, paginação e responses são cobertos por testes.

## Arquivos ou módulos potencialmente afetados

- schema/migration e client de `@repo/database`, se necessários;
- `apps/api/src/modules/naturezas/` e `apps/api/src/app.module.ts`;
- testes unitários, E2E e PostgreSQL do domínio;
- documentação de estado após verificação.

## Verificações esperadas

- lint, typecheck, testes e build dos packages afetados;
- E2E com Guards reais e conflito concorrente de nome normalizado;
- `git diff --check` e formatação.

## Pendências ou decisões bloqueantes

- Nenhuma.
