# `ESPECIES-001` — Gerenciar espécies de bens

**Status:** `aprovada`

## Objetivo

Implementar cadastro, consulta e alteração de espécies, sempre vinculadas a uma
única natureza existente.

## Contexto e referências

- Roadmap: [ESPECIES-001](../roadmap.md#especies-001--gerenciar-espécies-de-bens).
- Contratos: [CONTRACTS-005](./CONTRACTS-005-cadastros-patrimoniais-relacionados.md).
- Dependência: [NATUREZAS-001](./NATUREZAS-001-gerenciar-naturezas.md).
- Requisitos: [RF07 e UC07](../requisitos-SIPAT.md#rf07-gestão-de-espécies-de-bens),
  RNF03, RNF05, RNF06, RN16 e RN17.

## Escopo

- `GET /api/especies`, `GET /api/especies/:especieId`,
  `POST /api/especies` e `PATCH /api/especies/:especieId`;
- acesso exclusivo de `ADMINISTRADOR`;
- vínculo obrigatório a uma natureza e alteração controlada desse vínculo;
- nome normalizado, unicidade, paginação, busca e auditoria.

## Fora do escopo

- exclusão, inativação, gestão de naturezas, Web e mobile.

## Critérios de aceite

- [ ] espécie sem natureza ou com natureza inexistente é rejeitada;
- [ ] cada espécie possui exatamente uma natureza;
- [ ] duplicidade normalizada é protegida inclusive sob concorrência;
- [ ] alteração preserva patrimônios já vinculados à espécie;
- [ ] acesso e responses são cobertos por testes.

## Arquivos ou módulos potencialmente afetados

- schema/migration e client de `@repo/database`, se necessários;
- `apps/api/src/modules/especies/` e dependência de naturezas por service;
- `apps/api/src/app.module.ts` e testes do domínio;
- documentação de estado após verificação.

## Verificações esperadas

- lint, typecheck, testes e build dos packages afetados;
- E2E com Guards reais e integração com naturezas;
- teste PostgreSQL de unicidade concorrente;
- `git diff --check` e formatação.

## Pendências ou decisões bloqueantes

- Nenhuma.
